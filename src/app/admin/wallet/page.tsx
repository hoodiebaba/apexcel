// /src/app/admin/wallet/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { UserPlus, BadgeInfo, SquarePen, Trash2, Download, X } from "lucide-react";
import { useRouter } from "next/navigation";

const API_BASE = "/api/admin/wallet"; // admin API

type Role = "sudo" | "admin" | "vendor" | "customer";
type Me = {
  id: string;
  role: Role;
  name?: string | null;
  username: string;
  permissions: string[];
  status?: string | null;
};
type MemberLite = { id: string; role: Role; username: string; name?: string | null; status?: string | null; };
type WalletRow = {
  id: string; requestById: string; requestByType: Role; requestToId: string; requestToType: Role;
  senderUsername: string; receiverUsername: string; utrNumber: string; amount: number;
  status: "pending" | "success" | "failed"; remarks?: string | null; paymentProof?: string | null; createdAt: string;
};

/* ---------- tiny UI helpers ---------- */
const baseField =
  "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm";
const Input = (p: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...p} className={`${baseField} ${p.className || ""}`} />
);
const Select = (p: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...p} className={`${baseField} ${p.className || ""}`} />
);
const Textarea = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...p} className={`${baseField} ${p.className || ""}`} />
);

/* ---------- helpers ---------- */
const hasCI = (list: string[] | undefined, perm: string) =>
  (list || []).some((p) => p?.toLowerCase?.() === perm.toLowerCase());

/* ---------- Create Modal ---------- */
function CreateModal({
  open, me, onClose, onCreated,
}: { open: boolean; me: Me | null; onClose: () => void; onCreated: () => void; }) {
  const [rolePick, setRolePick] = useState<Role>("admin");
  const [members, setMembers] = useState<MemberLite[]>([]);
  const [receiverId, setReceiverId] = useState<string>("");
  const [utr, setUtr] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const roleOptions: Role[] =
    me?.role === "sudo" || me?.role === "admin"
      ? ["sudo", "admin", "vendor", "customer"]
      : ["sudo", "admin"];

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}?op=members&role=${rolePick}`, { credentials: "include", cache: "no-store" });
        const list: MemberLite[] = await r.json();
        const filtered = list.filter((m) => m.id !== me?.id && m.status !== "inactive");
        setMembers(filtered);
        setReceiverId((prev) => (filtered.find(m => m.id === prev)?.id ?? filtered[0]?.id ?? ""));
      } catch {
        setMembers([]);
        setReceiverId("");
      }
    })();
  }, [open, rolePick, me?.id]);

  useEffect(() => {
    if (!open) {
      setRolePick("admin"); setMembers([]); setReceiverId(""); setUtr(""); setAmount(""); setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [open]);

  async function doCreate() {
    if (!receiverId) return alert("Please select a receiver.");
    if (!utr.trim()) return alert("Please enter UTR.");
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return alert("Enter valid amount.");
    if (file && file.size > 10 * 1024 * 1024) return alert("Proof must be ≤ 10 MB.");

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("receiverId", receiverId);
      fd.append("receiverType", rolePick);
      fd.append("utrNumber", utr.trim());
      fd.append("amount", String(amt));
      if (file) fd.append("proof", file);

      const r = await fetch(API_BASE, { method: "POST", body: fd, credentials: "include", cache: "no-store" });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Create failed");

      onCreated(); onClose();
    } catch (e: any) {
      alert(e?.message || "Create failed");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div role="dialog" aria-modal="true" className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-xl relative outline-none">
        <button aria-label="Close" className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white" onClick={onClose} disabled={busy}>
          <X size={18} />
        </button>

        <div className="p-5 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold">Create Wallet Entry</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">UTR + Amount + optional proof (≤ 10 MB)</p>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid gap-2">
            <div className="text-sm">Send to Role</div>
            <Select value={rolePick} onChange={(e) => setRolePick(e.target.value as Role)} disabled={busy}>
              {roleOptions.map((r) => <option key={r} value={r}>{r.toUpperCase()}</option>)}
            </Select>
          </div>

          <div>
            <div className="text-sm mb-1">Member</div>
            <Select value={receiverId} onChange={(e) => setReceiverId(e.target.value)} disabled={busy}>
              {members.length === 0 && <option value="">No members</option>}
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.role.toUpperCase()} — {m.name || m.username} (@{m.username})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-2">
            <div className="text-sm">UTR</div>
            <Input placeholder="UTR123..." value={utr} onChange={(e) => setUtr(e.target.value)} disabled={busy} />
          </div>

          <div className="grid gap-2">
            <div className="text-sm">Amount (INR)</div>
            <Input type="number" step="0.01" min="0" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={busy} />
          </div>

          <div className="grid gap-2">
            <div className="text-sm">Payment Proof (optional, ≤ 10 MB)</div>
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm cursor-pointer w-max">
              Choose file
              <input ref={fileRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} disabled={busy} />
            </label>
            <div className="text-xs text-gray-600 dark:text-gray-400 break-all">
              {file ? `${file.name} — ${(file.size / (1024 * 1024)).toFixed(2)} MB` : "No file selected"}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2">
          <button className="px-4 py-2 rounded-lg text-sm border border-gray-300 dark:border-gray-700" onClick={onClose} disabled={busy}>Cancel</button>
          <button className={`px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 ${busy ? "opacity-70" : ""}`} onClick={doCreate} disabled={busy || !receiverId || !utr || !amount}>
            {busy ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- View Modal ---------- */
function ViewModal({ open, row, onClose }: { open: boolean; row: WalletRow | null; onClose: () => void; }) {
  if (!open || !row) return null;
  const humanStatus = row.status === "pending" ? "Pending" : row.status === "success" ? "Success" : "Failed";
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div role="dialog" aria-modal="true" className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg relative">
        <button aria-label="Close" className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white" onClick={onClose}>
          <X size={18} />
        </button>
        <div className="p-5 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold">Wallet Entry</h3>
        </div>
        <div className="p-5 space-y-2 text-sm">
          <div><b>ID:</b> {row.id}</div>
          <div><b>Sender:</b> @{row.senderUsername} ({row.requestByType.toUpperCase()})</div>
          <div><b>Receiver:</b> @{row.receiverUsername} ({row.requestToType.toUpperCase()})</div>
          <div><b>UTR:</b> {row.utrNumber}</div>
          <div><b>Amount:</b> ₹{row.amount.toLocaleString()}</div>
          <div><b>Status:</b> {humanStatus}</div>
          <div className="whitespace-pre-wrap"><b>Remarks:</b> {row.remarks || "-"}</div>
          {row.paymentProof && (
            <div className="pt-2">
              <a href={`${API_BASE}?op=file&id=${row.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Download size={16} /> Download Proof
              </a>{" "}
              <a href={`${API_BASE}?op=file&id=${row.id}&mode=view`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400">
                Preview
              </a>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 text-right">
          <button className="px-4 py-2 rounded-lg text-sm border border-gray-300 dark:border-gray-700" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Edit Modal ---------- */
function EditModal({ open, row, onClose, onUpdated }: { open: boolean; row: WalletRow | null; onClose: () => void; onUpdated: () => void; }) {
  const [status, setStatus] = useState<"pending" | "success" | "failed">("pending");
  const [appendRemark, setAppendRemark] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && row) { setStatus(row.status); setAppendRemark(""); }
  }, [open, row]);

  async function doSave() {
    if (!row) return;
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}?op=edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ id: row.id, status, appendRemark }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Update failed");
      onUpdated(); onClose();
    } catch (e: any) {
      alert(e?.message || "Update failed");
    } finally {
      setBusy(false);
    }
  }

  if (!open || !row) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div role="dialog" aria-modal="true" className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md relative">
        <button aria-label="Close" className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white" onClick={onClose} disabled={busy}>
          <X size={18} />
        </button>
        <div className="p-5 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold">Edit Wallet Entry</h3>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <div className="text-sm mb-1">Status</div>
            <Select value={status} onChange={(e) => setStatus(e.target.value as any)} disabled={busy}>
              <option value="pending">Pending</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </Select>
          </div>
          <div>
            <div className="text-sm mb-1">Append Remark</div>
            <Textarea rows={4} placeholder="role:username:remark" value={appendRemark} onChange={(e) => setAppendRemark(e.target.value)} disabled={busy} />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">History format: <code>role:username:remark</code>.</div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 text-right">
          <button className="px-4 py-2 rounded-lg text-sm border border-gray-300 dark:border-gray-700 mr-2" onClick={onClose} disabled={busy}>Cancel</button>
          <button className={`px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 ${busy ? "opacity-70" : ""}`} onClick={doSave} disabled={busy}>Save</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Main Page (ADMIN) ---------- */
export default function WalletPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [rows, setRows] = useState<WalletRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const modalOpen = createOpen || viewOpen || editOpen;

  // lock background scroll & prevent hover highlight when modal open
  useEffect(() => {
    if (modalOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [modalOpen]);

  const can = (perm: string) => {
    if (!me) return false;
    if (me.role === "sudo") return true;
    return hasCI(me.permissions, perm);
  };

  async function refresh() {
    const r = await fetch(API_BASE, { credentials: "include", cache: "no-store" });
    if (!r.ok) return;
    const list: WalletRow[] = await r.json();
    setRows(list);
    setSelectedIds([]);
  }

  useEffect(() => {
    (async () => {
      try {
        const mres = await fetch("/api/admin/me", { credentials: "include", cache: "no-store" });
        if (mres.status === 401) { router.replace("/admin/login"); return; }
        const payload = await mres.json();
        const m: Me = payload?.user || payload;
        if (!m || m.role !== "admin" || m.status !== "active") { router.replace("/admin"); return; }
        setMe(m);
        if (!hasCI(m.permissions, "wallet:page_view")) { router.replace("/admin"); return; }
        await refresh();
      } finally { setLoading(false); }
    })();
  }, [router]);

  const allSelected = selectedIds.length > 0 && selectedIds.length === rows.length;
  const toggleSelect = (id: string) => setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleAll = (checked: boolean) => setSelectedIds(checked ? rows.map((r) => r.id) : []);
  const oneSelected = useMemo(() => (selectedIds.length === 1 ? rows.find((r) => r.id === selectedIds[0]) || null : null), [selectedIds, rows]);

  function openCreate() { if (can("wallet:create")) setCreateOpen(true); }
  function openView() { if (!can("wallet:view")) return; if (!oneSelected) return alert("Select exactly one row to view."); setViewOpen(true); }
  function openEdit() { if (!can("wallet:edit")) return; if (!oneSelected) return alert("Select exactly one row to edit."); setEditOpen(true); }

  async function doDelete() {
    if (!can("wallet:delete") || selectedIds.length === 0) return;
    const sure = confirm("Mark as failed and append deletion remark?");
    if (!sure) return;

    const r = await fetch(`${API_BASE}?op=delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      cache: "no-store",
      body: JSON.stringify({ ids: selectedIds }),
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      alert(e.error || "Delete failed");
      return;
    }
    refresh();
  }

  if (loading) return <div className="p-6 text-sm text-gray-600 dark:text-gray-400">Loading…</div>;

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
      {/* main content wrapper; when modal open, disable interactions to avoid highlight */}
      <div className={modalOpen ? "pointer-events-none select-none blur-[0px]" : ""} aria-hidden={modalOpen}>
        <div className="flex items-center justify-start mb-6 gap-3">
          {[
            { icon: <UserPlus size={16} />, label: "Create", onClick: openCreate, enabled: can("wallet:create") },
            { icon: <SquarePen size={16} />, label: "Edit", onClick: openEdit, enabled: can("wallet:edit") && selectedIds.length === 1 },
            { icon: <BadgeInfo size={16} />, label: "View", onClick: openView, enabled: can("wallet:view") && selectedIds.length === 1 },
            { icon: <Trash2 size={16} />, label: "Delete", onClick: doDelete, enabled: can("wallet:delete") && selectedIds.length > 0 },
          ].map((btn, idx) => (
            <button
              key={idx}
              onClick={btn.onClick}
              disabled={!btn.enabled}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition ${
                btn.enabled
                  ? "text-gray-800 bg-white border-gray-300 hover:bg-gray-100 dark:text-gray-200 dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800"
                  : "opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-700"
              }`}
            >
              {btn.icon} {btn.label}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[1100px]">
              <table className="w-full text-sm table-auto">
                <thead className="text-left bg-gray-100 dark:bg-gray-800/60">
                  <tr>
                    <th className="px-5 py-3 w-12">
                      <input type="checkbox" onChange={(e) => toggleAll(e.target.checked)} checked={allSelected} />
                    </th>
                    <th className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-300">ID</th>
                    <th className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-300">Sender</th>
                    <th className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-300">Receiver</th>
                    <th className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-300">Date & Time</th>
                    <th className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-300">Payment Proof (UTR)</th>
                    <th className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                    <th className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                      <td className="px-5 py-3">
                        <input type="checkbox" checked={selectedIds.includes(entry.id)} onChange={() => toggleSelect(entry.id)} />
                      </td>
                      <td className="px-5 py-3 text-gray-900 dark:text-gray-200">{entry.id.slice(-6)}</td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900 dark:text-gray-100">@{entry.senderUsername}</p>
                        <span className="text-xs text-gray-600 dark:text-gray-400">{entry.requestByType.toUpperCase()}</span>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900 dark:text-gray-100">@{entry.receiverUsername}</p>
                        <span className="text-xs text-gray-600 dark:text-gray-400">{entry.requestToType.toUpperCase()}</span>
                      </td>
                      <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                        {new Date(entry.createdAt).toLocaleDateString()}{" "}
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {new Date(entry.createdAt).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="px-5 py-3 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <span>{entry.utrNumber}</span>
                        {entry.paymentProof && (
                          <>
                            <a
                              href={`${API_BASE}?op=file&id=${entry.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <Download size={16} />
                            </a>
                            <a
                              href={`${API_BASE}?op=file&id=${entry.id}&mode=view`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs underline"
                            >
                              Preview
                            </a>
                          </>
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-900 dark:text-gray-100">₹{entry.amount.toLocaleString()}</td>
                      <td className="px-5 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          entry.status === "success" ? "bg-green-100 text-green-700 dark:bg-green-600/20 dark:text-green-400"
                          : entry.status === "pending" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-600/20 dark:text-yellow-400"
                          : "bg-red-100 text-red-700 dark:bg-red-600/20 dark:text-red-400"
                        }`}>
                          {entry.status === "success" ? "Success" : entry.status === "pending" ? "Pending" : "Failed"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td className="px-5 py-6 text-center text-gray-500 dark:text-gray-400" colSpan={8}>
                        No entries
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modals (kept outside the pointer-events-none wrapper) */}
      <CreateModal open={createOpen} me={me} onClose={() => setCreateOpen(false)} onCreated={refresh} />
      <ViewModal open={viewOpen} row={oneSelected} onClose={() => setViewOpen(false)} />
      <EditModal open={editOpen} row={oneSelected} onClose={() => setEditOpen(false)} onUpdated={refresh} />
    </div>
  );
}