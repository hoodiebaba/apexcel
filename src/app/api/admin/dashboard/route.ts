import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

/* ---------- helpers ---------- */
type Role = "admin";
type Me = {
  id: string;
  role: Role;
  username: string;
  email: string;
  phone: string | null;
  status: string;
  permissions: string[];
};

function decode(token?: string | null) {
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET || "apex-secret") as any;
  } catch {
    return null;
  }
}

async function getAdminDecoded(req: Request) {
  // optional: Authorization: Bearer <token>
  const h = req.headers.get("authorization");
  const bearer = h?.startsWith("Bearer ") ? h.slice(7) : null;
  let d = decode(bearer);
  if (d) return d;

  // only admin_token from cookies
  const jar = await cookies();
  const adminTok = jar.get("admin_token")?.value || null;
  d = decode(adminTok);
  return d;
}

function logoutResponse(json: Record<string, any>, status = 401) {
  const res = NextResponse.json(json, { status });
  res.cookies.set("admin_token", "", {
    httpOnly: true, sameSite: "lax", path: "/", expires: new Date(0),
  });
  res.cookies.set("sudo_token", "", {
    httpOnly: true, sameSite: "lax", path: "/", expires: new Date(0),
  });
  return res;
}

function hasPerm(me: { permissions?: string[] }, perm: string) {
  const want = perm.toLowerCase();
  return (me.permissions || []).some((p) => (p || "").toLowerCase() === want);
}

/* ---------- GET ---------- */
export async function GET(req: Request) {
  // auth
  const decoded = await getAdminDecoded(req);
  if (!decoded) return logoutResponse({ error: "Unauthorized" }, 401);

  const row = await prisma.admin.findUnique({
    where: { id: decoded.id },
    select: {
      id: true, role: true, username: true, email: true, phone: true,
      status: true, permissions: true,
    },
  });
  if (!row) return logoutResponse({ error: "Unauthorized" }, 401);

  // admin area: sudo not allowed
  if (row.role !== "admin") return logoutResponse({ error: "Forbidden" }, 401);

  // status gate
  if (row.status !== "active") return logoutResponse({ error: "Account inactive" }, 401);

  // permission gate
  if (!hasPerm(row, "Dashboard:page_view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const now = new Date();
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

    // Vendors (self only)
    const vendorWhereSelf = { kycBy: row.id };
    const totalVendors = await prisma.vendor.count({ where: vendorWhereSelf });
    const oldVendors = await prisma.vendor.count({
      where: { ...vendorWhereSelf, createdAt: { lt: fifteenDaysAgo } },
    });
    const vendorGrowth =
      oldVendors === 0 ? 0 : Number((((totalVendors - oldVendors) / oldVendors) * 100).toFixed(2));

    // Customers (self only)
    const customerWhereSelf = { kycBy: row.id };
    const totalCustomers = await prisma.customer.count({ where: customerWhereSelf });
    const oldCustomers = await prisma.customer.count({
      where: { ...customerWhereSelf, createdAt: { lt: fifteenDaysAgo } },
    });
    const customerGrowth =
      oldCustomers === 0 ? 0 : Number((((totalCustomers - oldCustomers) / oldCustomers) * 100).toFixed(2));

    // Active loads ratio (global example)
    const activeLoadsGlobal = await prisma.load.count({ where: { totalAmount: { gt: 0 } } });
    const activeLoadRatio = Number(((activeLoadsGlobal / 1000) * 100).toFixed(2));

    // Monthly loads (admin → created by this admin)
    const loads = await prisma.load.findMany({
      where: {
        AND: [
          { createdBy: "admin" },
          {
            OR: [
              row.email ? { creatorEmail: row.email } : undefined,
              row.username ? { creatorName: row.username } : undefined,
              row.phone ? { creatorPhone: row.phone } : undefined,
            ].filter(Boolean) as any[],
          },
        ],
      },
      select: { createdAt: true },
    });

    const monthlyLoads = Array.from({ length: 12 }, (_, i) => {
      const monthName = new Date(now.getFullYear(), i).toLocaleString("en-US", { month: "short" });
      const count = loads.filter((l) => new Date(l.createdAt).getMonth() === i).length;
      return { month: monthName, count };
    });

    // Recent users (self only)
    const recentVendors = await prisma.vendor.findMany({
      where: vendorWhereSelf,
      take: 3,
      orderBy: { createdAt: "desc" },
      select: { vendorName: true, companyName: true, phone: true, kycStatus: true },
    });
    const recentCustomers = await prisma.customer.findMany({
      where: customerWhereSelf,
      take: 2,
      orderBy: { createdAt: "desc" },
      select: { customerName: true, companyName: true, phone: true, kycStatus: true },
    });

    const recentUsers = [
      ...recentVendors.map((v) => ({ name: v.vendorName, type: "Vendor", company: v.companyName, phone: v.phone, kycStatus: v.kycStatus })),
      ...recentCustomers.map((c) => ({ name: c.customerName, type: "Customer", company: c.companyName, phone: c.phone, kycStatus: c.kycStatus })),
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
  } catch (e) {
    console.error("Admin Dashboard API Error:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}