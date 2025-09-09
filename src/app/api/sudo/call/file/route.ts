// src/app/api/sudo/call/file/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import { lookup as mimeLookup } from "mime-types";

const prisma = new PrismaClient();
export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || "";
  const mode = (searchParams.get("mode") || "download").toLowerCase();

  const row = await prisma.callFile.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const filePath = row.senderPathSend;
  const stat = await fs.promises.stat(filePath).catch(() => null);
  if (!stat) return NextResponse.json({ error: "File missing" }, { status: 404 });

  const buf = await fs.promises.readFile(filePath); // Node Buffer

  // ✅ Create a brand-new ArrayBuffer (not SharedArrayBuffer)
  const ab = new ArrayBuffer(buf.byteLength);
  new Uint8Array(ab).set(buf);

  const mime =
    row.mimeType ||
    (mimeLookup(row.storedName) as string) ||
    "application/octet-stream";

  const viewable =
    mode === "view" &&
    ["application/pdf", "image/png", "image/jpeg", "image/gif", "image/webp"].includes(
      String(mime)
    );

  const body = new Blob([ab], {
    type: viewable ? String(mime) : "application/octet-stream",
  });

  const headers: Record<string, string> = {
    "Content-Length": String(stat.size),
    "Content-Type": body.type,
  };
  if (!viewable) {
    headers["Content-Disposition"] = `attachment; filename="${row.fileName.replace(/"/g, "")}"`;
  }

  return new NextResponse(body, { headers });
}