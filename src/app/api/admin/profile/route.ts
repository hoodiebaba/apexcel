import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** -------------- helpers -------------- */
function stripSensitive(u: any) {
  if (!u) return u;
  const { password, permissions, createdAt, updatedAt, ...safe } = u;
  return safe;
}

function decodeToken(token?: string | null) {
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET || "apex-secret") as any;
  } catch {
    return null;
  }
}

async function getDecodedFromReq(req: Request) {
  // 1) Authorization: Bearer <token>
  const authHeader = req.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  let decoded = decodeToken(bearer);
  if (decoded) return decoded;

  // 2) httpOnly cookies
  const jar = await cookies();
  const adminTok = jar.get("admin_token")?.value;
  const sudoTok = jar.get("sudo_token")?.value;
  decoded = decodeToken(adminTok || sudoTok);
  return decoded;
}

function resolvePhoto(userId: string, dbPhoto?: string) {
  const uploadRoot = path.join(process.cwd(), "public");
  const dir = path.join(uploadRoot, "uploads", "profile", "admin", userId);

  if (dbPhoto && dbPhoto.startsWith("/uploads/")) {
    const abs = path.join(uploadRoot, dbPhoto.replace(/^\/+/, ""));
    if (fs.existsSync(abs)) return dbPhoto;
  }
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir).filter(Boolean);
    if (files.length) return `/uploads/profile/admin/${userId}/${files[0]}`;
  }
  return "/user.png";
}

function logoutResponse(json: Record<string, any>, status = 401) {
  const res = NextResponse.json(json, { status });
  // expire both possible cookies to be safe
  res.cookies.set("admin_token", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
  res.cookies.set("sudo_token", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
  return res;
}

/** -------------- GET (prefill) -------------- */
export async function GET(req: Request) {
  const decoded = await getDecodedFromReq(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.admin.findUnique({ where: { id: decoded.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // role guard (admin area me sudo ko bhi allow kiya gaya hai)
  if (user.role !== "admin" && user.role !== "sudo") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // status guard → inactive => force logout
  if (user.status !== "active") {
    return logoutResponse({ error: "Account inactive" }, 401);
  }

  const photo = resolvePhoto(user.id, user.photo ?? undefined);
  const safe = stripSensitive(user);
  return NextResponse.json({ user: { ...safe, name: user.name || "", photo } });
}

/** -------------- POST (update) -------------- */
export async function POST(req: Request) {
  const decoded = await getDecodedFromReq(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.admin.findUnique({ where: { id: decoded.id } });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (dbUser.role !== "admin" && dbUser.role !== "sudo") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // status guard → inactive => logout + block update
  if (dbUser.status !== "active") {
    return logoutResponse({ error: "Account inactive" }, 401);
  }

  const contentType = req.headers.get("content-type") || "";
  const dataToUpdate: Record<string, any> = {};

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (file && file.size > 0) {
        const uploadDir = path.join(process.cwd(), "public", "uploads", "profile", "admin", dbUser.id);
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        for (const f of fs.readdirSync(uploadDir)) {
          try { fs.unlinkSync(path.join(uploadDir, f)); } catch {}
        }
        const ext = (path.extname(file.name || "") || ".jpg").toLowerCase();
        const filePath = path.join(uploadDir, `profile${ext}`);
        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filePath, buffer);
        dataToUpdate.photo = `/uploads/profile/admin/${dbUser.id}/profile${ext}`;
      }

      formData.forEach((val, key) => {
        if (key === "file") return;
        const str = typeof val === "string" ? val : "";
        if (key === "password") {
          if (str.trim()) dataToUpdate.password = bcrypt.hashSync(str.trim(), 10);
          return;
        }
        // hard block
        if (["role", "status", "permissions", "id", "createdAt", "updatedAt"].includes(key)) return;
        dataToUpdate[key] = str;
      });
    } else {
      const body = await req.json();
      const { password, role, status, permissions, id, createdAt, updatedAt, ...rest } = body || {};
      if (password && String(password).trim()) {
        dataToUpdate.password = await bcrypt.hash(String(password).trim(), 10);
      }
      Object.assign(dataToUpdate, rest);
    }

    // final safety
    delete dataToUpdate.id;
    delete dataToUpdate.role;
    delete dataToUpdate.status;
    delete dataToUpdate.permissions;
    delete dataToUpdate.createdAt;
    delete dataToUpdate.updatedAt;

    const updated = await prisma.admin.update({
      where: { id: dbUser.id },
      data: dataToUpdate,
    });

    const photo = resolvePhoto(dbUser.id, updated.photo ?? undefined);
    const safe = stripSensitive(updated);
    return NextResponse.json({ success: true, user: { ...safe, name: updated.name || "", photo } });
  } catch (err) {
    console.error("ADMIN_PROFILE_UPDATE_FAILED", err);
    return NextResponse.json({ error: "Update failed", details: String(err) }, { status: 500 });
  }
}