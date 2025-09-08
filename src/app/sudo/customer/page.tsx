"use client";

import React, { useEffect, useState } from "react";
import { UserPlus, BadgeInfo, SquarePen, Trash2, Phone, Mail, X, ChevronLeft, ChevronRight, FileDown } from "lucide-react";

/* ------------ Types ------------ */
type KycStatus = "pending" | "approved" | "rejected";
type Mode = "create" | "edit" | "view";
type Me = {
  id: string; role: string; name: string; username: string;
  phone: string; email: string; address: string; permissions: string[];
};

type Row = {
  id: string;
  customerName: string;
  username: string;
  phone: string;
  email: string;
  kycBy?: string | null;
  kycStatus: KycStatus;
  panNumber?: string | null;
  companyName?: string | null;
  address?: string | null;
  createdAt?: string;
  updatedAt?: string;
  registeredBy?: string | null;
  active?: boolean;
  panImage?: string | null;
  gstImage?: string | null;
  aadharCard?: string | null;
  cancelCheque?: string | null;
};

type Form = {
  // step 1
  firstName?: string; lastName?: string; username?: string; email?: string; phone?: string; password?: string;
  // step 2
  address?: string; city?: string; state?: string; pinCode?: string;
  // step 3
  customerName?: string; customerType?: string; freightTerms?: string; companyName?: string;
  // step 4
  accountType?: string; bankAccountNo?: string; bankName?: string; ifsc?: string; accountHolder?: string; upi?: string; paymentTerms?: string;
  // step 5
  gstNumber?: string; panNumber?: string | null; panImage?: File | null; gstImage?: File | null; aadharCard?: File | null; cancelCheque?: File | null;
  // step 6
  message?: string; registeredBy?: string; kycBy?: string; kycStatus?: KycStatus;
  // id
  id?: string;
};

/* ------------ Small inputs ------------ */
const Input = (p: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...p} className={"w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm " + (p.className || "")}/>
);
const Select = (p: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...p} className={"w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm " + (p.className || "")}/>
);
const Textarea = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...p} className={"w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm " + (p.className || "")}/>
);

/* ------------ Badge ------------ */
function KycBadge({ status }: { status: KycStatus }) {
  const map: Record<KycStatus, string> = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  };
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${map[status]}`}>{status}</span>;
}

/* ------------ Modal ------------ */
function CustomerModal({
  open, mode, selectedId, onClose, onSaved,
}: { open: boolean; mode: Mode; selectedId?: string; onClose: () => void; onSaved: () => void; }) {
  const [me, setMe] = useState<Me | null>(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>({});

  const canEdit = mode !== "view";
  const isCreate = mode === "create";

  useEffect(() => {
    if (!open) return;
    (async () => {
      const mres = await fetch(`/api/sudo/loads/fetch?type=me`);
      const m = await mres.json();
      setMe(m);

      if (isCreate) {
        setForm({ registeredBy: "admin", kycStatus: "pending" });
      } else if (selectedId) {
        const r = await fetch(`/api/sudo/customer?id=${selectedId}`);
        const v = await r.json();
        setForm({
          id: v.id,
          firstName: "",
          lastName: "",
          username: v.username,
          email: v.email,
          phone: v.phone,
          password: "",
          address: v.address || "",
          city: v.city || "",
          state: v.state || "",
          pinCode: v.pinCode || "",
          customerName: v.customerName,
          customerType: v.customerType || "",
          freightTerms: v.freightTerms || "",
          companyName: v.companyName || "",
          accountType: v.accountType || "",
          bankAccountNo: v.bankAccountNo || "",
          bankName: v.bankName || "",
          ifsc: v.ifsc || "",
          accountHolder: v.accountHolder || "",
          upi: v.upi || "",
          paymentTerms: v.paymentTerms || "",
          gstNumber: v.gstNumber || "",
          panNumber: v.panNumber || "",
          message: v.message || "",
          registeredBy: v.registeredBy || "admin",
          kycBy: v.kycBy || "",
          kycStatus: v.kycStatus || "pending",
          // previews for step-6 use string URLs from v.*
          panImage: undefined, gstImage: undefined, aadharCard: undefined, cancelCheque: undefined,
        });
      }
    })();
  }, [open, isCreate, selectedId]);

  function set<K extends keyof Form>(k: K, v: Form[K]) { setForm((p) => ({ ...p, [k]: v })); }

  async function save() {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (v instanceof File) return;
      fd.append(k, String(v));
    });
    if (form.panImage instanceof File) fd.append("panImage", form.panImage);
    if (form.gstImage instanceof File) fd.append("gstImage", form.gstImage);
    if (form.aadharCard instanceof File) fd.append("aadharCard", form.aadharCard);
    if (form.cancelCheque instanceof File) fd.append("cancelCheque", form.cancelCheque);

    const method = isCreate ? "POST" : "PUT";
    const r = await fetch("/api/sudo/customer", { method, body: fd });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      alert(e.error || "Save failed");
      return;
    }
    onSaved(); onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-5xl relative">
        <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white" onClick={onClose}><X size={20}/></button>

        <div className="p-5 border-b dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {isCreate ? "Create Customer" : mode === "edit" ? "Edit Customer" : "View Customer"}
          </h3>
          <div className="flex items-center gap-2 text-xs">
            <button className="px-2 py-1 rounded border dark:border-gray-700" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}><ChevronLeft size={14}/></button>
            <span>Step {step} / 6</span>
            <button className="px-2 py-1 rounded border dark:border-gray-700" onClick={() => setStep((s) => Math.min(6, s + 1))} disabled={step === 6}><ChevronRight size={14}/></button>
          </div>
        </div>

        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Step 1 */}
          {step === 1 && (
            <div className="grid md:grid-cols-3 gap-3">
              <Input placeholder="First Name*" value={form.firstName || ""} onChange={(e)=>set("firstName", e.target.value)} disabled={!canEdit}/>
              <Input placeholder="Last Name*" value={form.lastName || ""} onChange={(e)=>set("lastName", e.target.value)} disabled={!canEdit}/>
              <Input placeholder="Username*" value={form.username || ""} onChange={(e)=>set("username", e.target.value)} disabled={!canEdit}/>
              <Input placeholder="Email*" value={form.email || ""} onChange={(e)=>set("email", e.target.value)} disabled={!canEdit}/>
              <Input placeholder="Phone*" value={form.phone || ""} onChange={(e)=>set("phone", e.target.value)} disabled={!canEdit}/>
              <Input placeholder="Password*" type="password" value={form.password || ""} onChange={(e)=>set("password", e.target.value)} disabled={!canEdit}/>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="grid md:grid-cols-4 gap-3">
              <Input placeholder="Address" value={form.address || ""} onChange={(e)=>set("address", e.target.value)} disabled={!canEdit}/>
              <Input placeholder="City" value={form.city || ""} onChange={(e)=>set("city", e.target.value)} disabled={!canEdit}/>
              <Input placeholder="State" value={form.state || ""} onChange={(e)=>set("state", e.target.value)} disabled={!canEdit}/>
              <Input placeholder="PIN Code" value={form.pinCode || ""} onChange={(e)=>set("pinCode", e.target.value)} disabled={!canEdit}/>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="grid md:grid-cols-3 gap-3">
              <Input placeholder="Customer Name*" value={form.customerName || ""} onChange={(e)=>set("customerName", e.target.value)} disabled={!canEdit}/>
              <Select value={form.customerType || ""} onChange={(e)=>set("customerType", e.target.value)} disabled={!canEdit}>
                <option value="">Customer Type</option>
                <option value="individual">Individual</option>
                <option value="govt">Govt</option>
                <option value="company">Company</option>
              </Select>
              <Select value={form.freightTerms || ""} onChange={(e)=>set("freightTerms", e.target.value)} disabled={!canEdit}>
                <option value="">Freight Terms</option>
                <option value="Paid">Paid</option>
                <option value="ToPay">To Pay</option>
                <option value="TBB">TBB</option>
                <option value="Transporter">Transporter</option>
              </Select>
              <Input placeholder="Company Name" value={form.companyName || ""} onChange={(e)=>set("companyName", e.target.value)} disabled={!canEdit}/>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div className="grid md:grid-cols-3 gap-3">
              <Select value={form.accountType || ""} onChange={(e)=>set("accountType", e.target.value)} disabled={!canEdit}>
                <option value="">Account Type</option>
                <option value="Savings">Savings</option>
                <option value="Current">Current</option>
                <option value="Other">Other</option>
              </Select>
              <Input placeholder="Bank A/C No" value={form.bankAccountNo || ""} onChange={(e)=>set("bankAccountNo", e.target.value)} disabled={!canEdit}/>
              <Input placeholder="Bank Name" value={form.bankName || ""} onChange={(e)=>set("bankName", e.target.value)} disabled={!canEdit}/>
              <Input placeholder="IFSC" value={form.ifsc || ""} onChange={(e)=>set("ifsc", e.target.value)} disabled={!canEdit}/>
              <Input placeholder="Account Holder" value={form.accountHolder || ""} onChange={(e)=>set("accountHolder", e.target.value)} disabled={!canEdit}/>
              <Input placeholder="UPI" value={form.upi || ""} onChange={(e)=>set("upi", e.target.value)} disabled={!canEdit}/>
              <Input placeholder="Payment Terms" value={form.paymentTerms || ""} onChange={(e)=>set("paymentTerms", e.target.value)} disabled={!canEdit}/>
            </div>
          )}

          {/* Step 5 */}
          {step === 5 && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Input placeholder="GST Number" value={form.gstNumber || ""} onChange={(e)=>set("gstNumber", e.target.value)} disabled={!canEdit}/>
                <Input placeholder="PAN Number" value={form.panNumber || ""} onChange={(e)=>set("panNumber", e.target.value)} disabled={!canEdit}/>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">GST Image</label>
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded border dark:border-gray-700 text-sm cursor-pointer w-max">
                    <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e)=>set("gstImage", e.target.files?.[0] || null)} disabled={!canEdit}/>
                    Choose File
                  </label>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">PAN Image</label>
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded border dark:border-gray-700 text-sm cursor-pointer w-max">
                    <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e)=>set("panImage", e.target.files?.[0] || null)} disabled={!canEdit}/>
                    Choose File
                  </label>
                </div>
              </div>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Aadhar Card</label>
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded border dark:border-gray-700 text-sm cursor-pointer w-max">
                    <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e)=>set("aadharCard", e.target.files?.[0] || null)} disabled={!canEdit}/>
                    Choose File
                  </label>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Cancel Cheque</label>
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded border dark:border-gray-700 text-sm cursor-pointer w-max">
                    <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e)=>set("cancelCheque", e.target.files?.[0] || null)} disabled={!canEdit}/>
                    Choose File
                  </label>
                </div>
                <Textarea placeholder="Message / Notes" value={form.message || ""} onChange={(e)=>set("message", e.target.value)} disabled={!canEdit}/>
              </div>
            </div>
          )}

          {/* Step 6 */}
          {step === 6 && mode !== "create" && (
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p><b>KYC By:</b> {form.kycBy || "-"}</p>
              <p><b>KYC Status:</b> {form.kycStatus}</p>
              <p><b>Registered By:</b> {form.registeredBy || "-"}</p>

              {/* View-mode download buttons */}
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {["pan","gst","aadhar","cheque"].map((t) => (
                  <a
                    key={t}
                    href={`/api/sudo/customer/file?id=${form.id}&type=${t}`}
                    target="_blank"
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded border text-xs dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <FileDown size={14}/> {t.toUpperCase()}
                  </a>
                ))}
              </div>

              <div className="mt-3">
                <b>Uploads Preview:</b>
                <div className="grid md:grid-cols-4 gap-3 mt-2">
                  {["panImage","gstImage","aadharCard","cancelCheque"].map((k) => {
                    const v = (form as any)[k];
                    if (typeof v === "string" && v) {
                      return <a key={k} href={v} target="_blank" className="underline break-all">{k}: {v}</a>;
                    }
                    return <div key={k} className="text-xs italic opacity-70">{k}: {v ? (v as File).name : "-"}</div>;
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 6 && mode === "create" && (
            <div className="text-sm text-gray-600 dark:text-gray-400">All set. Click <b>Save</b> to create the customer.</div>
          )}
        </div>

        <div className="p-4 border-t dark:border-gray-700 flex items-center justify-between">
          <button className="px-4 py-2 rounded-lg text-sm border dark:border-gray-700" onClick={()=>setStep((s)=>Math.max(1, s-1))} disabled={step===1}>Back</button>
          <div className="flex items-center gap-2">
            {canEdit && step === 6 && (
              <button className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700" onClick={save}>Save</button>
            )}
            <button className="px-4 py-2 rounded-lg text-sm border dark:border-gray-700" onClick={()=>setStep((s)=>Math.min(6, s+1))} disabled={step===6}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------ Main Page ------------ */
export default function CustomerPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<Mode>("view");

  const can = (perm: string) => {
    if (!me) return false;
    if (me.role === "sudo") return true;
    return (me.permissions || []).includes(perm);
  };

  async function refresh() {
    const url = new URL(location.origin + "/api/sudo/customer");
    url.searchParams.set("page", "1");
    url.searchParams.set("pageSize", "1000");
    const r = await fetch(url.toString());
    if (!r.ok) return;
    const data = await r.json();
    setRows(data.rows || []);
  }

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/sudo/loads/fetch?type=me");
      const m = await meRes.json();
      setMe(m);
      const ok = m?.role === "sudo" || (m?.permissions || []).includes("customer:page_view");
      if (!ok) {
        window.location.href = "/sudo";
        return;
      }
      refresh();
    })();
  }, []);

  const allSelected = selectedIds.length > 0 && selectedIds.length === rows.length;
  const toggleSelect = (id: string) =>
    setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleSelectAll = (checked: boolean) => setSelectedIds(checked ? rows.map((r) => r.id) : []);

  const openCreate = () => { setModalMode("create"); setModalOpen(true); };
  const openEdit = () => { if (selectedIds.length === 1) { setModalMode("edit"); setModalOpen(true); } };
  const openView = () => { if (selectedIds.length === 1) { setModalMode("view"); setModalOpen(true); } };

  async function doDelete() {
    if (selectedIds.length === 0) return;
    const r = await fetch("/api/sudo/customer", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds }),
    });
    if (!r.ok) { console.error(await r.text()); return; }
    setSelectedIds([]); refresh();
  }

  return (
    <div className="p-6">
      {/* Top: 4 buttons (permission-checked) */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={openCreate}
          disabled={!can("customer:create")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm ${
            can("customer:create")
              ? "border-gray-300 text-gray-700 bg-white hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              : "opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-700"
          }`}
        ><UserPlus size={16}/> Create</button>

        <button
          onClick={openEdit}
          disabled={!can("customer:edit") || selectedIds.length !== 1}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm ${
            can("customer:edit") && selectedIds.length === 1
              ? "border-gray-300 text-gray-700 bg-white hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              : "opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-700"
          }`}
        ><SquarePen size={16}/> Edit</button>

        <button
          onClick={openView}
          disabled={!can("customer:view") || selectedIds.length !== 1}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm ${
            can("customer:view") && selectedIds.length === 1
              ? "border-gray-300 text-gray-700 bg-white hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              : "opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-700"
          }`}
        ><BadgeInfo size={16}/> View</button>

        <button
          onClick={doDelete}
          disabled={!can("customer:delete") || selectedIds.length === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm ${
            can("customer:delete") && selectedIds.length > 0
              ? "border-gray-300 text-gray-700 bg-white hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              : "opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-700"
          }`}
        ><Trash2 size={16}/> Delete</button>
      </div>

      {/* Table with horizontal scroll */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="w-full text-sm table-auto min-w-[900px]">
          <thead className="text-left bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-5 py-3 w-12">
                <input type="checkbox" onChange={(e)=>toggleSelectAll(e.target.checked)} checked={allSelected}/>
              </th>
              <th className="px-5 py-3">ID</th>
              <th className="px-5 py-3">Name / Username</th>
              <th className="px-5 py-3">Contact / Mail</th>
              <th className="px-5 py-3">KYC By</th>
              <th className="px-5 py-3">KYC Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t dark:border-gray-700">
                <td className="px-5 py-3">
                  <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={()=>toggleSelect(c.id)}/>
                </td>
                <td className="px-5 py-3 text-gray-900 dark:text-gray-300">{c.panNumber || c.id}</td>
                <td className="px-5 py-3">
                  <p className="font-medium text-gray-900 dark:text-gray-300">{c.customerName}</p>
                  <span className="text-xs text-gray-600 dark:text-gray-500">{c.username}</span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><Phone size={14}/> {c.phone}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"><Mail size={14}/> {c.email}</div>
                </td>
                <td className="px-5 py-3 text-gray-900 dark:text-gray-300">{c.kycBy || "-"}</td>
                <td className="px-5 py-3"><KycBadge status={(c.kycStatus || "pending") as KycStatus}/></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-5 py-6 text-center text-gray-500 dark:text-gray-400" colSpan={6}>No records</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CustomerModal open={modalOpen} mode={modalMode} selectedId={selectedIds[0]} onClose={()=>setModalOpen(false)} onSaved={refresh}/>
    </div>
  );
}