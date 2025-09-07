// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Edge runtime पर jsonwebtoken मत यूज़ करो
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "apex-secret");

async function verifyJWT(token?: string) {
  if (!token) return false;
  try {
    await jwtVerify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // protect /sudo/*
  if (pathname.startsWith("/sudo") && !pathname.startsWith("/sudo/login")) {
    const ok = await verifyJWT(req.cookies.get("sudo_token")?.value);
    if (!ok) return NextResponse.redirect(new URL("/sudo/login", req.url));
  }

  // protect /admin/*
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const ok = await verifyJWT(req.cookies.get("admin_token")?.value);
    if (!ok) return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return NextResponse.next();
}


export const config = {
  matcher: ["/sudo/:path*", "/admin/:path*"],
};
