// /src/app/api/admin/loads/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

/** Helpers **/
async function getMe() {
  const jar = await cookies();
  const token = jar.get("admin_token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "apex-secret") as any;
    const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });
    if (!admin || admin.status !== "active") return null;
    return {
      id: admin.id,
      role: admin.role,
      name: admin.name ?? "",
      username: admin.username,
      phone: admin.phone ?? "",
      email: admin.email,
      address: admin.address ?? "",
      permissions: admin.permissions ?? [],
      status: admin.status,
    };
  } catch {
    return null;
  }
}

function hasPerm(me: any, perm: string) {
  if (!me) return false;
  if (me.role === "sudo") return true;
  return me.permissions?.includes(perm);
}

/** ---------- GET (list or single) ---------- **/
export async function GET(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPerm(me, "Loads:page_view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  // Single — show ANY load if user has view perm
  if (id) {
    if (!hasPerm(me, "Loads:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const row = await prisma.load.findUnique({ where: { id } });
    return NextResponse.json(row ?? null);
  }

  // List — show ALL loads. (No search/filter per your ask)
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "1000", 10), 2000);
  const skip = (page - 1) * pageSize;

  const [rows, total] = await Promise.all([
    prisma.load.findMany({
      where: {},
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true, loadNumber: true, status: true, loadDate: true, loadTime: true,
        creatorName: true, creatorEmail: true, creatorAddress: true, creatorPhone: true,
        createdBy: true, customerPanNumber: true, vendorPanNumber: true, totalAmount: true,
        lorryReceiptFile: true, invoiceFile: true, locationUpdates: true, createdAt: true,
      },
    }),
    prisma.load.count(),
  ]);

  return NextResponse.json({ rows, total, page, pageSize });
}

/** ---------- POST (Create) ---------- **/
export async function POST(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPerm(me, "Loads:create")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const gen = async () => {
      const candidate = `LD${Date.now()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
      const exists = await prisma.load.findFirst({ where: { loadNumber: candidate } });
      return exists ? `LD${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}` : candidate;
    };
    const loadNumber = await gen();
    const now = new Date();

    const created = await prisma.load.create({
      data: {
        loadNumber,
        createdBy: "admin",
        creatorName: me.name ?? "",
        creatorPhone: me.phone ?? "",
        creatorEmail: me.email,
        creatorAddress: me.address ?? "",
        loadDate: now,
        loadTime: new Intl.DateTimeFormat("en-IN", {
          hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true, timeZone: "Asia/Kolkata",
        }).format(now),

        customerPanNumber: body.customerPanNumber ?? null,
        vendorPanNumber: body.vendorPanNumber ?? null,
        paymentTerms: body.paymentTerms || "",
        originCities: Array.isArray(body.originCities) ? body.originCities : [],
        destinationCities: Array.isArray(body.destinationCities) ? body.destinationCities : [],
        vehicleTypes: Array.isArray(body.vehicleTypes) ? body.vehicleTypes : [],
        materialTypes: Array.isArray(body.materialTypes) ? body.materialTypes : [],
        consignor: body.consignor || {},
        consignee: body.consignee || {},
        customerName: body.customerName ?? null,
        customerPhone: body.customerPhone ?? null,
        customerAddress: body.customerAddress ?? null,
        customerOwnerPan: body.customerOwnerPan ?? null,
        vendorName: body.vendorName ?? null,
        vendorPhone: body.vendorPhone ?? null,
        vendorAddress: body.vendorAddress ?? null,
        vendorOwnerPan: body.vendorOwnerPan ?? null,

        invoiceNumber: body.invoiceNumber ?? null,
        invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : null,
        invoiceValue: body.invoiceValue ?? null,
        invoiceDescription: body.invoiceDescription ?? null,
        invoicePackages: body.invoicePackages ?? null,
        invoiceInstructions: body.invoiceInstructions ?? null,

        lrNumber: body.lrNumber ?? null,
        lrDate: body.lrDate ? new Date(body.lrDate) : null,
        lrValue: body.lrValue ?? null,
        lrDescription: body.lrDescription ?? null,
        lrPackages: body.lrPackages ?? null,
        lrInstructions: body.lrInstructions ?? null,

        loadingDate: body.loadingDate ? new Date(body.loadingDate) : null,
        basicFreight: body.basicFreight ?? null,
        fuelCharges: body.fuelCharges ?? null,
        loadingCharges: body.loadingCharges ?? null,
        unloadingCharges: body.unloadingCharges ?? null,
        detentionLoading: body.detentionLoading ?? null,
        detentionUnloading: body.detentionUnloading ?? null,
        otherCharges: body.otherCharges ?? null,
        gstRate: body.gstRate ?? null,
        subTotal: body.subTotal ?? null,
        gstAmount: body.gstAmount ?? null,
        totalAmount: body.totalAmount ?? null,
        remarks: body.remarks ?? null,

        locationUpdates: Array.isArray(body.locationUpdates) ? body.locationUpdates : [],
        lorryReceiptFile: null,
        invoiceFile: null,
        status: (body.status as string) || "pending",
      },
    });

    return NextResponse.json(created);
  } catch (e) {
    console.error("ADMIN_LOAD_CREATE_ERROR", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}

/** ---------- PUT (Update) ---------- **/
export async function PUT(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPerm(me, "Loads:edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { id, ...rest } = body || {};
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const old = await prisma.load.findUnique({ where: { id } });
    if (!old) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const normalizeArray = (v: any) => (Array.isArray(v) ? v : []);

    const updated = await prisma.load.update({
      where: { id },
      data: {
        status: rest.status ?? old.status,
        customerPanNumber: rest.customerPanNumber ?? old.customerPanNumber,
        vendorPanNumber: rest.vendorPanNumber ?? old.vendorPanNumber,
        paymentTerms: rest.paymentTerms ?? old.paymentTerms,
        originCities: normalizeArray(rest.originCities) ?? old.originCities,
        destinationCities: normalizeArray(rest.destinationCities) ?? old.destinationCities,
        vehicleTypes: normalizeArray(rest.vehicleTypes) ?? old.vehicleTypes,
        materialTypes: normalizeArray(rest.materialTypes) ?? old.materialTypes,
        consignor: rest.consignor ?? old.consignor,
        consignee: rest.consignee ?? old.consignee,
        customerName: rest.customerName ?? old.customerName,
        customerPhone: rest.customerPhone ?? old.customerPhone,
        customerAddress: rest.customerAddress ?? old.customerAddress,
        customerOwnerPan: rest.customerOwnerPan ?? old.customerOwnerPan,
        vendorName: rest.vendorName ?? old.vendorName,
        vendorPhone: rest.vendorPhone ?? old.vendorPhone,
        vendorAddress: rest.vendorAddress ?? old.vendorAddress,
        vendorOwnerPan: rest.vendorOwnerPan ?? old.vendorOwnerPan,
        invoiceNumber: rest.invoiceNumber ?? old.invoiceNumber,
        invoiceDate: rest.invoiceDate ? new Date(rest.invoiceDate) : old.invoiceDate,
        invoiceValue: rest.invoiceValue ?? old.invoiceValue,
        invoiceDescription: rest.invoiceDescription ?? old.invoiceDescription,
        invoicePackages: rest.invoicePackages ?? old.invoicePackages,
        invoiceInstructions: rest.invoiceInstructions ?? old.invoiceInstructions,
        lrNumber: rest.lrNumber ?? old.lrNumber,
        lrDate: rest.lrDate ? new Date(rest.lrDate) : old.lrDate,
        lrValue: rest.lrValue ?? old.lrValue,
        lrDescription: rest.lrDescription ?? old.lrDescription,
        lrPackages: rest.lrPackages ?? old.lrPackages,
        lrInstructions: rest.lrInstructions ?? old.lrInstructions,
        loadingDate: rest.loadingDate ? new Date(rest.loadingDate) : old.loadingDate,
        basicFreight: rest.basicFreight ?? old.basicFreight,
        fuelCharges: rest.fuelCharges ?? old.fuelCharges,
        loadingCharges: rest.loadingCharges ?? old.loadingCharges,
        unloadingCharges: rest.unloadingCharges ?? old.unloadingCharges,
        detentionLoading: rest.detentionLoading ?? old.detentionLoading,
        detentionUnloading: rest.detentionUnloading ?? old.detentionUnloading,
        otherCharges: rest.otherCharges ?? old.otherCharges,
        gstRate: rest.gstRate ?? old.gstRate,
        subTotal: rest.subTotal ?? old.subTotal,
        gstAmount: rest.gstAmount ?? old.gstAmount,
        totalAmount: rest.totalAmount ?? old.totalAmount,
        remarks: rest.remarks ?? old.remarks,
        locationUpdates: Array.isArray(rest.locationUpdates) ? rest.locationUpdates : (old.locationUpdates as any),
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("ADMIN_LOAD_UPDATE_ERROR", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

/** ---------- DELETE (Bulk) ---------- **/
export async function DELETE(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPerm(me, "Loads:delete")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids[] required" }, { status: 400 });
    }

    await prisma.load.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("ADMIN_LOAD_DELETE_ERROR", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}