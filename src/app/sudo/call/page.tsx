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
  Upload,
  Download,
  Eye,
  Trash2,
  FileDown,
} from "lucide-react";

// Data Interface
interface FileEntry {
  id: string;
  senderName: string;
  senderUsername: string;
  receiverName: string;
  receiverUsername: string;
  fileName: string;
  fileUrl: string;
  remark?: string;
  date: string;
}

// Dummy Data
const demoFiles: FileEntry[] = [
  {
    id: "F12345",
    senderName: "Rahul Verma",
    senderUsername: "rahulv",
    receiverName: "Amit Singh",
    receiverUsername: "amit123",
    fileName: "Invoice_Sept.pdf",
    fileUrl: "/demo/invoice-sept.pdf",
    remark: "Urgent delivery",
    date: "2025-09-05T12:00:00Z",
  },
  {
    id: "F67890",
    senderName: "Sneha Kapoor",
    senderUsername: "sneha_k",
    receiverName: "Vikram Rathore",
    receiverUsername: "vikram.r",
    fileName: "LR_Sept.pdf",
    fileUrl: "/demo/lr-sept.pdf",
    remark: "Check LR details",
    date: "2025-09-04T15:30:00Z",
  },
];

export default function FilePage() {
  const [files] = useState<FileEntry[]>(demoFiles);
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
          <Upload size={16} /> Upload
        </button>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 
          text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 
          dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <Download size={16} /> Download
        </button>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 
          text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 
          dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <Eye size={16} /> View
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
      <div
        className="overflow-hidden rounded-xl border border-gray-200 bg-white 
      dark:border-gray-700 dark:bg-gray-900"
      >
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
                          e.target.checked ? files.map((f) => f.id) : []
                        )
                      }
                      checked={
                        selectedIds.length > 0 &&
                        selectedIds.length === files.length
                      }
                    />
                  </TableCell>
                  <TableCell className="px-5 py-3 text-gray-700 dark:text-gray-400">
                    ID
                  </TableCell>
                  <TableCell className="px-5 py-3 text-gray-700 dark:text-gray-400">
                    Sender
                  </TableCell>
                  <TableCell className="px-5 py-3 text-gray-700 dark:text-gray-400">
                    Receiver
                  </TableCell>
                  <TableCell className="px-5 py-3 text-gray-700 dark:text-gray-400">
                    File
                  </TableCell>
                  <TableCell className="px-5 py-3 text-gray-700 dark:text-gray-400">
                    Remark / Notes
                  </TableCell>
                  <TableCell className="px-5 py-3 text-gray-700 dark:text-gray-400">
                    Date / Time
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    {/* Checkbox */}
                    <TableCell className="px-5 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(file.id)}
                        onChange={() => toggleSelect(file.id)}
                      />
                    </TableCell>

                    {/* ID */}
                    <TableCell className="px-5 py-3 text-gray-900 dark:text-gray-300">
                      {file.id}
                    </TableCell>

                    {/* Sender */}
                    <TableCell className="px-5 py-3 text-gray-900 dark:text-gray-300">
                      <p>{file.senderName}</p>
                      <p className="text-xs text-gray-500">
                        @{file.senderUsername}
                      </p>
                    </TableCell>

                    {/* Receiver */}
                    <TableCell className="px-5 py-3 text-gray-900 dark:text-gray-300">
                      <p>{file.receiverName}</p>
                      <p className="text-xs text-gray-500">
                        @{file.receiverUsername}
                      </p>
                    </TableCell>

                    {/* File Name with Download */}
                    <TableCell className="px-5 py-3">
                      <a
                        href={file.fileUrl}
                        download
                        className="px-3 py-1 text-xs rounded border border-gray-300 
                        dark:border-gray-600 text-gray-700 dark:text-gray-300 
                        hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <FileDown size={14} /> {file.fileName}
                      </a>
                    </TableCell>

                    {/* Remark */}
                    <TableCell className="px-5 py-3 text-gray-900 dark:text-gray-300 text-sm">
                      {file.remark || "-"}
                    </TableCell>

                    {/* Date / Time */}
                    <TableCell className="px-5 py-3 text-gray-900 dark:text-gray-300">
                      {new Date(file.date).toLocaleDateString()}{" "}
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {new Date(file.date).toLocaleTimeString()}
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
