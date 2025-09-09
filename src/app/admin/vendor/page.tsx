"use client";

import React, { useEffect, useState } from "react";
import {
  UserPlus, BadgeInfo, SquarePen, Trash2, Phone, Mail, X,
  ChevronLeft, ChevronRight, Download
} from "lucide-react";

type KycStatus = "pending" | "approved" | "rejected";
type Mode = "create" | "edit" | "view";

type Me = {
  id: string; role: string; name: string; username: string;
  phone: string; email: string; status: string; permissions: string[];
};

type Vendor = {
  id: string;
  firstName?: string | null; lastName?: string | null;
  vendorName: string; username: string;
  phone: string; email: string;
  kycBy?: string | null; kycStatus: KycStatus;
  panNumber: string;
  companyName?: string | null; address?: string | null;
  createdAt?: string; updatedAt?: string;
  registeredBy?: string | null; active?: boolean;
  panImage?: string | null; gstImage?: string | null;
  aadharCard?: string | null; cancelCheque?: string | null;
};

type Form = {
  id?: string;
  // step 1
  firstName?: string; lastName?: string; username?: string; email?: string; phone?: string; password?: string;
  // step 2
  address?: string; city?: string; state?: string; pinCode?: string;
  // step 3
  vendorName?: string; vendorType?: string; companyName?: string;
  // step 4
  accountType?: string; bankAccountNo?: string; bankName?: string; ifsc?: string; accountHolder?: string; upi?: string; paymentTerms?: string;
  // step 5
  gstNumber?: string; panNumber?: string;
  panImage?: File | null | string; gstImage?: File | null | string;
  aadharCard?: File | null | string; cancelCheque?: File | null | string;
  // step 6
  message?: string; registeredBy?: string; kycBy?: string; kycStatus?: KycStatus;
};

/* UI bits */
const Input = (p: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...p} className={"w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm " + (p.className || "")} />
);
const Select = (p: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...p} className={"w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm " + (p.className || "")} />
);
const Textarea = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...p} className={"w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm " + (p.className || "")} />
);

function FilePicker({ label, value, accept, disabled, onChange }: {
  label: string; value?: File | null | string; accept?: string; disabled?: boolean; onChange: (f: File | null) => void;
}) {
  const [name, setName] = useState("");
  useEffect(() => { setName(!value ? "" : typeof value === "string" ? value.split("/").pop() || value : value.name); }, [value]);
  return (
    <div className="grid gap-1.5">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <label className={`px-3 py-2 rounded-lg border text-sm cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
          Choose file
          <input type="file" className="hidden" accept={accept} disabled={disabled}
                 onChange={e => onChange(e.target.files?.[0] || null)} />
        </label>
        <span className="text-xs text-gray-600 dark:text-gray-400 break-all">{name || "No file selected"}</span>
      </div>
    </div>
  );
}
function KycBadge({ status }: { status: KycStatus }) {
  const map: Record<KycStatus, string> = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  };
  return <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${map[status]}`}>{status}</span>;
}
const kycByLabel = (s?: string | null) => s ? (s.includes(":") ? s.replace(":", " ") : s) : "-";
const roleName = (me?: Me | null) => `${(me?.role === "customer" ? "self" : me?.role) || "admin"}:${me?.name || me?.username || ""}`;

/* ---------------- Modal ---------------- */
function VendorModal({ open, mode, selectedId, onClose, onSaved }: {
  open: boolean; mode: Mode; selectedId?: string; onClose: () => void; onSaved: () => void;
}) {
  const [me, setMe] = useState<Me | null>(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>({});
  const isCreate = mode === "create"; const canEdit = mode !== "view";

  useEffect(() => { if (open) setStep(1); }, [open]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const mres = await fetch(`/api/admin/me`, { credentials: "include", cache: "no-store" });
      if (!mres.ok) return;
      const m = await mres.json(); setMe(m);

      if (isCreate) {
        setForm({ registeredBy: roleName(m), kycStatus: "pending" });
      } else if (selectedId) {
        const r = await fetch(`/api/admin/vendor?id=${selectedId}`, { credentials: "include" });
        if (!r.ok) return;
        const v: Vendor & any = await r.json();
        setForm({
          id: v.id,
          firstName: v.firstName || "", lastName: v.lastName || "",
          username: v.username, email: v.email, phone: v.phone, password: "",
          address: v.address || "", city: v.city || "", state: v.state || "", pinCode: v.pinCode || "",
          vendorName: v.vendorName, vendorType: v.vendorType, companyName: v.companyName || "",
          accountType: v.accountType || "", bankAccountNo: v.bankAccountNo || "", bankName: v.bankName || "",
          ifsc: v.ifsc || "", accountHolder: v.accountHolder || "", upi: v.upi || "", paymentTerms: v.paymentTerms || "",
          gstNumber: v.gstNumber || "", panNumber: v.panNumber || "",
          message: v.message || "", registeredBy: v.registeredBy || roleName(m),
          kycBy: v.kycBy || "", kycStatus: (v.kycStatus || "pending") as KycStatus,
          panImage: v.panImage || null, gstImage: v.gstImage || null,
          aadharCard: v.aadharCard || null, cancelCheque: v.cancelCheque || null,
        });
      }
    })();
  }, [open, isCreate, selectedId]);

  function set<K extends keyof Form>(k: K, v: Form[K]) { setForm(p => ({ ...p, [k]: v })); }

  async function save() {
    const fd = new FormData();
    if (!isCreate && form.id) fd.append("id", form.id);
    Object.entries(form).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (v instanceof File) return;
      fd.append(k, String(v));
    });
    if (form.panImage instanceof File) fd.append("panImage", form.panImage);
    if (form.gstImage instanceof File) fd.append("gstImage", form.gstImage);
    if (form.aadharCard instanceof File) fd.append("aadharCard", form.aadharCard);
    if (form.cancelCheque instanceof File) fd.append("cancelCheque", form.cancelCheque);

    const r = await fetch("/api/admin/vendor", {
      method: isCreate ? "POST" : "PUT",
      body: fd, credentials: "include"
    });
    if (!r.ok) { const e = await r.json().catch(() => ({})); alert(e.error || "Save failed"); return; }
    onSaved(); onClose();
  }

  function openDoc(type: "pan" | "gst" | "aadhar" | "cheque") {
    if (!form.id) return;
    window.open(`/api/admin/vendor/file?id=${form.id}&type=${type}`, "_blank", "noopener,noreferrer");
  }

  if (!open) return null;
  const lockIdentity = !isCreate || !canEdit;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-5xl relative">
        <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white" onClick={onClose}><X size={20} /></button>

        <div className="p-5 border-b dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{isCreate ? "Create Vendor" : mode === "edit" ? "Edit Vendor" : "View Vendor"}</h3>
          <div className="flex items-center gap-2 text-xs">
            <button className="px-2 py-1 rounded border dark:border-gray-700" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}><ChevronLeft size={14} /></button>
            <span>Step {step} / 6</span>
            <button className="px-2 py-1 rounded border dark:border-gray-700" onClick={() => setStep(s => Math.min(6, s + 1))} disabled={step === 6}><ChevronRight size={14} /></button>
          </div>
        </div>

        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Step 1 */}
          {step === 1 && (
            <div className="grid md:grid-cols-3 gap-3 min-w-[900px]">
              <Input placeholder="First Name*" value={form.firstName || ""} onChange={e => set("firstName", e.target.value)} disabled={!canEdit} />
              <Input placeholder="Last Name*" value={form.lastName || ""} onChange={e => set("lastName", e.target.value)} disabled={!canEdit} />
              <Input placeholder="Username*" value={form.username || ""} onChange={e => set("username", e.target.value)} disabled={lockIdentity} />
              <Input placeholder="Email*" value={form.email || ""} onChange={e => set("email", e.target.value)} disabled={lockIdentity} />
              <Input placeholder="Phone*" value={form.phone || ""} onChange={e => set("phone", e.target.value)} disabled={!canEdit} />
              <Input placeholder="Password*" type="password" value={form.password || ""} onChange={e => set("password", e.target.value)} disabled={!canEdit} />
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="grid md:grid-cols-4 gap-3 min-w-[900px]">
              <Input placeholder="Address" value={form.address || ""} onChange={e => set("address", e.target.value)} disabled={!canEdit} />
              <Input placeholder="City" value={form.city || ""} onChange={e => set("city", e.target.value)} disabled={!canEdit} />
              <Input placeholder="State" value={form.state || ""} onChange={e => set("state", e.target.value)} disabled={!canEdit} />
              <Input placeholder="PIN Code" value={form.pinCode || ""} onChange={e => set("pinCode", e.target.value)} disabled={!canEdit} />
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="grid md:grid-cols-3 gap-3 min-w-[900px]">
              <Input placeholder="Vendor Name*" value={form.vendorName || ""} onChange={e => set("vendorName", e.target.value)} disabled={!canEdit} />
              <Select value={form.vendorType || ""} onChange={e => set("vendorType", e.target.value)} disabled={!canEdit}>
                <option value="">Vendor Type</option>
                <option value="transporter">transporter</option>
                <option value="driver">driver</option>
                <option value="contractor">contractor</option>
                <option value="supplier">supplier</option>
              </Select>
              <Input placeholder="Company Name" value={form.companyName || ""} onChange={e => set("companyName", e.target.value)} disabled={!canEdit} />
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div className="grid md:grid-cols-3 gap-3 min-w-[900px]">
              <Select value={form.accountType || ""} onChange={e => set("accountType", e.target.value)} disabled={!canEdit}>
                <option value="">Account Type</option>
                <option value="Savings">Savings</option>
                <option value="Current">Current</option>
                <option value="Other">Other</option>
              </Select>
              <Input placeholder="Bank A/C No" value={form.bankAccountNo || ""} onChange={e => set("bankAccountNo", e.target.value)} disabled={!canEdit} />
              <Input placeholder="Bank Name" value={form.bankName || ""} onChange={e => set("bankName", e.target.value)} disabled={!canEdit} />
              <Input placeholder="IFSC" value={form.ifsc || ""} onChange={e => set("ifsc", e.target.value)} disabled={!canEdit} />
              <Input placeholder="Account Holder" value={form.accountHolder || ""} onChange={e => set("accountHolder", e.target.value)} disabled={!canEdit} />
              <Input placeholder="UPI" value={form.upi || ""} onChange={e => set("upi", e.target.value)} disabled={!canEdit} />
              <Input placeholder="Payment Terms" value={form.paymentTerms || ""} onChange={e => set("paymentTerms", e.target.value)} disabled={!canEdit} />
            </div>
          )}

          {/* Step 5 */}
          {step === 5 && (
            <div className="grid md:grid-cols-2 gap-4 min-w-[900px]">
              <div className="rounded-xl border dark:border-gray-700 p-4 space-y-3">
                <div className="text-sm font-medium opacity-80">Tax Details</div>
                <div className="grid md:grid-cols-2 gap-3">
                  <Input placeholder="GST Number" value={form.gstNumber || ""} onChange={e => set("gstNumber", e.target.value)} disabled={!canEdit} />
                  <Input placeholder="PAN Number*" value={form.panNumber || ""} onChange={e => set("panNumber", e.target.value)} disabled={lockIdentity} />
                </div>
                <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
                <div className="text-sm font-medium opacity-80">Uploads</div>
                <div className="grid gap-3">
                  <FilePicker label="PAN Image" accept="image/*,application/pdf" value={form.panImage || null} disabled={!canEdit} onChange={(f) => set("panImage", f)} />
                  <FilePicker label="GST Image" accept="image/*,application/pdf" value={form.gstImage || null} disabled={!canEdit} onChange={(f) => set("gstImage", f)} />
                </div>
              </div>

              <div className="rounded-xl border dark:border-gray-700 p-4 space-y-3">
                <div className="text-sm font-medium opacity-80">Identity & Notes</div>
                <div className="grid gap-3">
                  <FilePicker label="Aadhar Card" accept="image/*,application/pdf" value={form.aadharCard || null} disabled={!canEdit} onChange={(f) => set("aadharCard", f)} />
                  <FilePicker label="Cancel Cheque" accept="image/*,application/pdf" value={form.cancelCheque || null} disabled={!canEdit} onChange={(f) => set("cancelCheque", f)} />
                  <Textarea placeholder="Message / Notes" value={form.message || ""} onChange={(e) => set("message", e.target.value)} disabled={!canEdit} />
                  <div className="grid md:grid-cols-2 gap-3">
                    <Select value={form.kycStatus || "pending"} onChange={(e) => set("kycStatus", e.target.value as KycStatus)} disabled={!canEdit}>
                      <option value="pending">pending</option>
                      <option value="approved">approved</option>
                      <option value="rejected">rejected</option>
                    </Select>
                    <Input placeholder="Registered By (role:name)" value={form.registeredBy || ""} onChange={(e) => set("registeredBy", e.target.value)} disabled={!canEdit} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6 */}
          {step === 6 && (
            <div className="grid gap-4 min-w-[900px]">
              <div className="rounded-xl border dark:border-gray-700 p-4 grid md:grid-cols-3 gap-3 text-sm">
                <div><div className="opacity-70">KYC By</div><div className="font-medium">{kycByLabel(form.kycBy)}</div></div>
                <div><div className="opacity-70">KYC Status</div><div className="font-medium capitalize">{form.kycStatus || "pending"}</div></div>
                <div><div className="opacity-70">Registered By</div><div className="font-medium">{form.registeredBy || "-"}</div></div>
              </div>

              {mode === "view" && form.id && (
                <div className="rounded-xl border dark:border-gray-700 p-4">
                  <div className="mb-3 text-sm font-medium">Vendor Documents</div>
                  <div className="flex flex-wrap gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm dark:border-gray-700" onClick={() => openDoc("pan")}><Download size={14} /> PAN</button>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm dark:border-gray-700" onClick={() => openDoc("gst")}><Download size={14} /> GST</button>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm dark:border-gray-700" onClick={() => openDoc("aadhar")}><Download size={14} /> Aadhar</button>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm dark:border-gray-700" onClick={() => openDoc("cheque")}><Download size={14} /> Cancel Cheque</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t dark:border-gray-700 flex items-center justify-between">
          <button className="px-4 py-2 rounded-lg text-sm border dark:border-gray-700" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}>Back</button>
          <div className="flex items-center gap-2">
            {mode !== "view" && step === 6 && <button className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700" onClick={save}>Save</button>}
            {step < 6 && <button className="px-4 py-2 rounded-lg text-sm border dark:border-gray-700" onClick={() => setStep(s => Math.min(6, s + 1))}>Next</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function AdminVendorPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [rows, setRows] = useState<Vendor[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("view");

  const can = (perm: string) => me?.role === "sudo" || me?.permissions?.includes(perm);

  async function refresh() {
    const url = new URL(location.origin + "/api/admin/vendor");
    url.searchParams.set("page", "1");
    url.searchParams.set("pageSize", "1000");
    const r = await fetch(url.toString(), { credentials: "include" });
    if (!r.ok) return;
    const data = await r.json(); setRows(data.rows || []);
  }

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/admin/me", { credentials: "include", cache: "no-store" });
      if (meRes.status === 401) { location.href = "/admin/login"; return; }
      const m = await meRes.json();
      if (m?.status && m.status !== "active") { location.href = "/admin/login"; return; }
      setMe(m);

      // gate: Vendors:page_view
      const ok = m?.role === "sudo" || (m?.permissions || []).includes("Vendors:page_view");
      if (!ok) { location.href = "/admin"; return; }

      refresh();
    })();
  }, []);

  const allSelected = selectedIds.length > 0 && selectedIds.length === rows.length;
  const toggle = (id: string) => setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleAll = (v: boolean) => setSelectedIds(v ? rows.map(r => r.id) : []);

  const openCreate = () => { setMode("create"); setOpen(true); };
  const openEdit = () => { if (selectedIds.length === 1) { setMode("edit"); setOpen(true); } };
  const openView = () => { if (selectedIds.length === 1) { setMode("view"); setOpen(true); } };

  async function doDelete() {
    if (selectedIds.length === 0) return;
    const r = await fetch("/api/admin/vendor", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ids: selectedIds }),
    });
    if (!r.ok) return;
    setSelectedIds([]); refresh();
  }

  return (
    <div className="p-6">
      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button onClick={openCreate} disabled={!can("Vendors:create")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm ${can("Vendors:create")
                  ? "border-gray-300 text-gray-700 bg-white hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  : "opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-700"}`}>
          <UserPlus size={16} /> Create
        </button>

        <button onClick={openEdit} disabled={!can("Vendors:edit") || selectedIds.length !== 1}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm ${can("Vendors:edit") && selectedIds.length === 1
                  ? "border-gray-300 text-gray-700 bg-white hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  : "opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-700"}`}>
          <SquarePen size={16} /> Edit
        </button>

        <button onClick={openView} disabled={!can("Vendors:view") || selectedIds.length !== 1}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm ${can("Vendors:view") && selectedIds.length === 1
                  ? "border-gray-300 text-gray-700 bg-white hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  : "opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-700"}`}>
          <BadgeInfo size={16} /> View
        </button>

        <button onClick={doDelete} disabled={!can("Vendors:delete") || selectedIds.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm ${can("Vendors:delete") && selectedIds.length > 0
                  ? "border-gray-300 text-gray-700 bg-white hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  : "opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-700"}`}>
          <Trash2 size={16} /> Delete
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="min-w-[1000px]">
          <table className="w-full text-sm table-auto">
            <thead className="text-left bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-5 py-3 w-12">
                  <input type="checkbox" checked={allSelected} onChange={(e) => toggleAll(e.target.checked)} />
                </th>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Name / Username</th>
                <th className="px-5 py-3">Contact / Mail</th>
                <th className="px-5 py-3">KYC By</th>
                <th className="px-5 py-3">KYC Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(v => (
                <tr key={v.id} className="border-top dark:border-gray-700 border-t">
                  <td className="px-5 py-3">
                    <input type="checkbox" checked={selectedIds.includes(v.id)} onChange={() => toggle(v.id)} />
                  </td>
                  <td className="px-5 py-3 text-gray-900 dark:text-gray-300">{v.panNumber || v.id}</td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900 dark:text-gray-300">{v.vendorName}</p>
                    <span className="text-xs text-gray-600 dark:text-gray-500">{v.username}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><Phone size={14} /> {v.phone}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"><Mail size={14} /> {v.email}</div>
                  </td>
                  <td className="px-5 py-3 text-gray-900 dark:text-gray-300">{kycByLabel(v.kycBy)}</td>
                  <td className="px-5 py-3"><KycBadge status={(v.kycStatus || "pending") as KycStatus} /></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td className="px-5 py-6 text-center text-gray-500 dark:text-gray-400" colSpan={6}>No records</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <VendorModal open={open} mode={mode} selectedId={selectedIds[0]} onClose={() => setOpen(false)} onSaved={refresh} />
    </div>
  );
}