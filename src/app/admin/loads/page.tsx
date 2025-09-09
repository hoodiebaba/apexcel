"use client";

import React, { useEffect, useState } from "react";
import { UserPlus, BadgeInfo, SquarePen, Trash2, FileDown } from "lucide-react";
import LoadModal from "./model/page";
import { useRouter } from "next/navigation";

type Status = "pending" | "approved" | "active" | "closed";

type Me = {
  id: string;
  role: string;
  name: string;
  username: string;
  phone: string;
  email: string;
  address: string;
  permissions: string[];
  status?: string;
};

type Row = {
  id: string;
  loadNumber: string | null;
  status: Status;
  loadDate: string | null;
  loadTime: string | null;
  creatorName: string;
  creatorEmail: string;
  creatorAddress: string;
  creatorPhone: string;
  createdBy: string;
  customerPanNumber: string | null;
  vendorPanNumber: string | null;
  totalAmount: number | null;
  lorryReceiptFile?: string | null;
  invoiceFile?: string | null;
  locationUpdates?: { by: string; text: string; ts?: string }[] | null;
  createdAt: string;
};

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, string> = {
    active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    approved: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    closed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  };
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${map[status]}`}>{status}</span>;
}

function fmtIST(iso?: string | null) {
  if (!iso) return { d: "-", t: "" };
  const d = new Date(iso);
  return {
    d: d.toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata" }),
    t: d.toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata" }),
  };
}

function latestLocation(updates?: Row["locationUpdates"]) {
  if (!updates?.length) return "-";
  const last = updates[updates.length - 1];
  const [roleRaw = "", nameRaw = ""] = String(last.by || "").split(":");
  const role = roleRaw.trim();
  const name = nameRaw.trim();
  const who = role && name ? `${role} ${name}` : role ? role : name ? name : (last.by || "");
  return `${who ? `${who}: ` : ""}${last.text}`;
}

export default function LoadsPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("view");
  const [modalKey, setModalKey] = useState(0);

  const can = (perm: string) => {
    if (!me) return false;
    if (me.role === "sudo") return true;
    return me.permissions?.includes(perm);
    };

  async function refresh() {
    const url = new URL(location.origin + "/api/admin/loads");
    url.searchParams.set("page", "1");
    url.searchParams.set("pageSize", "1000");
    const r = await fetch(url.toString(), { credentials: "include", cache: "no-store" });
    if (!r.ok) { if (r.status === 401) router.replace("/admin/login"); return; }
    const data = await r.json();
    setRows(data.rows || []);
  }

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/admin/loads/fetch?type=me", { credentials: "include", cache: "no-store" });
      if (meRes.status === 401) { router.replace("/admin/login"); return; }
      const m = await meRes.json();
      if (m?.status && m.status !== "active") { router.replace("/admin/login"); return; }
      setMe(m);
      const ok = m?.role === "sudo" || (m?.permissions || []).includes("Loads:page_view");
      if (!ok) { router.replace("/admin"); return; }
      refresh();
    })();
  }, [router]);

  const toggleSelect = (id: string) =>
    setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const openCreate = () => { setModalMode("create"); setModalKey(k=>k+1); setModalOpen(true); };
  const openView   = () => { if (selectedIds.length === 1) { setModalMode("view"); setModalKey(k=>k+1); setModalOpen(true); } };
  const openEdit   = () => { if (selectedIds.length === 1) { setModalMode("edit"); setModalKey(k=>k+1); setModalOpen(true); } };

  async function doDelete() {
    if (selectedIds.length === 0) return;
    const r = await fetch("/api/admin/loads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds }),
      credentials: "include",
    });
    if (!r.ok) { if (r.status === 401) router.replace("/admin/login"); return; }
    setSelectedIds([]);
    refresh();
  }

  return (
    <div className="p-6">
      {/* Top actions only (no search/filter) */}
      <div className="flex items-center justify-start mb-6 gap-3">
        <button onClick={openCreate} disabled={!can("Loads:create")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm ${can("Loads:create") ? "border-gray-300 text-gray-700 bg-white hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700" : "opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-700"}`}>
          <UserPlus size={16}/> Create
        </button>

        <button onClick={openEdit} disabled={!can("Loads:edit") || selectedIds.length !== 1}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm ${can("Loads:edit") && selectedIds.length === 1 ? "border-gray-300 text-gray-700 bg-white hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700" : "opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-700"}`}>
          <SquarePen size={16}/> Edit
        </button>

        <button onClick={openView} disabled={!can("Loads:view") || selectedIds.length !== 1}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm ${can("Loads:view") && selectedIds.length === 1 ? "border-gray-300 text-gray-700 bg-white hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700" : "opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-700"}`}>
          <BadgeInfo size={16}/> View
        </button>

        <button onClick={doDelete} disabled={!can("Loads:delete") || selectedIds.length === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm ${can("Loads:delete") && selectedIds.length > 0 ? "border-gray-300 text-gray-700 bg-white hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700" : "opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-700"}`}>
          <Trash2 size={16}/> Delete
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="w-full text-sm table-auto">
          <thead className="text-left bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-5 py-3 w-12"></th>
              <th className="px-5 py-3">Load ID</th>
              <th className="px-5 py-3">User ID</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Date / Time</th>
              <th className="px-5 py-3">Creator</th>
              <th className="px-5 py-3">Location</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const { d, t } = fmtIST(r.loadDate || r.createdAt);
              return (
                <tr key={r.id} className="border-t dark:border-gray-700">
                  <td className="px-5 py-3">
                    <input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => toggleSelect(r.id)} />
                  </td>
                  <td className="px-5 py-3">{r.loadNumber ?? "-"}</td>
                  <td className="px-5 py-3">
                    <p>Vendor: {r.vendorPanNumber ?? "-"}</p>
                    <p>Customer: {r.customerPanNumber ?? "-"}</p>
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-5 py-3">{d} <span className="text-xs text-gray-600 dark:text-gray-400">{t}</span></td>
                  <td className="px-5 py-3">{r.creatorName}</td>
                  <td className="px-5 py-3 text-xs text-gray-700 dark:text-gray-400">{latestLocation(r.locationUpdates)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <a href={`/api/admin/loads/lr?id=${r.id}`} target="_blank"
                         className={`px-3 py-1 text-xs rounded border dark:border-gray-700 flex items-center gap-1 ${can("Loads:download") ? "hover:bg-gray-100 dark:hover:bg-gray-700" : "opacity-50 pointer-events-none"}`}>
                        <FileDown size={14}/> LR
                      </a>
                      <a href={`/api/admin/loads/invoice?id=${r.id}`} target="_blank"
                         className={`px-3 py-1 text-xs rounded border dark:border-gray-700 flex items-center gap-1 ${can("Loads:download") ? "hover:bg-gray-100 dark:hover:bg-gray-700" : "opacity-50 pointer-events-none"}`}>
                        <FileDown size={14}/> Invoice
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td className="px-5 py-6 text-center text-gray-500 dark:text-gray-400" colSpan={8}>
                  No records
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <LoadModal
          key={modalKey}
          open={modalOpen}
          mode={modalMode}
          selectedId={selectedIds[0]}
          onClose={() => setModalOpen(false)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}