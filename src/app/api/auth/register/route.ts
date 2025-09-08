import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs"; // important: we need fs

const prisma = new PrismaClient();

function sanitizeFilename(name: string) {
  // keep extension, remove weird chars
  const ext = name.includes(".") ? "." + name.split(".").pop() : "";
  const base = name.replace(/\.[^/.]+$/, "");
  return (
    base
      .toLowerCase()
      .replace(/[^a-z0-9_\-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") + ext.toLowerCase()
  );
}

async function saveUploadsForDoc(
  role: "vendor" | "customer",
  id: string,
  fd: FormData
) {
  const saved: Record<string, string> = {};
  const destDir = path.join(process.cwd(), "public", "uploads", role, id);
  await fs.mkdir(destDir, { recursive: true });

  // iterate all keys; if value is File and has size -> save
  for (const [key, val] of fd.entries()) {
    if (val instanceof File && val.size > 0) {
      const safe = sanitizeFilename(val.name || `${key}-${Date.now()}`);
      const diskPath = path.join(destDir, safe);
      const buf = Buffer.from(await val.arrayBuffer());
      await fs.writeFile(diskPath, buf);
      // public URL (served by Next from /public)
      saved[key] = `/uploads/${role}/${id}/${safe}`;
    }
  }
  return saved; // map of fieldName -> public URL
}

async function readBody(req: Request) {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("multipart/form-data")) {
    const fd = await req.formData();
    // create a plain object of text fields (files handled later)
    const data: Record<string, any> = {};
    for (const [k, v] of fd.entries()) {
      if (typeof v === "string") data[k] = v.trim();
    }
    return { kind: "multipart" as const, fd, data };
  } else if (ct.includes("application/json")) {
    const json = await req.json();
    return { kind: "json" as const, fd: null, data: json || {} };
  } else {
    // fall back to formData()
    const fd = await req.formData();
    const data: Record<string, any> = {};
    for (const [k, v] of fd.entries()) {
      if (typeof v === "string") data[k] = v.trim();
    }
    return { kind: "multipart" as const, fd, data };
  }
}

export async function POST(req: Request) {
  try {
    const { kind, fd, data } = await readBody(req);

    const role = String(data.role || "").toLowerCase();
    if (role !== "vendor" && role !== "customer") {
      return NextResponse.json(
        { message: "role must be 'vendor' or 'customer'" },
        { status: 400 }
      );
    }

    const username = String(data.username || "").trim();
    const email = String(data.email || "").trim().toLowerCase();
    const password = String(data.password || "");
    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "username, email, password are required" },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    if (role === "vendor") {
      // unique checks
      const clash = await prisma.vendor.findFirst({
        where: { OR: [{ username }, { email }] },
        select: { id: true },
      });
      if (clash) {
        return NextResponse.json(
          { message: "Username or email already exists" },
          { status: 409 }
        );
      }

      const vendorName = String(
        data.vendorName || data.fullName || data.name || ""
      ).trim();
      const phone = String(data.phone || "").trim();
      const panNumber = String(data.panNumber || "").trim();
      if (!vendorName || !phone || !panNumber) {
        return NextResponse.json(
          { message: "vendorName, phone, panNumber are required" },
          { status: 400 }
        );
      }

      const panClash = await prisma.vendor.findFirst({
        where: { panNumber },
        select: { id: true },
      });
      if (panClash) {
        return NextResponse.json(
          { message: "PAN already registered" },
          { status: 409 }
        );
      }

      // 1) create minimal record (without file URLs yet)
      const created = await prisma.vendor.create({
        data: {
          username,
          vendorName,
          phone,
          email,
          password: hashed,
          address: String(data.address || ""),
          city: String(data.city || ""),
          state: String(data.state || ""),
          pinCode: String(data.pinCode || ""),
          vendorType: String(data.vendorType || ""),
          companyName: String(data.companyName || ""),
          accountType: String(data.accountType || ""),
          bankAccountNo: String(data.bankAccountNo || ""),
          bankName: String(data.bankName || ""),
          ifsc: String(data.ifsc || ""),
          accountHolder: String(data.accountHolder || ""),
          upi: data.upi ? String(data.upi) : null,
          paymentTerms: String(data.paymentTerms || ""),
          gstNumber: data.gstNumber ? String(data.gstNumber) : null,
          panNumber,
          message: data.message ? String(data.message) : null,
          registeredBy: "self",
          kycBy: null,
          kycStatus: "pending",
          active: true,
        },
        select: { id: true },
      });

      // 2) save files (only if multipart)
      let fileMap: Record<string, string> = {};
      if (kind === "multipart" && fd) {
        fileMap = await saveUploadsForDoc("vendor", created.id, fd);
      }

      // 3) update record with file URLs (only fields present)
      if (Object.keys(fileMap).length) {
        await prisma.vendor.update({
          where: { id: created.id },
          data: {
            gstImage: fileMap.gstImage ?? undefined,
            aadharCard: fileMap.aadharCard ?? undefined,
            panImage: fileMap.panImage ?? undefined,
            cancelCheque: fileMap.cancelCheque ?? undefined,
          },
        });
      }

      return NextResponse.json(
        {
          message: "Vendor registered",
          role: "vendor",
          id: created.id,
          files: fileMap,
        },
        { status: 201 }
      );
    }

    // CUSTOMER
    {
      const clash = await prisma.customer.findFirst({
        where: { OR: [{ username }, { email }] },
        select: { id: true },
      });
      if (clash) {
        return NextResponse.json(
          { message: "Username or email already exists" },
          { status: 409 }
        );
      }

      const customerName = String(
        data.customerName || data.fullName || data.name || ""
      ).trim();
      const phone = String(data.phone || "").trim();
      if (!customerName || !phone) {
        return NextResponse.json(
          { message: "customerName and phone are required" },
          { status: 400 }
        );
      }

      // 1) create minimal record
      const created = await prisma.customer.create({
        data: {
          username,
          customerName,
          phone,
          email,
          password: hashed,
          address: String(data.address || ""),
          city: String(data.city || ""),
          state: String(data.state || ""),
          pinCode: String(data.pinCode || ""),
          customerType: String(data.customerType || ""),
          freightTerms: String(data.freightTerms || ""),
          companyName: data.companyName ? String(data.companyName) : null,
          accountType: data.accountType ? String(data.accountType) : null,
          bankAccountNo: data.bankAccountNo ? String(data.bankAccountNo) : null,
          bankName: data.bankName ? String(data.bankName) : null,
          ifsc: data.ifsc ? String(data.ifsc) : null,
          accountHolder: data.accountHolder ? String(data.accountHolder) : null,
          upi: data.upi ? String(data.upi) : null,
          gstNumber: data.gstNumber ? String(data.gstNumber) : null,
          panNumber: data.panNumber ? String(data.panNumber) : null,
          paymentTerms: data.paymentTerms ? String(data.paymentTerms) : null,
          message: data.message ? String(data.message) : null,
          registeredBy: "self",
          kycBy: null,
          kycStatus: "pending",
          active: true,
        },
        select: { id: true },
      });

      // 2) save files
      let fileMap: Record<string, string> = {};
      if (kind === "multipart" && fd) {
        fileMap = await saveUploadsForDoc("customer", created.id, fd);
      }

      // 3) update record with file URLs (whatever present)
      if (Object.keys(fileMap).length) {
        await prisma.customer.update({
          where: { id: created.id },
          data: {
            gstImage: fileMap.gstImage ?? undefined,
            aadharCard: fileMap.aadharCard ?? undefined,
            panImage: fileMap.panImage ?? undefined,
            cancelCheque: fileMap.cancelCheque ?? undefined,
          },
        });
      }

      return NextResponse.json(
        {
          message: "Customer registered",
          role: "customer",
          id: created.id,
          files: fileMap,
        },
        { status: 201 }
      );
    }
  } catch (err: any) {
    console.error("REGISTER_ERROR", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}