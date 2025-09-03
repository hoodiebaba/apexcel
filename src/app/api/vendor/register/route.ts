// src/app/api/vendor/register/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const vendorName = formData.get("vendorName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const username = formData.get("username") as string; // ✅ username added
    const password = await bcrypt.hash(formData.get("password") as string, 10);

    // ✅ file uploads
    const gstImage = formData.get("gstImage") as File | null;
    const panImage = formData.get("panImage") as File | null;
    const cancelCheque = formData.get("cancelCheque") as File | null;
    const aadharCard = formData.get("aadharCard") as File | null;

    // vendor-specific folder
    const vendorFolder = path.join(process.cwd(), "uploads", "vendors", email);
    fs.mkdirSync(vendorFolder, { recursive: true });

    const saveFile = async (file: File | null, fallback: string) => {
      if (!file) return null;
      const buffer = Buffer.from(await file.arrayBuffer());
      const originalName = file.name || fallback;
      const ext = path.extname(originalName) || ".png"; // preserve extension
      const fileName = `${fallback}${ext}`;
      const filePath = path.join(vendorFolder, fileName);

      fs.writeFileSync(filePath, buffer);
      return `/uploads/vendors/${email}/${fileName}`;
    };

    const gstPath = await saveFile(gstImage, "gstFile");
    const panPath = await saveFile(panImage, "panFile");
    const chequePath = await saveFile(cancelCheque, "chequeFile");
    const aadharPath = await saveFile(aadharCard, "aadharFile");

    // ✅ create vendor in DB
    const vendor = await prisma.vendor.create({
      data: {
        vendorName,
        username,
        email,
        phone,
        password,
        address: formData.get("address") as string,
        city: formData.get("city") as string,
        state: formData.get("state") as string,
        pinCode: formData.get("pinCode") as string,
        vendorType: formData.get("vendorType") as string,
        companyName: formData.get("companyName") as string,
        accountType: formData.get("accountType") as string,
        bankAccountNo: formData.get("bankAccountNo") as string,
        bankName: formData.get("bankName") as string,
        ifsc: formData.get("ifsc") as string,
        accountHolder: formData.get("accountHolder") as string,
        upi: formData.get("upi") as string,
        paymentTerms: formData.get("paymentTerms") as string,
        gstNumber: formData.get("gstNumber") as string,
        gstImage: gstPath,
        aadharCard: aadharPath,
        panNumber: formData.get("panNumber") as string,
        panImage: panPath,
        cancelCheque: chequePath,
        message: formData.get("message") as string,
        registeredBy: "self",
      },
    });

    return NextResponse.json({ message: "✅ Vendor registered successfully!", vendor });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "❌ Server error" }, { status: 500 });
  }
}