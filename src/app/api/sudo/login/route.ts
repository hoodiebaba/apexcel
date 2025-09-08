// src/app/api/sudo/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma"; // ✅ singleton prisma use

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const user = await prisma.admin.findUnique({ where: { username } });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    if (user.role !== "sudo") {
      return NextResponse.json({ message: "Not authorized" }, { status: 403 });
    }

    // ✅ 30 days token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "apex-secret",
      { expiresIn: "30d" }
    );

    // ✅ JSON response + hard no-cache headers
    const res = NextResponse.json(
      { message: "Login successful", role: user.role },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
        },
      }
    );

    // ✅ 30-day httpOnly cookie
    res.cookies.set("sudo_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days (seconds)
    });

    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}