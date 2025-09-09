import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";

async function getMe() {
  const jar = await cookies();
  const token = jar.get("admin_token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "apex-secret") as any;
    const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });
    return admin;
  } catch {
    return null;
  }
}
const can = (me: any) =>
  !!me &&
  (me.role === "sudo" ||
    (me.permissions || []).includes("Vendors:view") ||
    (me.permissions || []).includes("Vendors:page_view"));

export async function GET(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.status !== "active") return NextResponse.json({ error: "Inactive" }, { status: 403 });
  if (!can(me)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const type = (searchParams.get("type") || "").toLowerCase(); // pan|gst|aadhar|cheque
  if (!id || !["pan", "gst", "aadhar", "cheque"].includes(type)) {
    return NextResponse.json({ error: "id/type required" }, { status: 400 });
  }

  const v = await prisma.vendor.findUnique({
    where: { id },
    select: { panImage: true, gstImage: true, aadharCard: true, cancelCheque: true },
  });
  if (!v) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const map: Record<string, string | null | undefined> = {
    pan: v.panImage,
    gst: v.gstImage,
    aadhar: v.aadharCard,
    cheque: v.cancelCheque,
  };
  const p = map[type];
  if (!p) return NextResponse.json({ error: "File not found" }, { status: 404 });

  return NextResponse.redirect(new URL(p, req.url), 302);
}