// src/app/api/sudo/me/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // no static caching
export const revalidate = 0;

const prisma = new PrismaClient();

function resolvePhoto(userId: string, dbPhoto?: string) {
  const root = path.join(process.cwd(), "public");
  if (dbPhoto && dbPhoto.startsWith("/uploads/")) {
    const abs = path.join(root, dbPhoto.replace(/^\/+/, ""));
    if (fs.existsSync(abs)) return dbPhoto;
  }
  const dir = path.join(root, "uploads", "profile", "sudo", userId);
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    if (files.length) return `/uploads/profile/sudo/${userId}/${files[0]}`;
  }
  return "/user.png";
}

export async function GET() {
  try {
    // ✅ await cookies()
    const cookieStore = await cookies();
    const token = cookieStore.get("sudo_token")?.value;
    if (!token) return NextResponse.json({ loggedIn: false }, { status: 200 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "apex-secret") as any;

    const user = await prisma.admin.findUnique({
      where: { id: decoded.id },
      select: {
        id: true, role: true, username: true, name: true, email: true, photo: true,
      },
    });

    if (!user || user.role !== "sudo") {
      return NextResponse.json({ loggedIn: false }, { status: 200 });
    }

    const photo = resolvePhoto(user.id, user.photo ?? undefined);

    return NextResponse.json({
      loggedIn: true,
      user: {
        id: user.id,
        role: user.role,
        username: user.username,
        name: user.name || "",
        email: user.email,
        photo,
      },
    });
  } catch (e) {
    return NextResponse.json({ loggedIn: false }, { status: 200 });
  }
}