"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, FileDown, Trash2, Plus } from "lucide-react";

/* ---------- Types (unchanged) ---------- */
type Status = "pending" | "approved" | "active" | "closed";
type Mode = "create" | "edit" | "view";

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

type Customer = {
  id: string;
  customerName: string;
  companyName?: string | null;
  username: string;
  panNumber: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  paymentTerms?: string | null;
  gstNumber?: string | null;
};

type Vendor = {
  id: string;
  vendorName: string;
  companyName?: string | null;
  username: string;
  panNumber: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
};

type UpdateItem = { by: string; text: string; ts?: string };

type LoadForm = {
  id?: string;
  loadNumber?: string;
  status?: Status;

  createdBy?: string;
  creatorName?: string;
  creatorPhone?: string;
  creatorEmail?: string;
  creatorAddress?: string;

  loadDate?: string;
  loadTime?: string;

  customerPanNumber?: string;
  vendorPanNumber?: string | null;

  paymentTerms?: string;
  originCities?: string[];
  destinationCities?: string[];
  vehicleTypes?: string[];
  materialTypes?: string[];

  consignor?: any;
  consignee?: any;

  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  customerOwnerPan?: string | null;

  vendorName?: string | null;
  vendorPhone?: string | null;
  vendorAddress?: string | null;
  vendorOwnerPan?: string | null;

  loadingDate?: string | null;
  basicFreight?: number | null;
  fuelCharges?: number | null;
  loadingCharges?: number | null;
  unloadingCharges?: number | null;
  detentionLoading?: number | null;
  detentionUnloading?: number | null;
  otherCharges?: number | null;
  gstRate?: number | null;
  subTotal?: number | null;
  gstAmount?: number | null;
  totalAmount?: number | null;
  remarks?: string | null;

  locationUpdates?: UpdateItem[];

  invoiceNumber?: string | null;
  invoiceDate?: string | null;
  invoiceValue?: number | null;
  invoiceDescription?: string | null;
  invoicePackages?: number | null;
  invoiceInstructions?: string | null;

  lrNumber?: string | null;
  lrDate?: string | null;
  lrValue?: number | null;
  lrDescription?: string | null;
  lrPackages?: number | null;
  lrInstructions?: string | null;
};

/** ---------- UI primitives (unchanged) ---------- **/
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      {...props}
      className={
        "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 " +
        (className ?? "")
      }
    />
  )
);
Input.displayName = "Input";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      {...props}
      className={
        "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 " +
        (className ?? "")
      }
    />
  )
);
Textarea.displayName = "Textarea";

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ children, className, ...props }, ref) => (
    <select
      ref={ref}
      {...props}
      className={
        "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 " +
        (className ?? "")
      }
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";

/** ---------- Portal helper ---------- **/
function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

/** ---------- Component ---------- **/
export default function LoadModal({
  open,
  mode,
  onClose,
  onSaved,
  selectedId,
}: {
  open: boolean;
  mode: Mode;
  selectedId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [me, setMe] = useState<Me | null>(null);
  const [step, setStep] = useState<number>(1);
  const [form, setForm] = useState<LoadForm>({ status: "pending" });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [cQ, setCQ] = useState("");
  const [vQ, setVQ] = useState("");
  const locMsgRef = useRef<HTMLInputElement>(null);

  const canEdit = mode !== "view";
  const canSave = mode !== "view";
  const isCreate = mode === "create";

  useEffect(() => {
    if (!open) return;
    (async () => {
      const resMe = await fetch(`/api/admin/loads/fetch?type=me`, { cache: "no-store", credentials: "include" });
      if (resMe.status === 401) { onClose(); return; }
      const m = await resMe.json();
      setMe(m);

      const [cr, vr] = await Promise.all([
        fetch(`/api/admin/loads/fetch?type=customers&page=1&pageSize=500`, { cache: "no-store", credentials: "include" }),
        fetch(`/api/admin/loads/fetch?type=vendors&page=1&pageSize=500`, { cache: "no-store", credentials: "include" }),
      ]);
      const cs = await cr.json();
      const vs = await vr.json();
      setCustomers(cs.rows || []);
      setVendors(vs.rows || []);

      if (isCreate) {
        const now = new Date();
        const timeText = new Intl.DateTimeFormat("en-IN", {
          hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true, timeZone: "Asia/Kolkata",
        }).format(now);

        setForm({
          status: "pending",
          createdBy: "admin",
          creatorName: m?.name ?? "",
          creatorPhone: m?.phone ?? "",
          creatorEmail: m?.email ?? "",
          creatorAddress: m?.address ?? "",
          loadDate: now.toISOString(),
          loadTime: timeText,
          paymentTerms: "",
          originCities: [],
          destinationCities: [],
          vehicleTypes: [],
          materialTypes: [],
          consignor: {},
          consignee: {},
          locationUpdates: [],
          customerName: "",
          customerPhone: "",
          customerAddress: "",
          customerOwnerPan: "",
          vendorName: "",
          vendorPhone: "",
          vendorAddress: "",
          vendorOwnerPan: "",
        });
      } else if (selectedId) {
        const r = await fetch(`/api/admin/loads?id=${selectedId}`, { cache: "no-store", credentials: "include" });
        const data = await r.json();
        setForm({
          ...data,
          loadDate: data?.loadDate ? new Date(data.loadDate).toISOString() : "",
          invoiceDate: data?.invoiceDate ? new Date(data.invoiceDate).toISOString() : "",
          lrDate: data?.lrDate ? new Date(data.lrDate).toISOString() : "",
          loadingDate: data?.loadingDate ? new Date(data.loadingDate).toISOString() : "",
        });
      }
    })();
  }, [open, isCreate, selectedId, onClose]);

  const filteredCustomers = useMemo(() => {
    const q = cQ.toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      [c.customerName, c.companyName ?? "", c.username, c.panNumber].some((v) => (v ?? "").toLowerCase().includes(q))
    );
  }, [cQ, customers]);

  const filteredVendors = useMemo(() => {
    const q = vQ.toLowerCase();
    if (!q) return vendors;
    return vendors.filter((v) =>
      [v.vendorName, v.companyName ?? "", v.username, v.panNumber].some((val) => (val ?? "").toLowerCase().includes(q))
    );
  }, [vQ, vendors]);

  function set<K extends keyof LoadForm>(k: K, v: LoadForm[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function save() {
    const method = isCreate ? "POST" : "PUT";
    const payload = isCreate ? form : { id: form.id, ...form };
    const r = await fetch("/api/admin/loads", {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      console.error(await r.text());
      alert("Save failed");
      return;
    }
    onSaved();
    onClose();
  }

  // lock scroll + Esc to close
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onEsc);
    };
  }, [open, onClose]);

  if (!open) return null;

  const toList = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean);

  const addLocation = () => {
    if (!canEdit) return;
    const val = (locMsgRef.current?.value || "").trim();
    if (!val) return;
    const who = `${me?.role ?? ""}:${me?.name ?? ""}`;
    set("locationUpdates", [
      ...(form.locationUpdates ?? []),
      { by: who, text: val, ts: new Date().toISOString() },
    ]);
    if (locMsgRef.current) locMsgRef.current.value = "";
  };

  return (
    <ModalPortal>
      {/* super high z-index so it sits above header/sidebar */}
      <div
        className="fixed inset-0 z-[12000] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => {
          // close only when clicking on the dark backdrop
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Panel */}
        <div className="relative z-[12010] w-full max-w-6xl rounded-xl shadow-2xl bg-white dark:bg-gray-900">
          <button
            className="absolute top-3 right-3 z-[12020] text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={22} />
          </button>

          {/* Header */}
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {isCreate ? "Create Load" : mode === "edit" ? "Edit Load" : "View Load"}
            </h3>
            <div className="flex items-center gap-2 text-xs">
              <button className="px-2 py-1 rounded border dark:border-gray-700" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
                <ChevronLeft size={14} />
              </button>
              <span>Step {step} / 7</span>
              <button className="px-2 py-1 rounded border dark:border-gray-700" onClick={() => setStep((s) => Math.min(7, s + 1))} disabled={step === 7}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* -------- Step 1 -------- */}
            {step === 1 && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-lg border dark:border-gray-700 p-4">
                  <h4 className="font-semibold mb-2">Load ID</h4>
                  <div className="grid gap-2">
                    <Input readOnly value={form.loadNumber || "Auto on save"} placeholder="Load ID" />
                    <Select value={form.status ?? "pending"} onChange={(e) => set("status", e.target.value as Status)} disabled={!canEdit}>
                      <option value="pending">pending</option>
                      <option value="approved">approved</option>
                      <option value="active">active</option>
                      <option value="closed">closed</option>
                    </Select>
                  </div>
                </div>

                <div className="rounded-lg border dark:border-gray-700 p-4">
                  <h4 className="font-semibold mb-2">Load Date & Time (IST)</h4>
                  <div className="grid gap-2">
                    <Input readOnly value={form.loadDate ? new Date(form.loadDate).toLocaleString("en-IN") : ""} placeholder="Load Date IST" />
                    <Input readOnly value={form.loadTime ?? ""} placeholder="Time IST" />
                  </div>
                </div>

                <div className="rounded-lg border dark:border-gray-700 p-4 md:col-span-2">
                  <h4 className="font-semibold mb-2">Created By</h4>
                  <div className="grid md:grid-cols-3 gap-2 text-sm">
                    <Input readOnly value={form.createdBy ?? "admin"} placeholder="Role" />
                    <Input readOnly value={form.creatorName ?? me?.name ?? ""} placeholder="Name" />
                    <Input readOnly value={me?.username ?? ""} placeholder="Username" />
                    <Input readOnly value={form.creatorPhone ?? me?.phone ?? ""} placeholder="Phone" />
                    <Input readOnly value={form.creatorEmail ?? me?.email ?? ""} placeholder="Email" />
                    <Input readOnly value={form.creatorAddress ?? me?.address ?? ""} placeholder="Address" />
                  </div>
                </div>
              </div>
            )}

            {/* -------- Step 2 (Customer + Consignee) -------- */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="w-full md:w-96">
                  <Input placeholder="Search customers by name, company, username, PAN" value={cQ} onChange={(e) => setCQ(e.target.value)} />
                </div>

                <div className="rounded-lg border dark:border-gray-700">
                  <div className="max-h-72 overflow-y-auto">
                    <table className="w-full text-sm table-fixed">
                      <thead className="text-left bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-2 w-20">Select</th>
                          <th className="px-3 py-2 w-40">Name</th>
                          <th className="px-3 py-2 w-40">Company</th>
                          <th className="px-3 py-2 w-36">Username</th>
                          <th className="px-3 py-2 w-32">PAN</th>
                          <th className="px-3 py-2 w-36">Phone</th>
                          <th className="px-3 py-2 w-56">Email</th>
                          <th className="px-3 py-2">Address</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCustomers.map((c) => (
                          <tr key={c.id} className="border-t dark:border-gray-700 hover:bg-gray-50/60 dark:hover:bg-gray-800/60">
                            <td className="px-3 py-2">
                              <input
                                type="radio"
                                name="customerSelect"
                                checked={form.customerPanNumber === c.panNumber}
                                onChange={() =>
                                  setForm((p) => ({
                                    ...p,
                                    customerPanNumber: c.panNumber,
                                    customerName: c.customerName || "",
                                    customerPhone: c.phone || "",
                                    customerAddress: c.address || "",
                                    customerOwnerPan: c.panNumber || "",
                                  }))
                                }
                                disabled={!canEdit}
                              />
                            </td>
                            <td className="px-3 py-2 truncate">{c.customerName}</td>
                            <td className="px-3 py-2 truncate">{c.companyName ?? "-"}</td>
                            <td className="px-3 py-2 truncate">{c.username}</td>
                            <td className="px-3 py-2 truncate">{c.panNumber}</td>
                            <td className="px-3 py-2 truncate">{c.phone ?? "-"}</td>
                            <td className="px-3 py-2 truncate">{c.email ?? "-"}</td>
                            <td className="px-3 py-2 truncate">{c.address ?? "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-lg border dark:border-gray-700 p-4">
                  <h4 className="font-semibold mb-2">Consignee (Customer)</h4>
                  <div className="grid md:grid-cols-5 gap-2">
                    <Input placeholder="Name" value={form.consignee?.name ?? ""} onChange={(e) => set("consignee", { ...(form.consignee || {}), name: e.target.value })} disabled={!canEdit} />
                    <Input placeholder="Phone" value={form.consignee?.phone ?? form.consignee?.number ?? ""} onChange={(e) => set("consignee", { ...(form.consignee || {}), phone: e.target.value, number: e.target.value })} disabled={!canEdit} />
                    <Input placeholder="GST" value={form.consignee?.gstNumber ?? ""} onChange={(e) => set("consignee", { ...(form.consignee || {}), gstNumber: e.target.value })} disabled={!canEdit} />
                    <Input placeholder="PAN" value={form.consignee?.panNumber ?? ""} onChange={(e) => set("consignee", { ...(form.consignee || {}), panNumber: e.target.value })} disabled={!canEdit} />
                    <Input placeholder="Address" value={form.consignee?.address ?? ""} onChange={(e) => set("consignee", { ...(form.consignee || {}), address: e.target.value })} disabled={!canEdit} />
                  </div>
                </div>
              </div>
            )}

            {/* -------- Step 3 -------- */}
            {step === 3 && (
              <div className="rounded-lg border dark:border-gray-700 p-4 space-y-4">
                <div className="grid md:grid-cols-3 gap-2">
                  <Input placeholder="Payment Terms" value={form.paymentTerms ?? ""} onChange={(e) => set("paymentTerms", e.target.value)} disabled={!canEdit} />
                  <Input placeholder="Origin Cities (comma)" onChange={(e) => set("originCities", toList(e.target.value))} disabled={!canEdit} value={(form.originCities || []).join(", ")} />
                  <Input placeholder="Destination Cities (comma)" onChange={(e) => set("destinationCities", toList(e.target.value))} disabled={!canEdit} value={(form.destinationCities || []).join(", ")} />
                  <Input placeholder="Vehicle Types (comma)" onChange={(e) => set("vehicleTypes", toList(e.target.value))} disabled={!canEdit} value={(form.vehicleTypes || []).join(", ")} />
                  <Input placeholder="Material Types (comma)" onChange={(e) => set("materialTypes", toList(e.target.value))} disabled={!canEdit} value={(form.materialTypes || []).join(", ")} />
                </div>
              </div>
            )}

            {/* -------- Step 4 (Vendor + Consignor) -------- */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="w-full md:w-96">
                  <Input placeholder="Search vendors by name, company, username, PAN" value={vQ} onChange={(e) => setVQ(e.target.value)} />
                </div>

                <div className="rounded-lg border dark:border-gray-700">
                  <div className="max-h-72 overflow-y-auto">
                    <table className="w-full text-sm table-fixed">
                      <thead className="text-left bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-2 w-20">Select</th>
                          <th className="px-3 py-2 w-40">Vendor</th>
                          <th className="px-3 py-2 w-40">Company</th>
                          <th className="px-3 py-2 w-36">Username</th>
                          <th className="px-3 py-2 w-32">PAN</th>
                          <th className="px-3 py-2 w-36">Phone</th>
                          <th className="px-3 py-2 w-56">Email</th>
                          <th className="px-3 py-2">Address</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredVendors.map((v) => (
                          <tr key={v.id} className="border-t dark:border-gray-700 hover:bg-gray-50/60 dark:hover:bg-gray-800/60">
                            <td className="px-3 py-2">
                              <input
                                type="radio"
                                name="vendorSelect"
                                checked={form.vendorPanNumber === v.panNumber}
                                onChange={() =>
                                  setForm((p) => ({
                                    ...p,
                                    vendorPanNumber: v.panNumber,
                                    vendorName: v.vendorName || "",
                                    vendorPhone: v.phone || "",
                                    vendorAddress: v.address || "",
                                    vendorOwnerPan: v.panNumber || "",
                                  }))
                                }
                                disabled={!canEdit}
                              />
                            </td>
                            <td className="px-3 py-2 truncate">{v.vendorName}</td>
                            <td className="px-3 py-2 truncate">{v.companyName ?? "-"}</td>
                            <td className="px-3 py-2 truncate">{v.username}</td>
                            <td className="px-3 py-2 truncate">{v.panNumber}</td>
                            <td className="px-3 py-2 truncate">{v.phone ?? "-"}</td>
                            <td className="px-3 py-2 truncate">{v.email ?? "-"}</td>
                            <td className="px-3 py-2 truncate">{v.address ?? "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-lg border dark:border-gray-700 p-4">
                  <h4 className="font-semibold mb-2">Consignor (Vendor)</h4>
                  <div className="grid md:grid-cols-5 gap-2">
                    <Input placeholder="Name" value={form.consignor?.name ?? ""} onChange={(e) => set("consignor", { ...(form.consignor || {}), name: e.target.value })} disabled={!canEdit} />
                    <Input placeholder="Phone" value={form.consignor?.phone ?? form.consignor?.number ?? ""} onChange={(e) => set("consignor", { ...(form.consignor || {}), phone: e.target.value, number: e.target.value })} disabled={!canEdit} />
                    <Input placeholder="GST" value={form.consignor?.gstNumber ?? ""} onChange={(e) => set("consignor", { ...(form.consignor || {}), gstNumber: e.target.value })} disabled={!canEdit} />
                    <Input placeholder="PAN" value={form.consignor?.panNumber ?? ""} onChange={(e) => set("consignor", { ...(form.consignor || {}), panNumber: e.target.value })} disabled={!canEdit} />
                    <Input placeholder="Address" value={form.consignor?.address ?? ""} onChange={(e) => set("consignor", { ...(form.consignor || {}), address: e.target.value })} disabled={!canEdit} />
                  </div>
                </div>
              </div>
            )}

            {/* -------- Step 5 -------- */}
            {step === 5 && (
              <div className="rounded-lg border dark:border-gray-700 p-4 space-y-4">
                <div className="grid md:grid-cols-3 gap-2">
                  <Input type="datetime-local" placeholder="Loading Date" value={form.loadingDate ? new Date(form.loadingDate).toISOString().slice(0, 16) : ""} onChange={(e) => set("loadingDate", e.target.value || null)} disabled={!canEdit} />
                  <Input type="number" placeholder="Basic Freight" value={form.basicFreight ?? ""} onChange={(e) => set("basicFreight", e.target.value === "" ? null : Number(e.target.value))} disabled={!canEdit} />
                  <Input type="number" placeholder="Fuel Charges" value={form.fuelCharges ?? ""} onChange={(e) => set("fuelCharges", e.target.value === "" ? null : Number(e.target.value))} disabled={!canEdit} />
                  <Input type="number" placeholder="Loading Charges" value={form.loadingCharges ?? ""} onChange={(e) => set("loadingCharges", e.target.value === "" ? null : Number(e.target.value))} disabled={!canEdit} />
                  <Input type="number" placeholder="Unloading Charges" value={form.unloadingCharges ?? ""} onChange={(e) => set("unloadingCharges", e.target.value === "" ? null : Number(e.target.value))} disabled={!canEdit} />
                  <Input type="number" placeholder="Detention Loading" value={form.detentionLoading ?? ""} onChange={(e) => set("detentionLoading", e.target.value === "" ? null : Number(e.target.value))} disabled={!canEdit} />
                  <Input type="number" placeholder="Detention Unloading" value={form.detentionUnloading ?? ""} onChange={(e) => set("detentionUnloading", e.target.value === "" ? null : Number(e.target.value))} disabled={!canEdit} />
                  <Input type="number" placeholder="Other Charges" value={form.otherCharges ?? ""} onChange={(e) => set("otherCharges", e.target.value === "" ? null : Number(e.target.value))} disabled={!canEdit} />
                  <Input type="number" placeholder="GST Rate %" value={form.gstRate ?? ""} onChange={(e) => set("gstRate", e.target.value === "" ? null : Number(e.target.value))} disabled={!canEdit} />
                  <Input type="number" placeholder="Sub Total" value={form.subTotal ?? ""} onChange={(e) => set("subTotal", e.target.value === "" ? null : Number(e.target.value))} disabled={!canEdit} />
                  <Input type="number" placeholder="GST Amount" value={form.gstAmount ?? ""} onChange={(e) => set("gstAmount", e.target.value === "" ? null : Number(e.target.value))} disabled={!canEdit} />
                  <Input type="number" placeholder="Total Amount" value={form.totalAmount ?? ""} onChange={(e) => set("totalAmount", e.target.value === "" ? null : Number(e.target.value))} disabled={!canEdit} />
                </div>
                <Textarea placeholder="Remarks" value={form.remarks ?? ""} onChange={(e) => set("remarks", e.target.value)} disabled={!canEdit} />
              </div>
            )}

            {/* -------- Step 6 (Location) -------- */}
            {step === 6 && (
              <div className="rounded-lg border dark:border-gray-700 p-4 space-y-4">
                <h4 className="font-semibold">Location Log</h4>

                <div className="grid md:grid-cols-6 gap-2 items-center">
                  <Input readOnly value={me?.role ?? ""} placeholder="Role" />
                  <Input readOnly value={me?.name ?? ""} placeholder="Name" />
                  <div className="md:col-span-3">
                    <Input
                      ref={locMsgRef}
                      id="locAdd"
                      placeholder='Write update (e.g. "Truck reached Delhi")'
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && canEdit) {
                          e.preventDefault();
                          addLocation();
                        }
                      }}
                    />
                  </div>
                  <button className="px-3 py-2 rounded border dark:border-gray-700 text-sm flex items-center justify-center gap-2" onClick={addLocation} disabled={!canEdit} title="Add">
                    <Plus size={16} /> Add
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto rounded border dark:border-gray-700">
                  {(form.locationUpdates ?? [])
                    .slice()
                    .reverse()
                    .map((u, idx) => {
                      const originalIndex = (form.locationUpdates ?? []).length - 1 - idx;
                      return (
                        <div key={idx} className="px-3 py-2 border-b dark:border-gray-800 text-sm flex items-center gap-2">
                          <div className="min-w-[200px] text-gray-700 dark:text-gray-300">
                            <b>{u.by}</b>{" "}
                            <span className="text-xs text-gray-500">{new Date(u.ts || Date.now()).toLocaleString("en-IN")}</span>
                          </div>
                          <Input
                            className="flex-1"
                            value={u.text}
                            onChange={(e) => {
                              const next = [...(form.locationUpdates ?? [])];
                              next[originalIndex] = { ...next[originalIndex], text: e.target.value };
                              set("locationUpdates", next);
                            }}
                            disabled={!canEdit}
                          />
                          {canEdit && (
                            <button
                              className="px-2 py-1 rounded border dark:border-gray-700"
                              onClick={() => {
                                const next = [...(form.locationUpdates ?? [])];
                                next.splice(originalIndex, 1);
                                set("locationUpdates", next);
                              }}
                              title="Remove"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* -------- Step 7 -------- */}
            {step === 7 && (
              <div className="rounded-lg border dark:border-gray-700 p-4 space-y-4">
                <h4 className="font-semibold">Invoice & LR</h4>
                <div className="grid md:grid-cols-3 gap-2">
                  <Input placeholder="Invoice Number" value={form.invoiceNumber ?? ""} onChange={(e) => set("invoiceNumber", e.target.value)} disabled={!canEdit} />
                  <Input type="datetime-local" placeholder="Invoice Date" value={form.invoiceDate ? new Date(form.invoiceDate).toISOString().slice(0, 16) : ""} onChange={(e) => set("invoiceDate", e.target.value || null)} disabled={!canEdit} />
                  <Input type="number" placeholder="Invoice Value" value={form.invoiceValue ?? ""} onChange={(e) => set("invoiceValue", e.target.value === "" ? null : Number(e.target.value))} disabled={!canEdit} />
                  <Input placeholder="Invoice Description" value={form.invoiceDescription ?? ""} onChange={(e) => set("invoiceDescription", e.target.value)} disabled={!canEdit} />
                  <Input type="number" placeholder="Invoice Packages" value={form.invoicePackages ?? ""} onChange={(e) => set("invoicePackages", e.target.value === "" ? null : Number(e.target.value))} disabled={!canEdit} />
                  <Input placeholder="Invoice Instructions" value={form.invoiceInstructions ?? ""} onChange={(e) => set("invoiceInstructions", e.target.value)} disabled={!canEdit} />
                </div>

                <div className="grid md:grid-cols-3 gap-2">
                  <Input placeholder="LR Number" value={form.lrNumber ?? ""} onChange={(e) => set("lrNumber", e.target.value)} disabled={!canEdit} />
                  <Input type="datetime-local" placeholder="LR Date" value={form.lrDate ? new Date(form.lrDate).toISOString().slice(0, 16) : ""} onChange={(e) => set("lrDate", e.target.value || null)} disabled={!canEdit} />
                  <Input type="number" placeholder="LR Value" value={form.lrValue ?? ""} onChange={(e) => set("lrValue", e.target.value === "" ? null : Number(e.target.value))} disabled={!canEdit} />
                  <Input placeholder="LR Description" value={form.lrDescription ?? ""} onChange={(e) => set("lrDescription", e.target.value)} disabled={!canEdit} />
                  <Input type="number" placeholder="LR Packages" value={form.lrPackages ?? ""} onChange={(e) => set("lrPackages", e.target.value === "" ? null : Number(e.target.value))} disabled={!canEdit} />
                  <Input placeholder="LR Instructions" value={form.lrInstructions ?? ""} onChange={(e) => set("lrInstructions", e.target.value)} disabled={!canEdit} />
                </div>

                {!isCreate && form.id && (
                  <div className="flex gap-2">
                    <a href={`/api/admin/loads/lr?id=${form.id}`} target="_blank" className="px-3 py-2 rounded border dark:border-gray-700 text-sm flex items-center gap-2">
                      <FileDown size={14} /> Open LR
                    </a>
                    <a href={`/api/admin/loads/invoice?id=${form.id}`} target="_blank" className="px-3 py-2 rounded border dark:border-gray-700 text-sm flex items-center gap-2">
                      <FileDown size={14} /> Open Invoice
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 p-4">
            <button onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1} className="px-4 py-2 rounded-lg text-sm border dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50">
              Back
            </button>
            <div className="flex gap-2">
              {canSave && step === 7 && (
                <button onClick={save} className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700">
                  Save
                </button>
              )}
              <button onClick={() => setStep((s) => Math.min(7, s + 1))} disabled={step === 7} className="px-4 py-2 rounded-lg text-sm border dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}