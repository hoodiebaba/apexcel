import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function GET() {
  try {
    const hashed = await bcrypt.hash("admin123", 10);

    const sudo = await prisma.admin.create({
      data: {
        username: "sudo",
        email: "sudo@example.com",
        password: hashed,
        role: "sudo",
        name: "Super Admin",
      },
    });

    return NextResponse.json({ message: "Sudo created", sudo });
  } catch (err) {
    console.error("Seed sudo error:", err);
    return NextResponse.json({ error: "Failed to seed sudo" }, { status: 500 });
  }
}