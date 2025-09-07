import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Load, Vendor, Customer } from "@prisma/client";

export async function GET() {
  try {
    const now = new Date();
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

    // Vendors
    const totalVendors = await prisma.vendor.count();
    const oldVendors = await prisma.vendor.count({
      where: { createdAt: { lt: fifteenDaysAgo } },
    });
    const vendorGrowth =
      oldVendors === 0 ? 0 : Number((((totalVendors - oldVendors) / oldVendors) * 100).toFixed(2));

    // Customers
    const totalCustomers = await prisma.customer.count();
    const oldCustomers = await prisma.customer.count({
      where: { createdAt: { lt: fifteenDaysAgo } },
    });
    const customerGrowth =
      oldCustomers === 0 ? 0 : Number((((totalCustomers - oldCustomers) / oldCustomers) * 100).toFixed(2));

    // Active Loads
    const activeLoads = await prisma.load.count({
      where: { totalAmount: { gt: 0 } },
    });
    const activeLoadRatio = Number(((activeLoads / 1000) * 100).toFixed(2));

    // Monthly Loads
    const loads: Pick<Load, "createdAt">[] = await prisma.load.findMany({
      select: { createdAt: true },
    });

    const monthlyLoads = Array.from({ length: 12 }, (_, i) => {
      const monthName = new Date(now.getFullYear(), i).toLocaleString("en-US", {
        month: "short",
      });
      const count = loads.filter((l) => new Date(l.createdAt).getMonth() === i).length;
      return { month: monthName, count };
    });

    // Recent Vendors
    const recentVendors = await prisma.vendor.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
      select: {
        vendorName: true,
        companyName: true,
        phone: true,
        kycStatus: true,
      },
    });

    // Recent Customers
    const recentCustomers = await prisma.customer.findMany({
      take: 2,
      orderBy: { createdAt: "desc" },
      select: {
        customerName: true,
        companyName: true,
        phone: true,
        kycStatus: true,
      },
    });

    const recentUsers = [
      ...recentVendors.map((v) => ({
        name: v.vendorName,
        type: "Vendor",
        company: v.companyName,
        phone: v.phone,
        kycStatus: v.kycStatus,
      })),
      ...recentCustomers.map((c) => ({
        name: c.customerName,
        type: "Customer",
        company: c.companyName,
        phone: c.phone,
        kycStatus: c.kycStatus,
      })),
    ];

    return NextResponse.json({
      stats: {
        vendors: { total: totalVendors, growth: vendorGrowth },
        customers: { total: totalCustomers, growth: customerGrowth },
      },
      activeLoads: {
        ratio: activeLoadRatio,
        subtitle: "Based on 1000 loads target per month",
      },
      monthlyLoads,
      recentUsers,
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}