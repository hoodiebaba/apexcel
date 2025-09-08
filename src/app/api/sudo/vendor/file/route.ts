// /src/app/api/sudo/vendor/file/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";
const prisma = new PrismaClient();

async function getMe() {
  const jar = await cookies();
  const token = jar.get("sudo_token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "apex-secret") as any;
    const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });
    if (!admin) return null;
    return {
      id: admin.id,
      role: admin.role,
      permissions: admin.permissions ?? [],
    };
  } catch {
    return null;
  }
}

function hasPerm(me: any) {
  if (!me) return false;
  if (me.role === "sudo") return true;
  // viewing vendor page implies they can view files
  return (me.permissions || []).includes("vendor:view") || (me.permissions || []).includes("vendor:page_view");
}

export async function GET(req: Request) {
  const me = await getMe();
  if (!hasPerm(me)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const type = (searchParams.get("type") || "").toLowerCase(); // pan | gst | aadhar | cheque
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

  // p is a public-relative path, e.g. /uploads/vendor/<id>/pan.pdf
  // redirect so browser opens in new tab (inline)
  return NextResponse.redirect(new URL(p, req.url), 302);
}