import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma"; // ✅ singleton

export async function GET() {
  try {
    const store = await cookies(); // Next 15
    const token = store.get("user_token")?.value;
    if (!token) return NextResponse.json({ loggedIn: false }, { status: 401 });

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "apex-secret"
    ) as { id: string; role: "vendor" | "customer" };

    // role ke hisaab se DB hit
    let user:
      | { id: string; username: string; email: string | null; phone: string | null }
      | null = null;

    if (decoded.role === "vendor") {
      const v = await prisma.vendor.findUnique({
        where: { id: decoded.id },
        select: { id: true, username: true, email: true, phone: true },
      });
      if (!v) return NextResponse.json({ loggedIn: false }, { status: 401 });
      user = v;
    } else {
      const c = await prisma.customer.findUnique({
        where: { id: decoded.id },
        select: { id: true, username: true, email: true, phone: true },
      });
      if (!c) return NextResponse.json({ loggedIn: false }, { status: 401 });
      user = c;
    }

    return NextResponse.json({
      loggedIn: true,
      role: decoded.role,
      user,
    });
  } catch (err) {
    console.error("me error:", err);
    return NextResponse.json({ loggedIn: false }, { status: 401 });
  }
}