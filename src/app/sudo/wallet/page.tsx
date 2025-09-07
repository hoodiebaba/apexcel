"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  UserPlus,
  BadgeInfo,
  SquarePen,
  Trash2,
  Download,
} from "lucide-react";

interface WalletEntry {
  id: string;
  senderName: string;
  senderUsername: string;
  receiverName: string;
  receiverUsername: string;
  dateTime: string;
  utr: string;
  proofUrl?: string;
  amount: number;
  status: "Success" | "Pending" | "Failed";
}

export default function WalletPage() {
  const [entries] = useState<WalletEntry[]>([
    {
      id: "1",
      senderName: "Ravi Sharma",
      senderUsername: "ravi123",
      receiverName: "Neha Gupta",
      receiverUsername: "neha_g",
      dateTime: "2025-09-06 12:30 PM",
      utr: "UTR123456789",
      proofUrl: "/proofs/payment1.pdf",
      amount: 5000,
      status: "Success",
    },
    {
      id: "2",
      senderName: "Neha Gupta",
      senderUsername: "neha_g",
      receiverName: "Ravi Sharma",
      receiverUsername: "ravi123",
      dateTime: "2025-09-06 1:15 PM",
      utr: "UTR987654321",
      proofUrl: "/proofs/payment2.pdf",
      amount: 2500,
      status: "Pending",
    },
    {
      id: "3",
      senderName: "Amit Verma",
      senderUsername: "amitv",
      receiverName: "Priya Singh",
      receiverUsername: "priya_s",
      dateTime: "2025-09-06 2:00 PM",
      utr: "UTR555555555",
      proofUrl: "/proofs/payment3.pdf",
      amount: 1500,
      status: "Failed",
    },
  ]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Status badge colors
  const getStatusClasses = (status: WalletEntry["status"]) => {
    switch (status) {
      case "Success":
        return "bg-green-100 text-green-700 dark:bg-green-600/20 dark:text-green-400";
      case "Pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-600/20 dark:text-yellow-400";
      case "Failed":
        return "bg-red-100 text-red-700 dark:bg-red-600/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-600/20 dark:text-gray-300";
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
      {/* Buttons */}
      <div className="flex items-center justify-start mb-6 gap-3">
        {[
          { icon: <UserPlus size={16} />, label: "Create" },
          { icon: <SquarePen size={16} />, label: "Edit" },
          { icon: <BadgeInfo size={16} />, label: "View" },
          { icon: <Trash2 size={16} />, label: "Delete" },
        ].map((btn, idx) => (
          <button
            key={idx}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 
            text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 
            dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {btn.icon} {btn.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white 
        dark:border-gray-700 dark:bg-gray-900">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1100px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-800/60">
                  <TableCell className="px-5 py-3 w-12">
                    <input
                      type="checkbox"
                      onChange={(e) =>
                        setSelectedIds(
                          e.target.checked ? entries.map((c) => c.id) : []
                        )
                      }
                      checked={
                        selectedIds.length > 0 &&
                        selectedIds.length === entries.length
                      }
                    />
                  </TableCell>
                  <TableCell className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-300">
                    ID
                  </TableCell>
                  <TableCell className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-300">
                    Sender
                  </TableCell>
                  <TableCell className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-300">
                    Receiver
                  </TableCell>
                  <TableCell className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-300">
                    Date & Time
                  </TableCell>
                  <TableCell className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-300">
                    Payment Proof (UTR)
                  </TableCell>
                  <TableCell className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-300">
                    Amount
                  </TableCell>
                  <TableCell className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-300">
                    Status
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody>
                {entries.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    {/* Checkbox */}
                    <TableCell className="px-5 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(entry.id)}
                        onChange={() => toggleSelect(entry.id)}
                      />
                    </TableCell>

                    {/* ID */}
                    <TableCell className="px-5 py-3 text-gray-900 dark:text-gray-200">
                      {entry.id}
                    </TableCell>

                    {/* Sender */}
                    <TableCell className="px-5 py-3">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {entry.senderName}
                      </p>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        @{entry.senderUsername}
                      </span>
                    </TableCell>

                    {/* Receiver */}
                    <TableCell className="px-5 py-3">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {entry.receiverName}
                      </p>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        @{entry.receiverUsername}
                      </span>
                    </TableCell>

                    {/* Date & Time */}
                    <TableCell className="px-5 py-3 text-gray-700 dark:text-gray-300">
                      {entry.dateTime}
                    </TableCell>

                    {/* Proof + Download */}
                    <TableCell className="px-5 py-3 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <span>{entry.utr}</span>
                      {entry.proofUrl && (
                        <a
                          href={entry.proofUrl}
                          download
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Download size={16} />
                        </a>
                      )}
                    </TableCell>

                    {/* Amount */}
                    <TableCell className="px-5 py-3 text-gray-900 dark:text-gray-100">
                      ₹{entry.amount.toLocaleString()}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="px-5 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClasses(
                          entry.status
                        )}`}
                      >
                        {entry.status}
                      </span>
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
