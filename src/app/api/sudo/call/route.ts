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

export async function GET(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPerm(me, "call:page_view")) {
    return NextResponse.redirect(new URL(`/${me.role}`, req.url));
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  const where: any = { status: "active" };
  if (me.role === "admin") where.OR = [{ senderId: me.id }, { receiverId: me.id }];

  if (q) {
    where.OR = [
      ...(where.OR || []),
      { fileName: { contains: q, mode: "insensitive" } },
      { remark: { contains: q, mode: "insensitive" } },
      { senderUsername: { contains: q, mode: "insensitive" } },
      { receiverUsername: { contains: q, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.callFile.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      senderId: true, senderUsername: true, senderRole: true,
      receiverId: true, receiverUsername: true, receiverRole: true,
      fileName: true, storedName: true, mimeType: true, sizeBytes: true,
      remark: true, remarks: true,
      status: true, createdAt: true,
    },
  });

  // derive latest remark preview
  const shaped = rows.map(r => {
    const list = Array.isArray(r.remarks) ? (r.remarks as any[]) : [];
    const last = list.length ? list[list.length - 1] : null;
    return { ...r, lastRemark: last ? `${last.by}: ${last.text}` : r.remark || null };
  });

  return NextResponse.json(shaped);
}