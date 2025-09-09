import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

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

export async function GET(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPerm(me, "call:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || "";
  const row = await prisma.callFile.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // admin can only see if involved
  if (me.role === "admin" && me.id !== row.senderId && me.id !== row.receiverId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const list = Array.isArray(row.remarks) ? (row.remarks as any[]) : [];
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPerm(me, "call:edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, text } = await req.json();
  if (!id || !text) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const row = await prisma.callFile.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (me.role === "admin" && me.id !== row.senderId && me.id !== row.receiverId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const entry = { by: `${me.role}:${me.username}`, text: String(text), at: new Date().toISOString() };
  const prev = Array.isArray(row.remarks) ? (row.remarks as any[]) : [];
  prev.push(entry);

  await prisma.callFile.update({
    where: { id },
    data: { remarks: prev, remark: String(text) }, // keep last remark snapshot for quick table
  });

  return NextResponse.json({ success: true });
}