// src/app/api/sudo/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const store = await cookies();                   // ⬅️ await
    const token = store.get("sudo_token")?.value;
    if (!token) return NextResponse.json({ loggedIn: false }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "apex-secret") as any;
    const user = await prisma.admin.findUnique({ where: { id: decoded.id } });

    if (!user || user.role !== "sudo") {
      return NextResponse.json({ loggedIn: false }, { status: 401 });
    }

    return NextResponse.json({
      loggedIn: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Me API error:", err);
    return NextResponse.json({ loggedIn: false }, { status: 401 });
  }
}