import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";
const prisma = new PrismaClient();

/* ---- auth helpers ---- */
async function getMe() {
  const jar = await cookies();
  const token = jar.get("sudo_token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "apex-secret") as any;
    const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });
    if (!admin) return null;
    return { id: admin.id, role: admin.role, permissions: admin.permissions ?? [] };
  } catch { return null; }
}
function hasPerm(me: any) {
  if (!me) return false;
  if (me.role === "sudo") return true;
  return (me.permissions || []).includes("customer:view") || (me.permissions || []).includes("customer:page_view");
}

/**
 * GET /api/sudo/customer/file?id=...&type=pan|gst|aadhar|cheque
 */
export async function GET(req: Request) {
  const me = await getMe();
  if (!hasPerm(me)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || "";
  const type = (searchParams.get("type") || "").toLowerCase();

  if (!id || !["pan", "gst", "aadhar", "cheque"].includes(type)) {
    return NextResponse.json({ error: "id and valid type required" }, { status: 400 });
  }

  const row = await prisma.customer.findUnique({
    where: { id },
    select: { panImage: true, gstImage: true, aadharCard: true, cancelCheque: true },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const map: Record<string, string | null | undefined> = {
    pan: row.panImage,
    gst: row.gstImage,
    aadhar: row.aadharCard,
    cheque: row.cancelCheque,
  };
  const fileUrl = map[type];
  if (!fileUrl) return NextResponse.json({ error: "File not available" }, { status: 404 });

  return NextResponse.redirect(new URL(fileUrl, req.url), 302);
}