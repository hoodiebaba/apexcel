// src/app/api/sudo/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json(
    { success: true, message: "Logged out" },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "Surrogate-Control": "no-store",
      },
    }
  );

  res.cookies.set("sudo_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
  });

  return res;
}