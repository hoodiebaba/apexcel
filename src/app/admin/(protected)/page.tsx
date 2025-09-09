"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { ShoppingCart, Users } from "lucide-react";
import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { useRouter } from "next/navigation";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface DashboardData {
  stats: {
    vendors: { total: number; growth: number };
    customers: { total: number; growth: number };
  };
  activeLoads: { ratio: number; subtitle: string };
  monthlyLoads: { month: string; count: number }[];
  recentUsers: {
    name: string;
    type: string;
    company: string | null;
    phone: string;
    kycStatus: string;
  }[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"forbidden" | "other" | null>(null);
  const router = useRouter();

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        const res = await fetch("/api/admin/dashboard", {
          cache: "no-store",
          credentials: "include",
          signal: ac.signal,
        });

        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }
        if (res.status === 403) {
          setError("forbidden");
          return;
        }
        if (!res.ok) {
          setError("other");
          return;
        }

        const json = (await res.json()) as DashboardData;
        setData(json);
      } catch (e) {
        if (!ac.signal.aborted) setError("other");
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [router]);

  if (loading) return <p className="text-center text-gray-400">Loading...</p>;

  if (error === "forbidden") {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <h2 className="text-xl font-semibold mb-2">No access to Dashboard</h2>
        <p className="text-sm text-gray-600">
          You Do Not Have <code className="font-mono px-1 py-0.5 rounded bg-gray-100">Dashboard:page_view</code> Permission Contact Your Administrator.
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-600">Please try again.</p>
      </div>
    );
  }

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: { fontFamily: "Outfit, sans-serif", type: "bar", height: 200, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: false, columnWidth: "39%", borderRadius: 5, borderRadiusApplication: "end" } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: data.monthlyLoads.map((m) => m.month),
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    grid: { yaxis: { lines: { show: true } } },
  };
  const series = [{ name: "Loads", data: data.monthlyLoads.map((m) => m.count) }];

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Top Section (Stats + Chart) */}
      <div className="col-span-12 grid grid-cols-12 gap-4 md:gap-6">
        {/* Left (Vendors + Customers + Monthly Loads) */}
        <div className="col-span-12 xl:col-span-7 flex flex-col gap-6">
          {/* Vendor + Customer Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
            {/* Vendors */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                <ShoppingCart className="text-gray-800 size-6 dark:text-white/90" />
              </div>
              <div className="flex items-end justify-between mt-5">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Vendors</span>
                  <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                    {data.stats.vendors.total}
                  </h4>
                </div>
                <Badge color={data.stats.vendors.growth >= 0 ? "success" : "error"}>
                  {data.stats.vendors.growth >= 0 ? "↑" : "↓"} {Math.abs(data.stats.vendors.growth)}%
                </Badge>
              </div>
            </div>

            {/* Customers */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                <Users className="text-gray-800 size-6 dark:text-white/90" />
              </div>
              <div className="flex items-end justify-between mt-5">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Customers</span>
                  <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                    {data.stats.customers.total}
                  </h4>
                </div>
                <Badge color={data.stats.customers.growth >= 0 ? "success" : "error"}>
                  {data.stats.customers.growth >= 0 ? "↑" : "↓"} {Math.abs(data.stats.customers.growth)}%
                </Badge>
              </div>
            </div>
          </div>

          {/* Monthly Loads Chart */}
          <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6 h-full">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-3">Monthly Loads</h3>
            <ReactApexChart options={options} series={series} type="bar" height={200} />
          </div>
        </div>

        {/* Right (Active Loads Ratio) */}
        <div className="col-span-12 xl:col-span-5 flex">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-default dark:border-gray-800 dark:bg-gray-900 px-5 pt-5 pb-6 sm:px-6 sm:pt-6 h-full flex flex-col justify-between w-full">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Active Loads Ratio</h3>
              <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">{data.activeLoads.subtitle}</p>
            </div>
            <div className="flex justify-center items-center mt-6">
              <ReactApexChart
                options={{
                  chart: { type: "radialBar" },
                  plotOptions: {
                    radialBar: {
                      startAngle: -90,
                      endAngle: 90,
                      hollow: { size: "70%" },
                      track: { background: "#E4E7EC", strokeWidth: "100%" },
                      dataLabels: {
                        name: { show: false },
                        value: {
                          fontSize: "28px",
                          fontWeight: "600",
                          offsetY: -5,
                          color: "#1D2939",
                          formatter: (val) => `${val}%`,
                        },
                      },
                    },
                  },
                  fill: { type: "solid", colors: ["#465FFF"] },
                  stroke: { lineCap: "round" },
                }}
                series={[data.activeLoads.ratio]}
                type="radialBar"
                height={220}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section (Recent Users) */}
      <div className="col-span-12">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] px-6 pt-5 pb-4 w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Recent Users</h3>
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="text-sm font-medium text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                  <TableCell isHeader className="py-3 text-left w-1/3">Profile</TableCell>
                  <TableCell isHeader className="py-3 text-left w-1/4">Company</TableCell>
                  <TableCell isHeader className="py-3 text-left w-1/4">Phone</TableCell>
                  <TableCell isHeader className="py-3 text-left w-1/6">KYC Status</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentUsers.map((u, i) => (
                  <TableRow key={i} className="border-b border-gray-100 dark:border-gray-800">
                    <TableCell className="py-4">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white/90">{u.name}</p>
                        <span className="text-gray-500 text-xs dark:text-gray-400">{u.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-gray-600 dark:text-gray-400">{u.company}</TableCell>
                    <TableCell className="py-4 text-gray-600 dark:text-gray-400">{u.phone}</TableCell>
                    <TableCell className="py-4">
                      <Badge
                        size="sm"
                        color={
                          u.kycStatus === "approved"
                            ? "success"
                            : u.kycStatus === "pending"
                            ? "warning"
                            : "error"
                        }
                      >
                        {u.kycStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}