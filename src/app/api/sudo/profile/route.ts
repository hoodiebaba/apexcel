// src/app/api/sudo/profile/route.ts
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

function getUserFromAuthHeader(req: Request) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET || "apex-secret") as any;
  } catch {
    return null;
  }
}

function resolvePhoto(userId: string, dbPhoto?: string) {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "profile", "sudo", userId);

  if (dbPhoto && dbPhoto.startsWith("/uploads/")) {
    const abs = path.join(process.cwd(), "public", dbPhoto);
    if (fs.existsSync(abs)) return dbPhoto;
  }

  if (fs.existsSync(uploadDir)) {
    const files = fs.readdirSync(uploadDir);
    if (files.length > 0) {
      return `/uploads/profile/sudo/${userId}/${files[0]}`;
    }
  }

  return "/user.png";
}

// ✅ GET profile
export async function GET(req: Request) {
  const decoded = getUserFromAuthHeader(req);
  if (!decoded)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.admin.findUnique({ where: { id: decoded.id } });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.role !== "sudo")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const photoPath = resolvePhoto(decoded.id, user.photo ?? undefined);

  return NextResponse.json({
    user: { ...user, name: user.name || "", photo: photoPath },
  });
}

// ✅ POST profile update
export async function POST(req: Request) {
  const decoded = getUserFromAuthHeader(req);
  if (!decoded)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.admin.findUnique({ where: { id: decoded.id } });
  if (!dbUser)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (dbUser.role !== "sudo")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const contentType = req.headers.get("content-type") || "";
  let updateData: any = {};

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (file) {
        const uploadDir = path.join(process.cwd(), "public", "uploads", "profile", "sudo", decoded.id);
        fs.mkdirSync(uploadDir, { recursive: true });

        fs.readdirSync(uploadDir).forEach((f) =>
          fs.unlinkSync(path.join(uploadDir, f))
        );

        const ext = path.extname(file.name) || ".jpg";
        const filePath = path.join(uploadDir, `profile${ext}`);
        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filePath, buffer);

        updateData.photo = `/uploads/profile/sudo/${decoded.id}/profile${ext}`;
      }

      formData.forEach((val, key) => {
        if (key === "file") return;
        if (key === "password" && val) {
          updateData.password = bcrypt.hashSync(val.toString(), 10);
        } else if (key === "name") {
          updateData.name = val.toString().trim();
        } else {
          updateData[key] = val.toString();
        }
      });
    } else {
      const body = await req.json();
      const { password, name, photo, ...rest } = body;

      if (password?.trim()) {
        updateData.password = await bcrypt.hash(password, 10);
      }
      if (name) {
        updateData.name = name.trim();
      }
      updateData = { ...updateData, ...rest };
    }

    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    if (!updateData.photo) delete updateData.photo;

    if (updateData.permissions !== undefined) {
      if (
        updateData.permissions === "" ||
        updateData.permissions === "null" ||
        updateData.permissions === null
      ) {
        updateData.permissions = [];
      } else if (typeof updateData.permissions === "string") {
        updateData.permissions = updateData.permissions
          .split(",")
          .map((p: string) => p.trim())
          .filter((p: string) => p.length > 0);
      }
    }

    const updated = await prisma.admin.update({
      where: { id: decoded.id },
      data: updateData,
    });

    const photoPath = resolvePhoto(decoded.id, updated.photo ?? undefined);

    return NextResponse.json({
      success: true,
      user: { ...updated, name: updated.name || "", photo: photoPath },
    });
  } catch (err) {
    console.error("Update failed:", err);
    return NextResponse.json(
      { error: "Update failed", details: String(err) },
      { status: 500 }
    );
  }
}