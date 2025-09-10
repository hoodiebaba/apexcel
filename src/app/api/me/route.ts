// src/app/api/admin/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

function resolvePhoto(userId: string, dbPhoto?: string | null) {
  const uploadRoot = path.join(process.cwd(), "public");
  if (dbPhoto && dbPhoto.startsWith("/uploads/")) {
    const abs = path.join(uploadRoot, dbPhoto.replace(/^\/+/, ""));
    if (fs.existsSync(abs)) return dbPhoto;
  }
  const dir = path.join(uploadRoot, "uploads", "profile", "admin", userId);
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir).filter(Boolean);
    if (files.length) return `/uploads/profile/admin/${userId}/${files[0]}`;
  }
  return "/user.png";
}

type Role = "sudo" | "admin" | "editor";

export async function GET() {
  try {
    const jar = await cookies();
    const token =
      jar.get("admin_token")?.value ||
      jar.get("sudo_token")?.value; // ✅ support both

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "apex-secret") as { id: string; role?: string };
    const user = await prisma.admin.findUnique({
      where: { id: decoded.id },
      select: {
        id: true, username: true, name: true, email: true, phone: true,
        role: true, status: true, permissions: true, photo: true,
      },
    });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allowed: Role[] = ["sudo", "admin", "editor"];
    const role = (allowed.includes(user.role as Role) ? user.role : "admin") as Role;

    if (user.status !== "active") {
      return NextResponse.json({ error: "Inactive", status: user.status }, { status: 403 });
    }

    const photo = resolvePhoto(user.id, user.photo ?? undefined);

    // ✅ FLAT SHAPE the UI expects
    return NextResponse.json({
      id: user.id,
      role,
      status: user.status,
      username: user.username,
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      permissions: user.permissions || [],
      photo,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}