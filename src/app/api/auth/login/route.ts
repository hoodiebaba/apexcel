import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma"; // ✅ singleton

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ message: "Missing credentials" }, { status: 400 });
    }

    // 🔎 username se vendor aur customer dono check
    // (priority: vendor → customer; agar same username dono me hua to vendor pick hoga)
    const [vendor, customer] = await Promise.all([
      prisma.vendor.findUnique({ where: { username } }),
      prisma.customer.findUnique({ where: { username } }),
    ]);

    const account = vendor ?? customer;
    if (!account) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const valid = await bcrypt.compare(password, account.password);
    if (!valid) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const role: "vendor" | "customer" = vendor ? "vendor" : "customer";

    // 🔐 JWT 30 days
    const token = jwt.sign(
      { id: account.id, role },
      process.env.JWT_SECRET || "apex-secret",
      { expiresIn: "30d" }
    );

    // 🍪 httpOnly cookie (30 days)
    const res = NextResponse.json({ message: "Login successful", role });
    res.cookies.set("user_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30d
    });

    return res;
  } catch (err) {
    console.error("auth/login error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}