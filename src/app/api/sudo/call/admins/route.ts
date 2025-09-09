import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
export const runtime = "nodejs";

async function getMe() {
  const jar = await cookies();
  const tok = jar.get("sudo_token")?.value;
  if (!tok) return null;
  try {
    const dec = jwt.verify(tok, process.env.JWT_SECRET || "apex-secret") as any;
    const me = await prisma.admin.findUnique({ where: { id: dec.id } });
    return me ? { ...me, permissions: me.permissions ?? [] } : null;
  } catch { return null; }
}
function hasPerm(me: any, perm: string) {
  if (!me) return false;
  if (me.role === "sudo") return true;
  return (me.permissions || []).includes(perm);
}

export async function GET() {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPerm(me, "call:page_view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admins = await prisma.admin.findMany({
    where: { role: { in: ["sudo", "admin"] }, status: "active" },
    select: { id: true, role: true, username: true, name: true, status: true },
    orderBy: [{ role: "asc" }, { username: "asc" }],
  });
  return NextResponse.json(admins);
}