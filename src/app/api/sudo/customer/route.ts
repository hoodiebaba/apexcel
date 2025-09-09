// FILE: app/api/sudo/customer/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";

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
// safe file saver (name/type optional) + only when size>0
async function saveFileToPublicUploads(file: File | null, outDir: string, fileNameBase: string) {
  const size = (file as any)?.size ?? 0;
  if (!file || size === 0) return null;

  const rawType = (file as any)?.type || "";
  const rawName = (file as any)?.name || "";
  const byType = rawType && String(rawType).includes("/") ? String(rawType).split("/").pop() : "";
  const byName = rawName && String(rawName).includes(".") ? String(rawName).split(".").pop() : "";
  const extGuess = (byType || byName || "bin").toLowerCase();

  const outName = `${fileNameBase}.${extGuess}`;
  const outPath = path.join(process.cwd(), "public", outDir, outName);
  await ensureDir(path.dirname(outPath));
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.promises.writeFile(outPath, buf);
  return `/${path.posix.join(outDir, outName)}`;
}
function who(me: any) {
  const role = me?.role === "customer" ? "self" : me?.role || "admin";
  const name = me?.name || me?.username || "";
  return `${role}:${name}`;
}

/* -------------- GET -------------- */
export async function GET(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPerm(me, "customer:page_view") && !hasPerm(me, "customer:view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const q = (searchParams.get("q") || "").trim();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "100", 10), 200);
  const skip = (page - 1) * pageSize;

  if (id) {
    const row = await prisma.customer.findUnique({ where: { id } });
    return NextResponse.json(row ?? null);
  }

  const where: any = { active: true };
  if (q) {
    where.OR = [
      { customerName: { contains: q, mode: "insensitive" } },
      { username: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { companyName: { contains: q, mode: "insensitive" } },
      { panNumber: { contains: q, mode: "insensitive" } },
      { gstNumber: { contains: q, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        firstName: true,          // <— include for table/use
        lastName: true,           // <— include for table/use
        customerName: true,
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
    prisma.customer.count({ where }),
  ]);

  return NextResponse.json({ rows, total, page, pageSize });
}

/* -------------- POST (Create) -------------- */
export async function POST(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPerm(me, "customer:create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const form = await req.formData();

    const firstName = (form.get("firstName") || "").toString().trim();
    const lastName  = (form.get("lastName")  || "").toString().trim();
    const customerNameRaw = (form.get("customerName") || "").toString().trim();
    const customerName = customerNameRaw || `${firstName} ${lastName}`.trim();

    const username = (form.get("username") || "").toString().trim();
    const email    = (form.get("email")    || "").toString().trim();
    const phone    = (form.get("phone")    || "").toString().trim();
    const passwordRaw = (form.get("password") || "").toString();

    const address  = (form.get("address")  || "").toString();
    const city     = (form.get("city")     || "").toString();
    const state    = (form.get("state")    || "").toString();
    const pinCode  = (form.get("pinCode")  || "").toString();

    const customerType = (form.get("customerType") || "").toString();
    const freightTerms = (form.get("freightTerms") || "").toString();
    const companyName  = (form.get("companyName")  || "").toString();

    const accountType   = (form.get("accountType")   || "").toString();
    const bankAccountNo = (form.get("bankAccountNo") || "").toString();
    const bankName      = (form.get("bankName")      || "").toString();
    const ifsc          = (form.get("ifsc")          || "").toString();
    const accountHolder = (form.get("accountHolder") || "").toString();
    const upi           = (form.get("upi")           || "").toString();
    const paymentTerms  = (form.get("paymentTerms")  || "").toString();

    const gstNumber = (form.get("gstNumber") || "").toString();
    const panNumber = (form.get("panNumber") || "").toString(); // optional in schema

    const message = (form.get("message") || "").toString();

    // ✅ basic validations
    if (!username || !email || !phone || !passwordRaw || !customerName) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const password = await bcrypt.hash(passwordRaw, 10);
    const registeredBy = who(me);

    const created = await prisma.customer.create({
      data: {
        firstName: firstName || null,   // <— save in DB
        lastName:  lastName  || null,   // <— save in DB
        username,
        customerName,
        phone,
        email,
        password,
        address,
        city,
        state,
        pinCode,

        customerType,
        freightTerms,
        companyName: companyName || null,

        accountType,
        bankAccountNo,
        bankName,
        ifsc,
        accountHolder,
        upi: upi || null,
        paymentTerms,

        gstNumber: gstNumber || null,
        panNumber: panNumber || null,

        message: message || null,
        registeredBy,
        kycBy: null,
        kycStatus: "pending",
      },
    });

    // Files
    const baseDir = path.posix.join("uploads", "customer", created.id);
    const panImage    = await saveFileToPublicUploads(form.get("panImage") as File,     baseDir, "pan");
    const gstImage    = await saveFileToPublicUploads(form.get("gstImage") as File,     baseDir, "gst");
    const aadharCard  = await saveFileToPublicUploads(form.get("aadharCard") as File,   baseDir, "aadhar");
    const cancelCheque= await saveFileToPublicUploads(form.get("cancelCheque") as File, baseDir, "cheque");

    if (panImage || gstImage || aadharCard || cancelCheque) {
      await prisma.customer.update({
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
    console.error("CUSTOMER_CREATE_ERROR", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}

/* -------------- PUT (Update) -------------- */
export async function PUT(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPerm(me, "customer:edit")) {
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
        firstName: take("firstName"),     // <— handle on update
        lastName:  take("lastName"),      // <— handle on update
        username: take("username"),
        customerName: take("customerName"),
        phone: take("phone"),
        email: take("email"),
        password: take("password"),
        address: take("address"),
        city: take("city"),
        state: take("state"),
        pinCode: take("pinCode"),
        customerType: take("customerType"),
        freightTerms: take("freightTerms"),
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

    // if kycStatus updated → tag who did it
    if (typeof data.kycStatus === "string" && data.kycStatus.length > 0) {
      data.kycBy = who(me);
    }

    // password: ignore blank; else hash
    if (data.password !== undefined) {
      if (typeof data.password !== "string" || data.password.trim() === "") {
        delete data.password;
      } else {
        data.password = await bcrypt.hash(data.password, 10);
      }
    }

    // auto-customerName from first/last if provided & empty
    if ((!data.customerName || !data.customerName.trim()) && (data.firstName || data.lastName)) {
      data.customerName = `${data.firstName || ""} ${data.lastName || ""}`.trim();
    }

    // prune undefined
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

    const old = await prisma.customer.findUnique({ where: { id } });
    if (!old) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Files (only real ones)
    if (contentType.includes("multipart/form-data")) {
      const baseDir = path.posix.join("uploads", "customer", id);
      const writeIfAny = async (f: File | null, base: string) =>
        f && (f as any).size > 0 ? await saveFileToPublicUploads(f, baseDir, base) : null;

      const panImage    = await writeIfAny(files.panImage, "pan");
      const gstImage    = await writeIfAny(files.gstImage, "gst");
      const aadharCard  = await writeIfAny(files.aadharCard, "aadhar");
      const cancelCheque= await writeIfAny(files.cancelCheque, "cheque");

      if (panImage) data.panImage = panImage;
      if (gstImage) data.gstImage = gstImage;
      if (aadharCard) data.aadharCard = aadharCard;
      if (cancelCheque) data.cancelCheque = cancelCheque;
    }

    const updated = await prisma.customer.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg.toLowerCase().includes("unique")) {
      return NextResponse.json({ error: "Username/Email/PAN already exists" }, { status: 400 });
    }
    console.error("CUSTOMER_UPDATE_ERROR", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

/* -------------- DELETE (Soft) -------------- */
export async function DELETE(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPerm(me, "customer:delete")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids[] required" }, { status: 400 });
    }
    await prisma.customer.updateMany({ where: { id: { in: ids } }, data: { active: false } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("CUSTOMER_DELETE_ERROR", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}