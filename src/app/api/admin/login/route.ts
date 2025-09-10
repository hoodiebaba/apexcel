import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

type SocialJson = {
  adminDeviceId?: string;
  adminDeviceMeta?: { ua?: string; ip?: string; ts?: number };
};

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ message: "Missing credentials" }, { status: 400 });
    }

    const user = await prisma.admin.findUnique({ where: { username } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    // ✅ strictly admin (sudo ko admin portal se login mat karao)
    if (String(user.role).toLowerCase() !== "admin") {
      return NextResponse.json({ message: "Not authorized" }, { status: 403 });
    }

    // ✅ status gate
    if (String(user.status).toLowerCase() !== "active") {
      return NextResponse.json({ message: "Account is inactive" }, { status: 403 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });

    // ---- One-Device lock (no DB change; reuse socialUrls JSON) ----
    const headers = Object.fromEntries(req.headers);
    const clientDeviceId = (headers["x-device-id"] as string) || "";
    const ua = (headers["user-agent"] as string) || "";
    const ip =
      (headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      (headers["x-real-ip"] as string) ||
      "0.0.0.0";

    const social: SocialJson = (user.socialUrls as any) || {};
    const boundId = social.adminDeviceId || "";

    if (boundId && clientDeviceId && boundId !== clientDeviceId) {
      return NextResponse.json(
        { message: "This admin account is already locked to another device." },
        { status: 423 } // Locked
      );
    }

    if (!boundId) {
      // first time bind
      const idToBind = clientDeviceId || `fp_${Math.random().toString(36).slice(2)}`;
      await prisma.admin.update({
        where: { id: user.id },
        data: {
          socialUrls: {
            ...(user.socialUrls as any),
            adminDeviceId: idToBind,
            adminDeviceMeta: { ua, ip, ts: Date.now() },
          } as any,
        },
      });
    }

    // ✅ 30 days token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "apex-secret",
      { expiresIn: "30d" }
    );

    const res = NextResponse.json({ message: "Login successful", role: user.role }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "Surrogate-Control": "no-store",
      },
    });

    res.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return res;
  } catch (err) {
    console.error("Admin login error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}