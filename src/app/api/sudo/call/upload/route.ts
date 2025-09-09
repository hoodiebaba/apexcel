import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { lookup as mimeLookup } from "mime-types";

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
async function ensureDir(dir: string) {
  await fs.promises.mkdir(dir, { recursive: true }).catch(() => {});
}
function safeName(orig: string) {
  const ext = path.extname(orig) || "";
  return `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
}

export async function POST(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPerm(me, "call:upload")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await req.formData();
  const receiverId = (form.get("receiverId") || "").toString();
  const note = (form.get("remark") || "").toString();
  const file = form.get("file") as File | null;

  if (!receiverId || !file) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const size = (file as any).size ?? 0;
  if (size <= 0 || size > 100 * 1024 * 1024) return NextResponse.json({ error: "File too large" }, { status: 400 });

  const receiver = await prisma.admin.findUnique({ where: { id: receiverId } });
  if (!receiver || !["sudo","admin"].includes(receiver.role)) {
    return NextResponse.json({ error: "Receiver not found/allowed" }, { status: 404 });
  }

  const storedName = safeName((file as any).name || "file.bin");
  const buf = Buffer.from(await file.arrayBuffer());
  const mimeFromName = mimeLookup(storedName) || (file as any).type || "application/octet-stream";

  const senderDir = path.join(process.cwd(), "public", "uploads", me.role, me.username, "send");
  const receiverDir = path.join(process.cwd(), "public", "uploads", receiver.role, receiver.username, "receive");
  await ensureDir(senderDir); await ensureDir(receiverDir);

  const senderPath = path.join(senderDir, storedName);
  const receiverPath = path.join(receiverDir, storedName);

  await fs.promises.writeFile(senderPath, buf);
  try { await fs.promises.link(senderPath, receiverPath); } catch { await fs.promises.writeFile(receiverPath, buf); }

  const row = await prisma.callFile.create({
    data: {
      senderId: me.id, senderUsername: me.username, senderRole: me.role,
      receiverId: receiver.id, receiverUsername: receiver.username, receiverRole: receiver.role,
      fileName: (file as any).name || "file",
      storedName, mimeType: String(mimeFromName), sizeBytes: buf.length,
      remark: note || null,
      senderPathSend: senderPath, receiverPathRecv: receiverPath,
      remarks: note ? [{ by: `${me.role}:${me.username}`, text: note, at: new Date().toISOString() }] : [],
    },
  });

  return NextResponse.json(row);
}