import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";

export const runtime = "nodejs";

/* ---------------- Helpers ---------------- */
async function getMe() {
  const jar = await cookies();
  const token = jar.get("admin_token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "apex-secret") as any;
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        role: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        status: true,
        permissions: true,
      },
    });
    if (!admin) return null;
    return admin;
  } catch {
    return null;
  }
}

const hasPerm = (me: any, perm: string) =>
  !!me && (me.role === "sudo" || (me.permissions || []).includes(perm));

function who(me: any) {
  const role = me?.role === "customer" ? "self" : me?.role || "admin";
  const name = me?.name || me?.username || "";
  return `${role}:${name}`.trim();
}

async function ensureDir(dir: string) {
  await fs.promises.mkdir(dir, { recursive: true }).catch(() => {});
}

async function saveFile(file: File | null, baseDir: string, baseName: string) {
  const size = (file as any)?.size ?? 0;
  if (!file || size <= 0) return null;

  const rawType = (file as any)?.type || "";
  const rawName = (file as any)?.name || "";

  const byType = rawType && rawType.includes("/") ? rawType.split("/").pop() : "";
  const byName = rawName && rawName.includes(".") ? rawName.split(".").pop() : "";
  const ext = (byType || byName || "bin").toLowerCase();

  const outRel = path.posix.join(baseDir, `${baseName}.${ext}`);
  const outAbs = path.join(process.cwd(), "public", outRel);
  await ensureDir(path.dirname(outAbs));
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.promises.writeFile(outAbs, buf);
  return `/${outRel}`;
}

/* ---------------- GET (list/single) ---------------- */
export async function GET(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.status !== "active") return NextResponse.json({ error: "Inactive" }, { status: 403 });
  if (!hasPerm(me, "Vendors:page_view") && !hasPerm(me, "Vendors:view"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const q = (searchParams.get("q") || "").trim();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "100", 10), 200);
  const skip = (page - 1) * pageSize;

  if (id) {
    const row = await prisma.vendor.findUnique({ where: { id } });
    return NextResponse.json(row ?? null);
  }

  const where: any = { active: true }; // admin sees all active vendors
  if (q) {
    where.OR = [
      { vendorName: { contains: q, mode: "insensitive" } },
      { username: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { companyName: { contains: q, mode: "insensitive" } },
      { panNumber: { contains: q, mode: "insensitive" } },
      { gstNumber: { contains: q, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        vendorName: true,
        username: true,
        phone: true,
        email: true,
        kycBy: true,
        kycStatus: true,
        panNumber: true,
        createdAt: true,
        updatedAt: true,
        registeredBy: true,
        active: true,
        companyName: true,
        address: true,
        panImage: true,
        gstImage: true,
        aadharCard: true,
        cancelCheque: true,
      },
    }),
    prisma.vendor.count({ where }),
  ]);

  return NextResponse.json({ rows, total, page, pageSize });
}

/* ---------------- POST (create) ---------------- */
export async function POST(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.status !== "active") return NextResponse.json({ error: "Inactive" }, { status: 403 });
  if (!hasPerm(me, "Vendors:create")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const form = await req.formData();
    const get = (k: string) => (form.get(k) || "").toString().trim();

    const vendorName = get("vendorName") || `${get("firstName")} ${get("lastName")}`.trim();
    const username = get("username");
    const email = get("email");
    const phone = get("phone");
    const panNumber = get("panNumber");
    const passwordRaw = get("password");

    if (!vendorName || !username || !email || !phone || !panNumber || !passwordRaw) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const created = await prisma.vendor.create({
      data: {
        firstName: get("firstName") || null,
        lastName: get("lastName") || null,
        vendorName,
        username,
        email,
        phone,
        password: await bcrypt.hash(passwordRaw, 10),
        address: get("address"),
        city: get("city"),
        state: get("state"),
        pinCode: get("pinCode"),
        vendorType: get("vendorType"),
        companyName: get("companyName"),
        accountType: get("accountType"),
        bankAccountNo: get("bankAccountNo"),
        bankName: get("bankName"),
        ifsc: get("ifsc"),
        accountHolder: get("accountHolder"),
        upi: get("upi") || null,
        paymentTerms: get("paymentTerms"),
        gstNumber: get("gstNumber") || null,
        panNumber,
        message: get("message") || null,
        registeredBy: who(me),
        kycBy: null,
        kycStatus: "pending",
      },
    });

    // files
    const baseDir = path.posix.join("uploads", "vendor", created.id);
    const panImage = await saveFile(form.get("panImage") as any, baseDir, "pan");
    const gstImage = await saveFile(form.get("gstImage") as any, baseDir, "gst");
    const aadharCard = await saveFile(form.get("aadharCard") as any, baseDir, "aadhar");
    const cancelCheque = await saveFile(form.get("cancelCheque") as any, baseDir, "cheque");

    if (panImage || gstImage || aadharCard || cancelCheque) {
      await prisma.vendor.update({
        where: { id: created.id },
        data: { panImage, gstImage, aadharCard, cancelCheque },
      });
    }

    return NextResponse.json({ success: true, id: created.id });
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg.toLowerCase().includes("unique")) {
      return NextResponse.json({ error: "Username/Email/PAN already exists" }, { status: 400 });
    }
    console.error("ADMIN_VENDOR_CREATE_ERROR", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}

/* ---------------- PUT (update) ---------------- */
export async function PUT(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.status !== "active") return NextResponse.json({ error: "Inactive" }, { status: 403 });
  if (!hasPerm(me, "Vendors:edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const ct = req.headers.get("content-type") || "";
  try {
    let id = "";
    let data: any = {};
    let files: Record<string, File | null> = {};

    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      id = (form.get("id") || "").toString();
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

      const take = (k: string) => (form.get(k) === null ? undefined : (form.get(k) as any).toString());
      data = {
        firstName: take("firstName"),
        lastName: take("lastName"),
        username: take("username"),
        vendorName: take("vendorName"),
        phone: take("phone"),
        email: take("email"),
        password: take("password"),
        address: take("address"),
        city: take("city"),
        state: take("state"),
        pinCode: take("pinCode"),
        vendorType: take("vendorType"),
        companyName: take("companyName"),
        accountType: take("accountType"),
        bankAccountNo: take("bankAccountNo"),
        bankName: take("bankName"),
        ifsc: take("ifsc"),
        accountHolder: take("accountHolder"),
        upi: take("upi"),
        paymentTerms: take("paymentTerms"),
        gstNumber: take("gstNumber"),
        panNumber: take("panNumber"),
        message: take("message"),
        registeredBy: take("registeredBy"),
        kycStatus: take("kycStatus"),
      };
      files = {
        panImage: (form.get("panImage") as File) || null,
        gstImage: (form.get("gstImage") as File) || null,
        aadharCard: (form.get("aadharCard") as File) || null,
        cancelCheque: (form.get("cancelCheque") as File) || null,
      };
    } else {
      const body = await req.json();
      id = body.id;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      data = { ...body };
      delete data.id;
    }

    if (typeof data.kycStatus === "string" && data.kycStatus.length) data.kycBy = who(me);

    if (data.password !== undefined) {
      if (typeof data.password !== "string" || data.password.trim() === "") delete data.password;
      else data.password = await bcrypt.hash(data.password, 10);
    }

    if ((!data.vendorName || !data.vendorName.trim()) && (data.firstName || data.lastName)) {
      data.vendorName = `${data.firstName || ""} ${data.lastName || ""}`.trim();
    }
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

    const old = await prisma.vendor.findUnique({ where: { id } });
    if (!old) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (ct.includes("multipart/form-data")) {
      const baseDir = path.posix.join("uploads", "vendor", id);
      const panImage = await saveFile(files.panImage, baseDir, "pan");
      const gstImage = await saveFile(files.gstImage, baseDir, "gst");
      const aadharCard = await saveFile(files.aadharCard, baseDir, "aadhar");
      const cancelCheque = await saveFile(files.cancelCheque, baseDir, "cheque");
      if (panImage) data.panImage = panImage;
      if (gstImage) data.gstImage = gstImage;
      if (aadharCard) data.aadharCard = aadharCard;
      if (cancelCheque) data.cancelCheque = cancelCheque;
    }

    const updated = await prisma.vendor.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg.toLowerCase().includes("unique")) {
      return NextResponse.json({ error: "Username/Email/PAN already exists" }, { status: 400 });
    }
    console.error("ADMIN_VENDOR_UPDATE_ERROR", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

/* ---------------- DELETE (soft) ---------------- */
export async function DELETE(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.status !== "active") return NextResponse.json({ error: "Inactive" }, { status: 403 });
  if (!hasPerm(me, "Vendors:delete")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids[] required" }, { status: 400 });
    }
    await prisma.vendor.updateMany({ where: { id: { in: ids } }, data: { active: false } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("ADMIN_VENDOR_DELETE_ERROR", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}