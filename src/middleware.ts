// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "apex-secret");

async function decodeJWT(token?: string): Promise<null | Record<string, any>> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as Record<string, any>;
  } catch {
    return null;
  }
}

export default async function middleware(req: NextRequest) {
  // ✅ trailing slash safe path
  const pathnameRaw = req.nextUrl.pathname;
  const pathname = pathnameRaw.replace(/\/+$/, "") || "/";

  // Areas & login routes
  const isSudoLogin    = pathname === "/sudo/login";
  const isAdminLogin   = pathname === "/admin/login";
  const isUserLogin    = pathname === "/login";          // vendor+customer common

  const isSudoArea     = pathname.startsWith("/sudo");
  const isAdminArea    = pathname.startsWith("/admin");
  const isVendorArea   = pathname.startsWith("/vendor");
  const isCustomerArea = pathname.startsWith("/customer");
  // note: /register public hi rahega

  // Read cookies (may or may not exist)
  const sudoPayload  = await decodeJWT(req.cookies.get("sudo_token")?.value);
  const adminPayload = await decodeJWT(req.cookies.get("admin_token")?.value);
  const userPayload  = await decodeJWT(req.cookies.get("user_token")?.value); // { id, role: "vendor"|"customer" }

  // ----- SUDO guards -----
  if (isSudoArea && !isSudoLogin) {
    if (!sudoPayload || String(sudoPayload.role).toLowerCase() !== "sudo") {
      return NextResponse.redirect(new URL("/sudo/login", req.url));
    }
  }
  if (isSudoLogin) {
    if (String(sudoPayload?.role).toLowerCase() === "sudo") {
      return NextResponse.redirect(new URL("/sudo", req.url));
    }
  }

  // ----- ADMIN guards -----
  if (isAdminArea && !isAdminLogin) {
    const role = String(adminPayload?.role || "").toLowerCase();
    const ok = role === "admin" || role === "sudo";
    if (!ok) return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  if (isAdminLogin) {
    const role = String(adminPayload?.role || "").toLowerCase();
    if (role === "admin" || role === "sudo") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  // ----- VENDOR/CUSTOMER guards -----
  if (isVendorArea) {
    if (String(userPayload?.role || "").toLowerCase() !== "vendor") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }
  if (isCustomerArea) {
    if (String(userPayload?.role || "").toLowerCase() !== "customer") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // ----- /login bounce (vendor+customer) -----
  if (isUserLogin) {
    const role = String(userPayload?.role || "").toLowerCase();
    if (role === "vendor")   return NextResponse.redirect(new URL("/vendor", req.url));
    if (role === "customer") return NextResponse.redirect(new URL("/customer", req.url));
  }

  // ✅ Login pages ko no-store to avoid stale auto-bounce after logout
  if (isSudoLogin || isAdminLogin || isUserLogin) {
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store, max-age=0");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/sudo/login",      // ✅ include login routes
    "/admin/login",     // ✅ include login routes
    "/sudo/:path*",
    "/admin/:path*",
    "/vendor/:path*",
    "/customer/:path*",
    "/login",
  ],
};