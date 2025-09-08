import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
const prisma = new PrismaClient();

/**
 * GET /api/sudo/customer/file?id=...&type=pan|gst|aadhar|cheque
 * Opens public file in a new tab (302 redirect to /uploads/... path)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || "";
    const type = (searchParams.get("type") || "").toLowerCase();

    if (!id || !["pan", "gst", "aadhar", "cheque"].includes(type)) {
      return NextResponse.json({ error: "id and valid type required" }, { status: 400 });
    }

    const row = await prisma.customer.findUnique({
      where: { id },
      select: { panImage: true, gstImage: true, aadharCard: true, cancelCheque: true },
    });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const map: Record<string, string | null | undefined> = {
      pan: row.panImage,
      gst: row.gstImage,
      aadhar: row.aadharCard,
      cheque: row.cancelCheque,
    };

    const fileUrl = map[type];
    if (!fileUrl) return NextResponse.json({ error: "File not available" }, { status: 404 });

    // redirect to public URL (served by Next static)
    return NextResponse.redirect(new URL(fileUrl, req.url));
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}