import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
export const runtime = "nodejs";

type Role = "sudo" | "admin" | "vendor" | "customer";

/* ------------------ helpers ------------------ */
async function getMe() {
  const jar = await cookies();
  const token = jar.get("sudo_token")?.value || jar.get("admin_token")?.value;
  if (!token) return null;
  try {
    const d = jwt.verify(token, process.env.JWT_SECRET || "apex-secret") as any;
    const me = await prisma.admin.findUnique({ where: { id: d.id } });
    if (!me) return null;
    return {
      id: me.id,
      role: (me.role as Role) || "admin",
      username: me.username,
      // normalize permissions to lowercase strings
      permissions: (me.permissions ?? []).map((p) => String(p || "").toLowerCase()),
      status: me.status, // "active" | "inactive" | ...
    };
  } catch {
    return null;
  }
}

// case-insensitive + wildcard permission check
function hasPerm(me: any, perm: string) {
  if (!me) return false;
  if (me.role === "sudo") return true;
  const list: string[] = me.permissions || [];
  const want = perm.toLowerCase();
  return (
    list.includes("*") ||
    list.includes("wallet:*") ||
    list.includes(want)
  );
}

async function ensureDir(dir: string) {
  await fs.promises.mkdir(dir, { recursive: true }).catch(() => {});
}
function safeName(orig: string) {
  const ext = path.extname(orig) || "";
  return `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
}
function isPreviewable(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  return [".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext);
}
function guessMime(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".gif") return "image/gif";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}

/* ------------------ GET ------------------ */
export async function GET(req: Request) {
  try {
    const me = await getMe();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const op = (searchParams.get("op") || "").trim();

    /* --- members --- */
    if (op === "members") {
      const role = (searchParams.get("role") || "admin") as Role;

      // vendor/customer → only see admins/sudo lists
      if ((me.role === "vendor" || me.role === "customer") && !(role === "admin" || role === "sudo")) {
        return NextResponse.json([]);
      }

      if (role === "admin" || role === "sudo") {
        const list = await prisma.admin.findMany({
          where: { role, status: { not: "inactive" } },
          orderBy: { createdAt: "desc" },
          select: { id: true, role: true, username: true, name: true, status: true },
        });
        return NextResponse.json(list);
      }

      if (role === "vendor") {
        const v = await prisma.vendor.findMany({
          where: { active: true },
          orderBy: { createdAt: "desc" },
          select: { id: true, username: true, vendorName: true },
        });
        return NextResponse.json(
          v.map((x) => ({ id: x.id, role: "vendor", username: x.username, name: x.vendorName, status: "active" }))
        );
      }

      if (role === "customer") {
        const c = await prisma.customer.findMany({
          where: { active: true },
          orderBy: { createdAt: "desc" },
          select: { id: true, username: true, customerName: true },
        });
        return NextResponse.json(
          c.map((x) => ({ id: x.id, role: "customer", username: x.username, name: x.customerName, status: "active" }))
        );
      }

      return NextResponse.json([]);
    }

    /* --- file (download/preview) --- */
    if (op === "file") {
      const id = searchParams.get("id") || "";
      const mode = searchParams.get("mode") || "download"; // view|download

      const row = await prisma.wallet.findUnique({ where: { id } });
      if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
      if (me.role !== "sudo" && !(row.requestById === me.id || row.requestToId === me.id)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (!row.paymentProof) return NextResponse.json({ error: "No file" }, { status: 404 });

      // /public/uploads/wallet/{senderRole}/{senderUsername}/{storedName}
      const sender = await prisma.admin.findUnique({ where: { id: row.requestById } });
      const baseDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "wallet",
        sender?.role || "admin",
        sender?.username || "unknown"
      );
      const filePath = path.join(baseDir, row.paymentProof);

      const stat = await fs.promises.stat(filePath).catch(() => null);
      if (!stat) return NextResponse.json({ error: "File missing" }, { status: 404 });

      const buf = await fs.promises.readFile(filePath);
      const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

      const mime = guessMime(row.paymentProof);
      const headers: Record<string, string> = { "Content-Length": String(stat.size) };

      if (mode === "view" && isPreviewable(row.paymentProof)) {
        headers["Content-Type"] = mime;
        return new NextResponse(ab, { headers });
      } else {
        headers["Content-Type"] = "application/octet-stream";
        const safeBase = String(row.utrNumber || "proof").replace(/["\\]/g, "");
        headers["Content-Disposition"] = `attachment; filename="${safeBase}${path.extname(row.paymentProof)}"`;
        return new NextResponse(ab, { headers });
      }
    }

    /* --- list --- */
    if (!hasPerm(me, "wallet:page_view")) {
      return NextResponse.redirect(new URL(`/${me.role}`, req.url));
    }

    const where: any = {};
    if (me.role !== "sudo") {
      where.OR = [{ requestById: me.id }, { requestToId: me.id }];
    }

    const rows = await prisma.wallet.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const ids = Array.from(new Set(rows.flatMap((r) => [r.requestById, r.requestToId])));
    const admins = await prisma.admin.findMany({
      where: { id: { in: ids } },
      select: { id: true, username: true, role: true },
    });
    const nameMap = new Map(admins.map((a) => [a.id, a.username]));

    const list = rows.map((r) => ({
      id: r.id,
      requestById: r.requestById,
      requestByType: r.requestByType as Role,
      requestToId: r.requestToId,
      requestToType: r.requestToType as Role,
      senderUsername: nameMap.get(r.requestById) || r.requestById,
      receiverUsername: nameMap.get(r.requestToId) || r.requestToId,
      utrNumber: r.utrNumber || "",
      amount: Number(r.amount || 0),
      status: (r.status as "pending" | "success" | "failed") || "pending",
      remarks: r.remarks || null,
      paymentProof: r.paymentProof || null,
      createdAt: (r.createdAt as any as Date).toISOString(),
    }));

    return NextResponse.json(list);
  } catch (err: any) {
    console.error("GET /api/admin/wallet error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ------------------ POST ------------------ */
export async function POST(req: Request) {
  try {
    const me = await getMe();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const op = (searchParams.get("op") || "").trim();

    /* --- edit --- */
    if (op === "edit") {
      if (!hasPerm(me, "wallet:edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const { id, status, appendRemark } = await req.json().catch(() => ({}));
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

      const row = await prisma.wallet.findUnique({ where: { id } });
      if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

      // Only sudo or participants can edit
      if (me.role !== "sudo" && !(row.requestById === me.id || row.requestToId === me.id)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const newRemarks =
        (row.remarks || "") +
        (appendRemark ? `\n${me.role}:${me.username}:${String(appendRemark).trim()}` : "");

      const updated = await prisma.wallet.update({
        where: { id },
        data: {
          status: status && ["pending", "success", "failed"].includes(status) ? status : row.status,
          remarks: newRemarks,
        },
      });
      return NextResponse.json(updated);
    }

    /* --- delete --- */
    if (op === "delete") {
      if (!hasPerm(me, "wallet:delete")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const { ids } = await req.json().catch(() => ({}));
      if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "ids[] required" }, { status: 400 });
      }
      const rows = await prisma.wallet.findMany({ where: { id: { in: ids } } });
      for (const r of rows) {
        if (me.role === "sudo") {
          if (r.paymentProof) {
            const sender = await prisma.admin.findUnique({ where: { id: r.requestById } });
            const baseDir = path.join(process.cwd(), "public", "uploads", "wallet", sender?.role || "admin", sender?.username || "unknown");
            const fp = path.join(baseDir, r.paymentProof);
            try { await fs.promises.unlink(fp); } catch {}
          }
          await prisma.wallet.delete({ where: { id: r.id } });
        } else {
          const newRemarks = (r.remarks || "") + `\n${me.role}:${me.username}:deleted`;
          await prisma.wallet.update({
            where: { id: r.id },
            data: { status: "failed", remarks: newRemarks },
          });
        }
      }
      return NextResponse.json({ success: true });
    }

    /* --- create --- */
    if (!hasPerm(me, "wallet:create")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (String(me.status).toLowerCase() !== "active") {
      return NextResponse.json({ error: "Account not active" }, { status: 403 });
    }

    const form = await req.formData();
    const receiverId = (form.get("receiverId") || "").toString();
    const receiverType = (form.get("receiverType") || "admin").toString() as Role;
    const utrNumber = (form.get("utrNumber") || "").toString().trim();
    const amountNum = Number((form.get("amount") || "").toString());
    const proof = form.get("proof") as File | null;

    if (!receiverId || !utrNumber || !Number.isFinite(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: "Missing/invalid fields" }, { status: 400 });
    }
    if (proof && (proof as any).size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Proof too large (max 10 MB)" }, { status: 400 });
    }

    // Validate receiver existence by role
    if (receiverType === "admin" || receiverType === "sudo") {
      const ok = await prisma.admin.findFirst({ where: { id: receiverId, role: receiverType, status: { not: "inactive" } } });
      if (!ok) return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
    } else if (receiverType === "vendor") {
      const ok = await prisma.vendor.findFirst({ where: { id: receiverId, active: true } });
      if (!ok) return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
    } else if (receiverType === "customer") {
      const ok = await prisma.customer.findFirst({ where: { id: receiverId, active: true } });
      if (!ok) return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
    }

    const sender = await prisma.admin.findUnique({ where: { id: me.id } });
    if (!sender) return NextResponse.json({ error: "Sender not found" }, { status: 404 });

    let storedName: string | null = null;
    if (proof) {
      const buf = Buffer.from(await proof.arrayBuffer());
      storedName = safeName(proof.name);
      const dir = path.join(process.cwd(), "public", "uploads", "wallet", sender.role, sender.username);
      await ensureDir(dir);
      await fs.promises.writeFile(path.join(dir, storedName), buf);
    }

    const row = await prisma.wallet.create({
      data: {
        requestById: me.id,
        requestByType: sender.role as any,
        requestToId: receiverId,
        requestToType: receiverType as any,
        amount: amountNum,
        utrNumber,
        paymentProof: storedName,
        status: "pending",
        remarks: "",
      },
    });

    return NextResponse.json(row);
  } catch (err: any) {
    console.error("POST /api/admin/wallet error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}