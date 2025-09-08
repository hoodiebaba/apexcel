// /src/app/api/sudo/vendor/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
const prisma = new PrismaClient();

/* ---------------- Helpers ---------------- */
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
      name: admin.name ?? "",
      username: admin.username,
      phone: admin.phone ?? "",
      email: admin.email,
      address: admin.address ?? "",
      permissions: admin.permissions ?? [],
    };
  } catch {
    return null;
  }
}

function hasPerm(me: any, perm: string) {
  if (!me) return false;
  if (me.role === "sudo") return true;
  return (me.permissions || []).includes(perm);
}

async function ensureDir(dir: string) {
  await fs.promises.mkdir(dir, { recursive: true }).catch(() => {});
}

async function saveFileToPublicUploads(file: File, outDir: string, fileNameBase: string) {
  if (!file || file.size === 0) return null;
  const extGuess =
    (file.type && file.type.split("/").pop()) ||
    (file.name.includes(".") ? file.name.split(".").pop() : "bin");
  const outName = `${fileNameBase}.${extGuess}`;
  const outPath = path.join(process.cwd(), "public", outDir, outName);
  await ensureDir(path.dirname(outPath));
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.promises.writeFile(outPath, buf);
  // return public URL path
  return `/${path.posix.join(outDir, outName)}`;
}

/* -------------- GET --------------
   - List (with q, page/pageSize) OR single by id
-----------------------------------*/
export async function GET(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPerm(me, "vendor:page_view") && !hasPerm(me, "vendor:view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  const where: any = { active: true };
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

/* -------------- POST (Create) --------------
   - multipart/form-data (files optional)
   - permission: vendor:create
   - uploads -> /public/uploads/vendor/{id}/
--------------------------------------------*/
export async function POST(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPerm(me, "vendor:create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const form = await req.formData();

    // Step fields
    const firstName = (form.get("firstName") || "").toString().trim();
    const lastName = (form.get("lastName") || "").toString().trim();
    const vendorName = (form.get("vendorName") || `${firstName} ${lastName}`.trim()).toString();
    const username = (form.get("username") || "").toString();
    const email = (form.get("email") || "").toString();
    const phone = (form.get("phone") || "").toString();
    const password = (form.get("password") || "").toString();

    const address = (form.get("address") || "").toString();
    const city = (form.get("city") || "").toString();
    const state = (form.get("state") || "").toString();
    const pinCode = (form.get("pinCode") || "").toString();

    const vendorType = (form.get("vendorType") || "").toString();
    const companyName = (form.get("companyName") || "").toString();

    const accountType = (form.get("accountType") || "").toString();
    const bankAccountNo = (form.get("bankAccountNo") || "").toString();
    const bankName = (form.get("bankName") || "").toString();
    const ifsc = (form.get("ifsc") || "").toString();
    const accountHolder = (form.get("accountHolder") || "").toString();
    const upi = (form.get("upi") || "").toString();
    const paymentTerms = (form.get("paymentTerms") || "").toString();

    const gstNumber = (form.get("gstNumber") || "").toString();
    const panNumber = (form.get("panNumber") || "").toString();

    const message = (form.get("message") || "").toString();
    const registeredBy = (form.get("registeredBy") || "admin").toString();
    const kycStatus = (form.get("kycStatus") || "pending").toString();
    const kycBy = (form.get("kycBy") || "").toString();

    // Create vendor first (without file paths)
    const created = await prisma.vendor.create({
      data: {
        username,
        vendorName,
        phone,
        email,
        password,
        address,
        city,
        state,
        pinCode,
        vendorType,
        companyName,

        accountType,
        bankAccountNo,
        bankName,
        ifsc,
        accountHolder,
        upi: upi || null,
        paymentTerms,

        gstNumber: gstNumber || null,
        panNumber,

        message: message || null,
        registeredBy,
        kycBy: kycBy || null,
        kycStatus: kycStatus || "pending",
      },
    });

    // Save files (if provided)
    const baseDir = path.posix.join("uploads", "vendor", created.id);
    const panImageFile = form.get("panImage") as File | null;
    const gstImageFile = form.get("gstImage") as File | null;
    const aadharFile = form.get("aadharCard") as File | null;
    const chequeFile = form.get("cancelCheque") as File | null;

    const panImage = panImageFile ? await saveFileToPublicUploads(panImageFile, baseDir, "pan") : null;
    const gstImage = gstImageFile ? await saveFileToPublicUploads(gstImageFile, baseDir, "gst") : null;
    const aadharCard = aadharFile ? await saveFileToPublicUploads(aadharFile, baseDir, "aadhar") : null;
    const cancelCheque = chequeFile ? await saveFileToPublicUploads(chequeFile, baseDir, "cheque") : null;

    if (panImage || gstImage || aadharCard || cancelCheque) {
      await prisma.vendor.update({
        where: { id: created.id },
        data: { panImage, gstImage, aadharCard, cancelCheque },
      });
    }

    return NextResponse.json({ success: true, id: created.id });
  } catch (e: any) {
    // Unique constraint handling
    const msg = String(e?.message || "");
    if (msg.includes("Unique") || msg.includes("unique")) {
      return NextResponse.json({ error: "Username/Email/PAN already exists" }, { status: 400 });
    }
    console.error("VENDOR_CREATE_ERROR", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}

/* -------------- PUT (Update) --------------
   - multipart/form-data OR JSON
   - permission: vendor:edit
   - KYC updates set kycBy = me.username (if provided)
--------------------------------------------*/
export async function PUT(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPerm(me, "vendor:edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const contentType = req.headers.get("content-type") || "";
  try {
    let id = "";
    let data: any = {};
    let files: Record<string, File | null> = {};

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      id = (form.get("id") || "").toString();
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

      const take = (k: string) => {
        const v = form.get(k);
        if (v === null || v === undefined) return undefined;
        return v.toString();
      };

      data = {
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

      // files
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

   // if kycStatus provided, tag who did it with role:name (or self:name)
if (typeof data.kycStatus === "string" && data.kycStatus.length > 0) {
  const whoRole = me.role === "customer" ? "self" : me.role || "admin";
  const whoName = me.name || me.username || "";
  data.kycBy = `${whoRole}:${whoName}`;
}
    // prune undefined
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

    const old = await prisma.vendor.findUnique({ where: { id } });
    if (!old) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Save files if present
    if (contentType.includes("multipart/form-data")) {
      const baseDir = path.posix.join("uploads", "vendor", id);
      if (files.panImage) data.panImage = await saveFileToPublicUploads(files.panImage, baseDir, "pan");
      if (files.gstImage) data.gstImage = await saveFileToPublicUploads(files.gstImage, baseDir, "gst");
      if (files.aadharCard) data.aadharCard = await saveFileToPublicUploads(files.aadharCard, baseDir, "aadhar");
      if (files.cancelCheque) data.cancelCheque = await saveFileToPublicUploads(files.cancelCheque, baseDir, "cheque");
    }

    const updated = await prisma.vendor.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg.includes("Unique") || msg.includes("unique")) {
      return NextResponse.json({ error: "Username/Email/PAN already exists" }, { status: 400 });
    }
    console.error("VENDOR_UPDATE_ERROR", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

/* -------------- DELETE (Soft) --------------
   - JSON: { ids: string[] }
   - permission: vendor:delete
   - set active=false
--------------------------------------------*/
export async function DELETE(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPerm(me, "vendor:delete")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids[] required" }, { status: 400 });
    }
    await prisma.vendor.updateMany({ where: { id: { in: ids } }, data: { active: false } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("VENDOR_DELETE_ERROR", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}