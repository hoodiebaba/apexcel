// src/app/api/admin/dashboard/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

/* ------------ Types ------------ */
type Role = "sudo" | "admin" | "editor";

type MeBase = {
  id: string;
  role: Role;
  username: string;
  email: string;
  phone: string | null;
  status: string;
  permissions: string[];
};

type MeActive = MeBase;
type MeInactive = MeBase & { inactive: true };

/* ------------ Auth ------------ */
async function getMe(): Promise<MeActive | MeInactive | null> {
  const jar = await cookies();
  const token = jar.get("admin_token")?.value || jar.get("sudo_token")?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "apex-secret"
    ) as any;

    const meDb = await prisma.admin.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        role: true,
        username: true,
        email: true,
        phone: true,
        status: true,
        permissions: true,
      },
    });
    if (!meDb) return null;

    // Ensure role is one of our Role literals
    const allowed = ["sudo", "admin", "editor"] as const;
    const role: Role = allowed.includes(meDb.role as Role)
      ? (meDb.role as Role)
      : "admin";

    const common: MeBase = {
      id: meDb.id,
      role,
      username: meDb.username,
      email: meDb.email,
      phone: meDb.phone,
      status: meDb.status,
      permissions: meDb.permissions ?? [],
    };

    if (common.status !== "active") return { ...common, inactive: true };
    return common;
  } catch {
    return null;
  }
}

// Case-insensitive permission match
function hasPerm(me: { role: Role; permissions?: string[] } | null, perm: string) {
  if (!me) return false;
  if (me.role === "sudo") return true;
  const want = perm.toLowerCase();
  return (me.permissions || []).some((p) => (p || "").toLowerCase() === want);
}

/* ------------ GET ------------ */
export async function GET(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ("inactive" in me) {
    return NextResponse.json({ error: "Inactive" }, { status: 403 });
  }

  // Permission: "Dashboard:page_view"
  if (!hasPerm(me, "Dashboard:page_view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const now = new Date();
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    const isSudo = me.role === "sudo";

    // Vendors
    const vendorWhereSelf = { kycBy: me.id };
    const totalVendors = isSudo
      ? await prisma.vendor.count()
      : await prisma.vendor.count({ where: vendorWhereSelf });

    const oldVendors = isSudo
      ? await prisma.vendor.count({ where: { createdAt: { lt: fifteenDaysAgo } } })
      : await prisma.vendor.count({
          where: { ...vendorWhereSelf, createdAt: { lt: fifteenDaysAgo } },
        });

    const vendorGrowth =
      oldVendors === 0 ? 0 : Number((((totalVendors - oldVendors) / oldVendors) * 100).toFixed(2));

    // Customers
    const customerWhereSelf = { kycBy: me.id };
    const totalCustomers = isSudo
      ? await prisma.customer.count()
      : await prisma.customer.count({ where: customerWhereSelf });

    const oldCustomers = isSudo
      ? await prisma.customer.count({ where: { createdAt: { lt: fifteenDaysAgo } } })
      : await prisma.customer.count({
          where: { ...customerWhereSelf, createdAt: { lt: fifteenDaysAgo } },
        });

    const customerGrowth =
      oldCustomers === 0 ? 0 : Number((((totalCustomers - oldCustomers) / oldCustomers) * 100).toFixed(2));

    // Active loads ratio = GLOBAL (total sab ka) vs 1000
    const activeLoadsGlobal = await prisma.load.count({
      where: { totalAmount: { gt: 0 } },
    });
    const activeLoadRatio = Number(((activeLoadsGlobal / 1000) * 100).toFixed(2));

    // Monthly loads: sudo → global; admin → sirf uske banaye
    const selfLoadFilter = isSudo
      ? {}
      : {
          AND: [
            { createdBy: "admin" },
            {
              OR: [
                me.email ? { creatorEmail: me.email } : undefined,
                me.username ? { creatorName: me.username } : undefined,
                me.phone ? { creatorPhone: me.phone } : undefined,
              ].filter(Boolean) as any[],
            },
          ],
        };

    const loads = await prisma.load.findMany({
      where: selfLoadFilter as any,
      select: { createdAt: true },
    });

    const monthlyLoads = Array.from({ length: 12 }, (_, i) => {
      const monthName = new Date(now.getFullYear(), i).toLocaleString("en-US", { month: "short" });
      const count = loads.filter((l) => new Date(l.createdAt).getMonth() === i).length;
      return { month: monthName, count };
    });

    // Recent Users: sudo → global; admin → kycBy=self
    const recentVendors = await prisma.vendor.findMany({
      where: isSudo ? {} : vendorWhereSelf,
      take: 3,
      orderBy: { createdAt: "desc" },
      select: { vendorName: true, companyName: true, phone: true, kycStatus: true },
    });

    const recentCustomers = await prisma.customer.findMany({
      where: isSudo ? {} : customerWhereSelf,
      take: 2,
      orderBy: { createdAt: "desc" },
      select: { customerName: true, companyName: true, phone: true, kycStatus: true },
    });

    const recentUsers = [
      ...recentVendors.map((v) => ({
        name: v.vendorName,
        type: "Vendor",
        company: v.companyName,
        phone: v.phone,
        kycStatus: v.kycStatus,
      })),
      ...recentCustomers.map((c) => ({
        name: c.customerName,
        type: "Customer",
        company: c.companyName,
        phone: c.phone,
        kycStatus: c.kycStatus,
      })),
    ];

    return NextResponse.json({
      stats: {
        vendors: { total: totalVendors, growth: vendorGrowth },
        customers: { total: totalCustomers, growth: customerGrowth },
      },
      activeLoads: {
        ratio: activeLoadRatio,
        subtitle: "Based on 1000 loads target per month (global)",
      },
      monthlyLoads,
      recentUsers,
    });
  } catch (error) {
    console.error("Admin Dashboard API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}