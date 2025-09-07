import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const user = await prisma.admin.findUnique({ where: { username } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });

    if (user.role !== "sudo")
      return NextResponse.json({ message: "Not authorized" }, { status: 403 });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "apex-secret",
      { expiresIn: "7d" }
    );

    const res = NextResponse.json({ message: "Login successful", role: user.role });

    // ✅ Set HTTP-only cookie
    res.cookies.set("sudo_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
      sameSite: "lax",
    });

    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}