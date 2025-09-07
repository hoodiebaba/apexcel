"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import {
  UserPlus,
  BadgeInfo,
  SquarePen,
  Trash2,
  Phone,
  Mail,
} from "lucide-react";

interface Vendor {
  id: string;
  businessId: string; // GST / Vendor ID
  name: string;
  username: string;
  phone: string;
  email: string;
  kycBy: string;
  kycStatus: "Approved" | "Pending" | "Cancelled";
}

export default function VendorPage() {
  const [vendors] = useState<Vendor[]>([
    {
      id: "1",
      businessId: "GSTIN12345",
      name: "Global Traders",
      username: "global_traders",
      phone: "9876512345",
      email: "contact@globaltraders.com",
      kycBy: "Admin",
      kycStatus: "Approved",
    },
    {
      id: "2",
      businessId: "GSTIN67890",
      name: "FreshMart Pvt Ltd",
      username: "freshmart",
      phone: "9876598765",
      email: "info@freshmart.com",
      kycBy: "Agent",
      kycStatus: "Pending",
    },
  ]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-6">
      {/* Buttons */}
      <div className="flex items-center justify-start mb-6 gap-3">
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 
          text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 
          dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <UserPlus size={16} /> Create
        </button>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 
          text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 
          dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <SquarePen size={16} /> Edit
        </button>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 
          text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 
          dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <BadgeInfo size={16} /> View
        </button>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 
          text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 
          dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <Trash2 size={16} /> Delete
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1000px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell className="px-5 py-3 w-12 text-gray-700 dark:text-gray-400">
                    <input
                      type="checkbox"
                      onChange={(e) =>
                        setSelectedIds(
                          e.target.checked ? vendors.map((v) => v.id) : []
                        )
                      }
                      checked={
                        selectedIds.length > 0 &&
                        selectedIds.length === vendors.length
                      }
                    />
                  </TableCell>
                  <TableCell className="px-5 py-3 text-gray-700 dark:text-gray-400">
                    ID
                  </TableCell>
                  <TableCell className="px-5 py-3 text-gray-700 dark:text-gray-400">
                    Name / Username
                  </TableCell>
                  <TableCell className="px-5 py-3 text-gray-700 dark:text-gray-400">
                    Contact / Mail
                  </TableCell>
                  <TableCell className="px-5 py-3 text-gray-700 dark:text-gray-400">
                    KYC By
                  </TableCell>
                  <TableCell className="px-5 py-3 text-gray-700 dark:text-gray-400">
                    KYC Status
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="px-5 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(vendor.id)}
                        onChange={() => toggleSelect(vendor.id)}
                      />
                    </TableCell>
                    <TableCell className="px-5 py-3 text-gray-900 dark:text-gray-300">
                      {vendor.businessId}
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      <p className="font-medium text-gray-900 dark:text-gray-300">
                        {vendor.name}
                      </p>
                      <span className="text-xs text-gray-600 dark:text-gray-500">
                        {vendor.username}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Phone size={14} /> {vendor.phone}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Mail size={14} /> {vendor.email}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-3 text-gray-900 dark:text-gray-300">
                      {vendor.kycBy}
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      <Badge
                        size="sm"
                        color={
                          vendor.kycStatus === "Approved"
                            ? "success"
                            : vendor.kycStatus === "Pending"
                            ? "warning"
                            : "destructive"
                        }
                      >
                        {vendor.kycStatus}
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
