import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

function resolvePhoto(userId: string, dbPhoto?: string | null) {
  const uploadRoot = path.join(process.cwd(), "public");

  // DB me jo /uploads path hai usko prefer karo
  if (dbPhoto && dbPhoto.startsWith("/uploads/")) {
    const abs = path.join(uploadRoot, dbPhoto.replace(/^\/+/, ""));
    if (fs.existsSync(abs)) return dbPhoto;
  }

  // fallback: uploads/profile/admin/:id
  const dir = path.join(uploadRoot, "uploads", "profile", "admin", userId);
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir).filter(Boolean);
    if (files.length) return `/uploads/profile/admin/${userId}/${files[0]}`;
  }

  // default
  return "/user.png";
}

export async function GET() {
  try {
    const jar = await cookies();
    const token = jar.get("admin_token")?.value;
    if (!token) return NextResponse.json({ loggedIn: false }, { status: 401 });

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "apex-secret"
    ) as { id: string; role: "admin" | "sudo" };

    const user = await prisma.admin.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        permissions: true,
        photo: true,
      },
    });

    if (!user || (user.role !== "admin" && user.role !== "sudo")) {
      return NextResponse.json({ loggedIn: false }, { status: 401 });
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { loggedIn: false, reason: "inactive" },
        { status: 403 }
      );
    }

    const photo = resolvePhoto(user.id, user.photo ?? undefined);

    return NextResponse.json({
      loggedIn: true,
      role: user.role,
      user: {
        id: user.id,
        name: user.name || "",
        email: user.email || "",
        role: user.role,
        status: user.status,
        permissions: user.permissions || [],
        photo, // ✅ new
      },
    });
  } catch {
    return NextResponse.json({ loggedIn: false }, { status: 401 });
  }
}