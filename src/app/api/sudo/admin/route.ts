import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

/** -------- Permission helpers ---------- */
const PAGES = [
  "Dashboard",
  "Loads",
  "Vendor",
  "Customer",
  "Call",
  "Support",
  "Wallet",
  "Notification",
] as const;

const ACTIONS = [
  "page_view",
  "view",
  "create",
  "edit",
  "delete",
  "download",
  "search",
] as const;

type Page = (typeof PAGES)[number];
type Action = (typeof ACTIONS)[number];

type PermMatrix = Record<Page, Record<Action, boolean>>;

/** flatten matrix → string[] like "Loads:edit" */
function flattenPerms(matrix?: PermMatrix | string[]): string[] {
  if (!matrix) return [];
  if (Array.isArray(matrix)) return matrix; // already flattened (back-compat)
  const out: string[] = [];
  for (const p of PAGES) {
    const row = matrix[p] || ({} as Record<string, boolean>);
    for (const a of ACTIONS) {
      if (row[a]) out.push(`${p}:${a}`);
    }
  }
  return out;
}

/** expand string[] → full matrix (false by default) */
function expandPerms(list?: string[]): PermMatrix {
  const m: PermMatrix = {} as any;
  for (const p of PAGES) {
    m[p] = {} as any;
    for (const a of ACTIONS) m[p][a] = false;
  }
  if (!list) return m;
  for (const item of list) {
    const [page, action] = item.split(":") as [Page, Action];
    if (PAGES.includes(page as Page) && ACTIONS.includes(action as Action)) {
      m[page as Page][action as Action] = true;
    }
  }
  return m;
}

/** strip sensitive fields before sending to client */
function serializeAdmin(a: any) {
  const { password, ...rest } = a;
  // expand permissions for UI convenience
  return { ...rest, permissions: expandPerms(a.permissions) };
}

/** allow only these roles */
function normalizeRole(role?: string) {
  const r = String(role || "admin").toLowerCase();
  return r === "sudo" ? "sudo" : "admin";
}

/** allow only these statuses */
function normalizeStatus(status?: string) {
  const s = String(status || "active").toLowerCase();
  return s === "inactive" ? "inactive" : "active";
}

/* ===========================
          GET (list)
=========================== */
export async function GET() {
  try {
    const admins = await prisma.admin.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(admins.map(serializeAdmin));
  } catch (error) {
    console.error("GET Admins Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/* ===========================
        POST (create)
=========================== */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const username = String(body.username || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "username, email and password are required" },
        { status: 400 }
      );
    }

    // enforce unique manually for nicer error msg
    const clash = await prisma.admin.findFirst({
      where: { OR: [{ username }, { email }] },
      select: { id: true },
    });
    if (clash) {
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    const newAdmin = await prisma.admin.create({
      data: {
        username,
        email,
        password: hashed,
        name: body.name || null,
        firstName: body.firstName || null,
        lastName: body.lastName || null,
        phone: body.phone || null,
        role: normalizeRole(body.role),
        bio: body.bio || null,
        socialUrls: body.socialUrls ?? null,
        address: body.address || null,
        country: body.country || null,
        city: body.city || null,
        state: body.state || null,
        pinCode: body.pinCode || null,
        taxId: body.taxId || null,
        accountHolder: body.accountHolder || null,
        bankName: body.bankName || null,
        accountType: body.accountType || null,
        ifsc: body.ifsc || null,
        bankAccountNo: body.bankAccountNo || null,
        upi: body.upi || null,
        gstNumber: body.gstNumber || null,
        status: normalizeStatus(body.status),
        permissions: flattenPerms(body.permissions),
        // photo intentionally NOT accepted here per requirement
        // (photo handled on the dedicated profile route)
      },
    });

    return NextResponse.json(serializeAdmin(newAdmin), { status: 201 });
  } catch (error: any) {
    console.error("POST Admin Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

/* ===========================
         PUT (update)
=========================== */
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const id = String(body.id || "");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const updateData: any = {
      name: body.name ?? undefined,
      firstName: body.firstName ?? undefined,
      lastName: body.lastName ?? undefined,
      username: body.username ?? undefined,
      email: body.email?.toLowerCase() ?? undefined,
      phone: body.phone ?? undefined,
      role: body.role ? normalizeRole(body.role) : undefined,
      bio: body.bio ?? undefined,
      socialUrls: body.socialUrls ?? undefined,
      address: body.address ?? undefined,
      country: body.country ?? undefined,
      city: body.city ?? undefined,
      state: body.state ?? undefined,
      pinCode: body.pinCode ?? undefined,
      taxId: body.taxId ?? undefined,
      accountHolder: body.accountHolder ?? undefined,
      bankName: body.bankName ?? undefined,
      accountType: body.accountType ?? undefined,
      ifsc: body.ifsc ?? undefined,
      bankAccountNo: body.bankAccountNo ?? undefined,
      upi: body.upi ?? undefined,
      gstNumber: body.gstNumber ?? undefined,
      status: body.status ? normalizeStatus(body.status) : undefined,
      permissions: body.permissions ? flattenPerms(body.permissions) : undefined,
    };

    const newPassword = String(body.password || "").trim();
    if (newPassword) {
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    // never allow setting photo here (kept to profile route)
    delete updateData.photo;

    const updated = await prisma.admin.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(serializeAdmin(updated));
  } catch (error) {
    console.error("PUT Admin Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/* ===========================
       DELETE (bulk)
=========================== */
export async function DELETE(req: Request) {
  try {
    const { ids } = await req.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "IDs array required" }, { status: 400 });
    }

    await prisma.admin.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Admin Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}