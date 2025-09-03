import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const username = formData.get("username") as string;
    const customerName = formData.get("customerName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const password = await bcrypt.hash(formData.get("password") as string, 10);

    // files
    const gstImage = formData.get("gstImage") as File | null;
    const panImage = formData.get("panImage") as File | null;
    const cancelCheque = formData.get("cancelCheque") as File | null;
    const aadharCard = formData.get("aadharCard") as File | null;

    // folder per customer
    const customerFolder = path.join(process.cwd(), "uploads", "customers", username);
    fs.mkdirSync(customerFolder, { recursive: true });

    const saveFile = async (file: File | null, fallback: string) => {
      if (!file) return null;
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = path.extname(file.name || "") || ".png";
      const fileName = `${fallback}${ext}`;
      const filePath = path.join(customerFolder, fileName);
      fs.writeFileSync(filePath, buffer);
      return `/uploads/customers/${username}/${fileName}`;
    };

    const gstPath = await saveFile(gstImage, "gstFile");
    const panPath = await saveFile(panImage, "panFile");
    const chequePath = await saveFile(cancelCheque, "chequeFile");
    const aadharPath = await saveFile(aadharCard, "aadharFile");

    const customer = await prisma.customer.create({
      data: {
        username,
        customerName,
        email,
        phone,
        password,
        address: formData.get("address") as string,
        city: formData.get("city") as string,
        state: formData.get("state") as string,
        pinCode: formData.get("pinCode") as string,
        customerType: formData.get("customerType") as string,
        freightTerms: formData.get("freightTerms") as string,
        companyName: formData.get("companyName") as string,
        accountType: formData.get("accountType") as string,
        bankAccountNo: formData.get("bankAccountNo") as string,
        bankName: formData.get("bankName") as string,
        ifsc: formData.get("ifsc") as string,
        accountHolder: formData.get("accountHolder") as string,
        upi: formData.get("upi") as string,
        gstNumber: formData.get("gstNumber") as string,
        gstImage: gstPath,
        panNumber: formData.get("panNumber") as string,
        panImage: panPath,
        aadharCard: aadharPath,
        cancelCheque: chequePath,
        paymentTerms: formData.get("paymentTerms") as string,
        message: formData.get("message") as string,
        registeredBy: "self",
      },
    });

    return NextResponse.json({ message: "Customer registered", customer });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}