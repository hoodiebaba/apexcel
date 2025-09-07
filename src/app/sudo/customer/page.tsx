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

interface Customer {
  id: string;
  panCardNumber: string;
  name: string;
  username: string;
  phone: string;
  email: string;
  kycBy: string;
  kycStatus: "Approved" | "Pending" | "Cancelled";
}

export default function CustomerPage() {
  const [customers] = useState<Customer[]>([
    {
      id: "1",
      panCardNumber: "ABCDE1234F",
      name: "Ravi Sharma",
      username: "ravi123",
      phone: "9876543210",
      email: "ravi@example.com",
      kycBy: "Admin",
      kycStatus: "Approved",
    },
    {
      id: "2",
      panCardNumber: "PQRS5678L",
      name: "Neha Gupta",
      username: "neha_g",
      phone: "9876501234",
      email: "neha@example.com",
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
                          e.target.checked ? customers.map((c) => c.id) : []
                        )
                      }
                      checked={
                        selectedIds.length > 0 &&
                        selectedIds.length === customers.length
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
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="px-5 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(customer.id)}
                        onChange={() => toggleSelect(customer.id)}
                      />
                    </TableCell>
                    <TableCell className="px-5 py-3 text-gray-900 dark:text-gray-300">
                      {customer.panCardNumber}
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      <p className="font-medium text-gray-900 dark:text-gray-300">
                        {customer.name}
                      </p>
                      <span className="text-xs text-gray-600 dark:text-gray-500">
                        {customer.username}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Phone size={14} /> {customer.phone}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Mail size={14} /> {customer.email}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-3 text-gray-900 dark:text-gray-300">
                      {customer.kycBy}
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      <Badge
                        size="sm"
                        color={
                          customer.kycStatus === "Approved"
                            ? "success"
                            : customer.kycStatus === "Pending"
                            ? "warning"
                            : "destructive"
                        }
                      >
                        {customer.kycStatus}
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
