// src/app/api/sudo/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

type SocialJson = {
  sudoDeviceId?: string;
  sudoDeviceMeta?: { ua?: string; ip?: string; ts?: number };
  // ...existing keys allowed
};

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const user = await prisma.admin.findUnique({ where: { username } });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (String(user.role).toLowerCase() !== "sudo") {
      return NextResponse.json({ message: "Not authorized" }, { status: 403 });
    }

    if (String(user.status).toLowerCase() !== "active") {
      return NextResponse.json({ message: "Account inactive" }, { status: 403 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // ---- Device binding (no DB change; reuse socialUrls JSON) ----
    const headers = Object.fromEntries(req.headers);
    const clientDeviceId = headers["x-device-id"] || ""; // from client
    const ua = headers["user-agent"] || "";
    const ip = headers["x-forwarded-for"]?.split(",")[0]?.trim() || headers["x-real-ip"] || "0.0.0.0";

    const social: SocialJson = (user.socialUrls as any) || {};
    const boundId = social.sudoDeviceId || "";

    if (boundId && clientDeviceId && boundId !== clientDeviceId) {
      // already bound to some other device
      return NextResponse.json(
        { message: "Sudo already locked to another device. Contact support." },
        { status: 423 } // Locked
      );
    }

    if (!boundId) {
      // first time bind this device
      social.sudoDeviceId = clientDeviceId || `fp_${Math.random().toString(36).slice(2)}`;
      social.sudoDeviceMeta = { ua, ip, ts: Date.now() };

      await prisma.admin.update({
        where: { id: user.id },
        data: { socialUrls: social as any },
      });
    }

    // ✅ 30 days token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "apex-secret",
      { expiresIn: "30d" }
    );

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

    res.cookies.set("sudo_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return res;
  } catch (err) {
    console.error("Sudo Login error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}