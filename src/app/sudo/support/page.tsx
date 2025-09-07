/* SupportList with Wallet-style Pending (yellow) */
"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Ticket, Hourglass, CheckCircle2 } from "lucide-react";

interface TicketData {
  id: string;
  requestedBy: string;
  username: string;
  contactNumber: string;
  email: string;
  subject: string;
  date: string;
  status: "Solved" | "Pending";
}

const demoTickets: TicketData[] = [
  {
    id: "#325336",
    requestedBy: "Zain Geidt",
    username: "zain_g",
    contactNumber: "+91 99887 11122",
    email: "demoemail@gmail.com",
    subject: "Bug Found in Dark Mode Layout",
    date: "2027-03-19",
    status: "Pending",
  },
  {
    id: "#325344",
    requestedBy: "Sophia Patel",
    username: "sophia_p",
    contactNumber: "+91 88776 11223",
    email: "sophia.patel@email.com",
    subject: "Integration Not Working",
    date: "2027-05-05",
    status: "Pending",
  },
  {
    id: "#325345",
    requestedBy: "Noah Kim",
    username: "noah_k",
    contactNumber: "+91 99880 55441",
    email: "noah.kim@email.com",
    subject: "Request for API Access",
    date: "2027-05-06",
    status: "Solved",
  },
];

export default function SupportList() {
  const [tickets] = useState<TicketData[]>(demoTickets);

  return (
    <div className="p-6 space-y-6">
      {/* Top Stats with Icons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Tickets */}
        <div className="flex items-center gap-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
          <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
            <Ticket size={22} className="text-blue-500 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              5,347
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total tickets
            </p>
          </div>
        </div>

        {/* Pending Tickets (Yellow like Wallet) */}
        <div className="flex items-center gap-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
          <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-600/20">
            <Hourglass
              size={22}
              className="text-yellow-600 dark:text-yellow-400"
            />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              1,230
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Pending tickets
            </p>
          </div>
        </div>

        {/* Solved Tickets */}
        <div className="flex items-center gap-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5">
          <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
            <CheckCircle2
              size={22}
              className="text-green-600 dark:text-green-400"
            />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              4,117
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Solved tickets
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-300">
                  Ticket ID
                </TableCell>
                <TableCell className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-300">
                  Requested By
                </TableCell>
                <TableCell className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-300">
                  Contact
                </TableCell>
                <TableCell className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-300">
                  Subject
                </TableCell>
                <TableCell className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-300">
                  Created Date
                </TableCell>
                <TableCell className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-300">
                  Status
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="px-5 py-3 text-gray-800 dark:text-gray-300">
                    {ticket.id}
                  </TableCell>
                  <TableCell className="px-5 py-3 text-gray-800 dark:text-gray-300">
                    <p>{ticket.requestedBy}</p>
                    <p className="text-xs text-gray-500">@{ticket.username}</p>
                  </TableCell>
                  <TableCell className="px-5 py-3 text-gray-800 dark:text-gray-300">
                    <p>{ticket.contactNumber}</p>
                    <p className="text-xs text-gray-500">{ticket.email}</p>
                  </TableCell>
                  <TableCell className="px-5 py-3 text-gray-800 dark:text-gray-300">
                    {ticket.subject}
                  </TableCell>
                  <TableCell className="px-5 py-3 text-gray-800 dark:text-gray-300">
                    {new Date(ticket.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="px-5 py-3">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        ticket.status === "Solved"
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-600/20 dark:text-yellow-400"
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
