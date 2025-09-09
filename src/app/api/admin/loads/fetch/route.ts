import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

async function getMe() {
  const jar = await cookies();
  const token = jar.get("admin_token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "apex-secret") as any;
    const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });
    if (!admin) return null;
    if (admin.status !== "active") return null;
    return {
      id: admin.id,
      role: admin.role,
      name: admin.name ?? "",
      username: admin.username,
      phone: admin.phone ?? "",
      email: admin.email,
      address: admin.address ?? "",
      permissions: admin.permissions ?? [],
      status: admin.status,
    };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const q = (searchParams.get("q") || "").trim();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "20", 10), 100);
  const skip = (page - 1) * pageSize;

  if (type === "me") return NextResponse.json(me);

  if (type === "customers") {
    const where: any = q
      ? {
          OR: [
            { customerName: { contains: q, mode: "insensitive" } },
            { companyName: { contains: q, mode: "insensitive" } },
            { username: { contains: q, mode: "insensitive" } },
            { panNumber: { contains: q, mode: "insensitive" } },
          ],
        }
      : {};
    const [rows, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        select: {
          id: true, customerName: true, companyName: true, username: true,
          panNumber: true, phone: true, email: true, address: true,
          paymentTerms: true, gstNumber: true,
        },
      }),
      prisma.customer.count({ where }),
    ]);
    return NextResponse.json({ rows, total, page, pageSize });
  }

  if (type === "vendors") {
    const where: any = q
      ? {
          OR: [
            { vendorName: { contains: q, mode: "insensitive" } },
            { companyName: { contains: q, mode: "insensitive" } },
            { username: { contains: q, mode: "insensitive" } },
            { panNumber: { contains: q, mode: "insensitive" } },
          ],
        }
      : {};
    const [rows, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        select: {
          id: true, vendorName: true, companyName: true, username: true,
          panNumber: true, phone: true, email: true, address: true,
        },
      }),
      prisma.vendor.count({ where }),
    ]);
    return NextResponse.json({ rows, total, page, pageSize });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}