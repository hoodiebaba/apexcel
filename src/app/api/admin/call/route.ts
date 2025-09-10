// /src/app/api/admin/call/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { lookup as mimeLookup } from "mime-types";

export const runtime = "nodejs";

/* ───────── Helpers ───────── */
const hasCI = (list: string[] | undefined, perm: string) =>
  (list || []).some((p) => p.toLowerCase() === perm.toLowerCase());

// 🔁 Aliases: create==upload, read==view/download/page_view, update==edit, remove==delete
const PERM_ALIASES: Record<string, string[]> = {
  "call:upload":   ["call:create"],
  "call:view":     ["call:read"],
  "call:download": ["call:read"],
  "call:page_view":["call:read"],
  "call:edit":     ["call:update"],
  "call:delete":   ["call:remove"],
};

function hasWithAliases(perms: string[] | undefined, need: string) {
  if (hasCI(perms, need)) return true;
  const alts = PERM_ALIASES[need] || [];
  return alts.some((alt) => hasCI(perms, alt));
}

async function getMe() {
  const jar = await cookies();
  const token = jar.get("admin_token")?.value;
  if (!token) return null;
  try {
    const dec = jwt.verify(token, process.env.JWT_SECRET || "apex-secret") as any;
    const me = await prisma.admin.findUnique({ where: { id: dec.id } });
    if (!me || me.status !== "active") return null; // status gate
    return { ...me, permissions: (me.permissions as any) ?? [] };
  } catch {
    return null;
  }
}

function can(me: any, perm: string) {
  if (!me) return false;
  if (me.role !== "admin") return false; // ❌ block sudo/customer here
  return hasWithAliases(me.permissions, perm);
}

async function ensureDir(dir: string) {
  await fs.promises.mkdir(dir, { recursive: true }).catch(() => {});
}
function safeName(orig: string) {
  const ext = path.extname(orig || "") || "";
  return `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
}

/* ───────── GET (multi op) ─────────
   op=bootstrap       → list admins/sudos to send to
   op=list            → list my related call files
   op=file&id&mode    → stream view/download
   op=remarks&id      → fetch remarks array
*/
export async function GET(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const op = (searchParams.get("op") || "list").toLowerCase();

  // page access guard (except direct file stream uses view/download perms)
  if (op !== "file" && !can(me, "call:page_view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (op === "bootstrap") {
    // active admins & sudos for dropdown (exclude self)
    const admins = await prisma.admin.findMany({
      where: { role: { in: ["sudo", "admin"] }, status: "active", NOT: { id: me.id } },
      select: { id: true, role: true, username: true, name: true, status: true },
      orderBy: [{ role: "asc" }, { username: "asc" }],
    });
    return NextResponse.json(admins);
  }

  if (op === "list") {
    const q = (searchParams.get("q") || "").trim();
    const where: any = {
      status: "active",
      OR: [{ senderId: me.id }, { receiverId: me.id }], // admin sees only involved threads/files
    };
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

    const shaped = rows.map((r) => {
      const list = Array.isArray(r.remarks) ? (r.remarks as any[]) : [];
      const last = list.length ? list[list.length - 1] : null;
      return { ...r, lastRemark: last ? `${last.by}: ${last.text}` : r.remark || null };
    });

    return NextResponse.json(shaped);
  }

  if (op === "remarks") {
    if (!can(me, "call:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const id = searchParams.get("id") || "";
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const row = await prisma.callFile.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (me.id !== row.senderId && me.id !== row.receiverId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const list = Array.isArray(row.remarks) ? (row.remarks as any[]) : [];
    return NextResponse.json(list);
  }

  if (op === "file") {
    const id = searchParams.get("id") || "";
    const mode = (searchParams.get("mode") || "download").toLowerCase();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const row = await prisma.callFile.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // permission: view/download
    if (mode === "view" && !can(me, "call:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (mode !== "view" && !can(me, "call:download")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // admin can only access if involved
    if (me.id !== row.senderId && me.id !== row.receiverId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // pick side-specific path
    const filePath = me.id === row.senderId ? row.senderPathSend : row.receiverPathRecv;
    const stat = await fs.promises.stat(filePath).catch(() => null);
    if (!stat) return NextResponse.json({ error: "File missing" }, { status: 404 });

    const buf = await fs.promises.readFile(filePath);
    const ab = new ArrayBuffer(buf.byteLength);
    new Uint8Array(ab).set(buf);

    const mime = row.mimeType || (mimeLookup(row.storedName) as string) || "application/octet-stream";
    const viewable =
      mode === "view" &&
      ["application/pdf", "image/png", "image/jpeg", "image/gif", "image/webp"].includes(String(mime));

    const body = new Blob([ab], { type: viewable ? String(mime) : "application/octet-stream" });
    const headers: Record<string, string> = {
      "Content-Length": String(stat.size),
      "Content-Type": body.type,
    };
    if (!viewable) {
      headers["Content-Disposition"] = `attachment; filename="${row.fileName.replace(/"/g, "")}"`;
    }
    return new NextResponse(body, { headers });
  }

  return NextResponse.json({ error: "Unknown op" }, { status: 400 });
}

/* ───────── POST (multi op) ─────────
   op=upload (multipart)         → receiverId, remark, file
   op=remark (json)              → {id, text}
   op=delete (json)              → {ids:[]}
*/
export async function POST(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const op = (url.searchParams.get("op") || "upload").toLowerCase();

  if (op === "upload") {
    if (!can(me, "call:upload")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const form = await req.formData();
    const receiverId = (form.get("receiverId") || "").toString();
    const note = (form.get("remark") || "").toString();
    const file = form.get("file") as File | null;

    if (!receiverId || !file) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const size = (file as any).size ?? 0;
    if (size <= 0 || size > 100 * 1024 * 1024) return NextResponse.json({ error: "File too large" }, { status: 400 });

    const receiver = await prisma.admin.findUnique({ where: { id: receiverId } });
    if (!receiver || receiver.status !== "active" || !["sudo", "admin"].includes(receiver.role)) {
      return NextResponse.json({ error: "Receiver not allowed" }, { status: 404 });
    }

    const storedName = safeName((file as any).name || "file.bin");
    const buf = Buffer.from(await file.arrayBuffer());
    const mimeFromName = (mimeLookup(storedName) as string) || (file as any).type || "application/octet-stream";

    const senderDir = path.join(process.cwd(), "public", "uploads", me.role, me.username, "send");
    const receiverDir = path.join(process.cwd(), "public", "uploads", receiver.role, receiver.username, "receive");
    await ensureDir(senderDir);
    await ensureDir(receiverDir);

    const senderPath = path.join(senderDir, storedName);
    const receiverPath = path.join(receiverDir, storedName);

    await fs.promises.writeFile(senderPath, buf);
    try {
      await fs.promises.link(senderPath, receiverPath);
    } catch {
      await fs.promises.writeFile(receiverPath, buf);
    }

    const row = await prisma.callFile.create({
      data: {
        senderId: me.id,
        senderUsername: me.username!,
        senderRole: me.role,
        receiverId: receiver.id,
        receiverUsername: receiver.username!,
        receiverRole: receiver.role,
        fileName: (file as any).name || "file",
        storedName,
        mimeType: String(mimeFromName),
        sizeBytes: buf.length,
        remark: note || null,
        senderPathSend: senderPath,
        receiverPathRecv: receiverPath,
        remarks: note ? [{ by: `admin:${me.username}`, text: note, at: new Date().toISOString() }] : [],
        status: "active",
      },
    });

    return NextResponse.json(row);
  }

  if (op === "remark") {
    if (!can(me, "call:edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id, text } = await req.json().catch(() => ({}));
    if (!id || !text) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const row = await prisma.callFile.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (me.id !== row.senderId && me.id !== row.receiverId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const entry = { by: `admin:${me.username}`, text: String(text), at: new Date().toISOString() };
    const prev = Array.isArray(row.remarks) ? (row.remarks as any[]) : [];
    prev.push(entry);

    await prisma.callFile.update({
      where: { id },
      data: { remarks: prev, remark: String(text) },
    });

    return NextResponse.json({ success: true });
  }

  if (op === "delete") {
    if (!can(me, "call:delete")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { ids } = await req.json().catch(() => ({}));
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids[] required" }, { status: 400 });
    }

    await prisma.callFile.updateMany({
      where: { id: { in: ids }, OR: [{ senderId: me.id }, { receiverId: me.id }] },
      data: { status: "deleted", deletedBy: `admin:${me.id}`, deletedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown op" }, { status: 400 });
}