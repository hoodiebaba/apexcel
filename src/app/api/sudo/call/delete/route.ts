import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { ids, by } = await req.json(); // {ids:[], by:{id, role}}
  if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: "ids[] required" }, { status: 400 });
  if (!by?.role) return NextResponse.json({ error: "by missing" }, { status: 400 });

  const rows = await prisma.callFile.findMany({ where: { id: { in: ids } } });
  for (const row of rows) {
    if (by.role === "sudo") {
      try { await fs.promises.unlink(row.senderPathSend); } catch {}
      try { await fs.promises.unlink(row.receiverPathRecv); } catch {}
      await prisma.callFile.delete({ where: { id: row.id } });
    } else {
      await prisma.callFile.update({
        where: { id: row.id },
        data: { status: "deleted", deletedBy: `${by.role}:${by.id}`, deletedAt: new Date() },
      });
    }
  }
  return NextResponse.json({ success: true });
}