// /src/app/api/admin/customer/file/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";

/* ---- auth helpers (ADMIN ONLY) ---- */
async function getMe() {
  const jar = await cookies();
  const token = jar.get("admin_token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "apex-secret") as any;
    const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });
    if (!admin || admin.status !== "active") return null;
    return { id: admin.id, role: admin.role, permissions: admin.permissions ?? [] };
  } catch {
    return null;
  }
}

const hasCI = (list: string[] | undefined, perm: string) =>
  (list || []).some((p) => p.toLowerCase() === perm.toLowerCase());

// admin ko allow; warna explicit perms
function canDownload(me: any) {
  if (!me) return false;
  if (me.role === "admin") return true;
  return (
    hasCI(me.permissions, "customer:download") ||
    hasCI(me.permissions, "customer:view") ||
    hasCI(me.permissions, "customer:page_view")
  );
}

/**
 * GET /api/admin/customer/file?id=...&type=pan|gst|aadhar|cheque
 * Redirects to public file URL (302)
 */
export async function GET(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canDownload(me)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || "";
  const type = (searchParams.get("type") || "").toLowerCase();

  if (!id || !["pan", "gst", "aadhar", "cheque"].includes(type)) {
    return NextResponse.json({ error: "id/type required" }, { status: 400 });
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