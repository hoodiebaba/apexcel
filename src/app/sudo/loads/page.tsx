// app/(dashboard)/loads/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import {
  UserPlus, BadgeInfo, SquarePen, Trash2, FileDown, X, Search, ChevronLeft, ChevronRight,
} from "lucide-react";

type Status = "pending" | "active" | "approved" | "closed";

interface LoadRow {
  id: string;
  loadNumber: string;
  status: Status;
  loadDate: string | null;
  loadTime: string | null;

  creatorName: string;
  creatorUsername: string;
  creatorPhone: string;
  creatorEmail: string;
  creatorAddress: string;

  customerPanNumber: string | null;
  vendorPanNumber: string | null;

  lorryReceiptFile?: string | null;
  invoiceFile?: string | null;

  totalAmount?: number | null;

  // just enough to display
  locationUpdates?: { by: string; text: string }[] | null;
  createdAt: string;
}

interface CustomerRef {
  id: string;
  customerName: string;
  companyName?: string | null;
  username: string;
  panNumber: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

interface VendorRef {
  id: string;
  vendorName: string;
  companyName?: string | null;
  username: string;
  panNumber: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

interface Me {
  name: string;
  username: string;
  role: string;
  phone: string;
  email: string;
  address: string;
}

type ConsignParty = {
  name: string;
  number: string;
  address: string;
  gst: string;
  pan: string;
};

type LoadForm = {
  // locked by backend, just displayed
  loadNumber?: string;

  // creator displayed
  creatorName?: string;
  creatorUsername?: string;
  role?: string;
  creatorPhone?: string;
  creatorEmail?: string;
  creatorAddress?: string;

  // derived
  loadDate?: string;
  loadTime?: string;

  // selections
  customerPanNumber?: string;
  vendorPanNumber?: string | null;

  // money fields
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

  // arrays
  paymentTerms?: string;
  originCities?: string[];
  destinationCities?: string[];
  vehicleTypes?: string[];
  materialTypes?: string[];

  consignor?: ConsignParty;
  consignee?: ConsignParty;

  vendorName?: string | null;
  vendorPhone?: string | null;
  vendorAddress?: string | null;
  vendorOwnerPan?: string | null;

  locationUpdates?: { by: string; text: string }[] | null;

  // invoice / lr extra
  invoiceDescription?: string | null;
  invoicePackages?: number | null;
  invoiceInstructions?: string | null;
  lrDescription?: string | null;
  lrPackages?: number | null;
  lrInstructions?: string | null;
};

export default function LoadsPage() {
  const [loads, setLoads] = useState<LoadRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // refs
  const [me, setMe] = useState<Me | null>(null);
  const [customers, setCustomers] = useState<CustomerRef[]>([]);
  const [vendors, setVendors] = useState<VendorRef[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [vendorSearch, setVendorSearch] = useState("");

  // form
  const [formData, setFormData] = useState<LoadForm>({});

  const loadList = async () => {
    const res = await fetch("/api/loads");
    const data = await res.json();
    setLoads(data);
  };

  const loadRefs = async () => {
    const [meRes, cRes, vRes] = await Promise.all([
      fetch("/api/loads?refs=me"),
      fetch("/api/loads?refs=customers"),
      fetch("/api/loads?refs=vendors"),
    ]);
    setMe(await meRes.json());
    setCustomers(await cRes.json());
    setVendors(await vRes.json());
  };

  useEffect(() => {
    loadList();
    loadRefs();
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleCreate = () => {
    setCreateMode(true);
    setEditMode(true);
    setStep(1);
    // prefill creator details, displayed as read-only in UI
    setFormData({
      creatorName: me?.name ?? "",
      creatorUsername: me?.username ?? "",
      role: me?.role ?? "",
      creatorPhone: me?.phone ?? "",
      creatorEmail: me?.email ?? "",
      creatorAddress: me?.address ?? "",
      paymentTerms: "",
      originCities: [],
      destinationCities: [],
      vehicleTypes: [],
      materialTypes: [],
      consignor: { name: "", number: "", address: "", gst: "", pan: "" },
      consignee: { name: "", number: "", address: "", gst: "", pan: "" },
      locationUpdates: [],
    });
    setModalOpen(true);
  };

  const handleView = () => {
    if (selectedIds.length !== 1) return;
    const row = loads.find(l => l.id === selectedIds[0]);
    if (!row) return;
    setCreateMode(false);
    setEditMode(false);
    setStep(1);
    setModalOpen(true);
    // this is just a display modal in this example
    setFormData({
      loadNumber: row.loadNumber,
      creatorName: row.creatorName,
      creatorUsername: row.creatorUsername,
      role: "", // not stored on row in our shape
      creatorPhone: row.creatorPhone,
      creatorEmail: row.creatorEmail,
      creatorAddress: row.creatorAddress,
      customerPanNumber: row.customerPanNumber ?? undefined,
      vendorPanNumber: row.vendorPanNumber ?? undefined,
      totalAmount: row.totalAmount ?? undefined,
    });
  };

  const handleEdit = () => {
    if (selectedIds.length !== 1) return;
    const row = loads.find(l => l.id === selectedIds[0]);
    if (!row) return;
    setCreateMode(false);
    setEditMode(true);
    setStep(2);
    setModalOpen(true);

    // fetch full row for edit if needed; keep it simple for now
    setFormData({
      loadNumber: row.loadNumber,
      customerPanNumber: row.customerPanNumber ?? "",
      vendorPanNumber: row.vendorPanNumber ?? "",
      consignor: { name: "", number: "", address: "", gst: "", pan: "" },
      consignee: { name: "", number: "", address: "", gst: "", pan: "" },
    });
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    await fetch("/api/loads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds }),
    });
    setSelectedIds([]);
    loadList();
  };

  const closeModal = () => {
    setModalOpen(false);
    setCreateMode(false);
    setEditMode(false);
    setStep(1);
    setFormData({});
  };

  const saveCreate = async () => {
    const res = await fetch("/api/loads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (!res.ok) {
      console.error(await res.json());
      return;
    }
    closeModal();
    loadList();
  };

  const saveEdit = async () => {
    if (selectedIds.length !== 1) return;
    const id = selectedIds[0];
    const res = await fetch("/api/loads", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...formData }),
    });
    if (!res.ok) {
      console.error(await res.json());
      return;
    }
    closeModal();
    loadList();
  };

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(c =>
      [c.customerName, c.companyName ?? "", c.username, c.panNumber]
        .some(v => (v ?? "").toLowerCase().includes(q))
    );
  }, [customerSearch, customers]);

  const filteredVendors = useMemo(() => {
    const q = vendorSearch.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter(v =>
      [v.vendorName, v.companyName ?? "", v.username, v.panNumber]
        .some(val => (val ?? "").toLowerCase().includes(q))
    );
  }, [vendorSearch, vendors]);

  const set = (k: keyof LoadForm, v: any) => setFormData(p => ({ ...p, [k]: v }));

  const money = (v: string) => (v === "" ? null : Number(v));

  useEffect(() => {
    // compute derived amounts when any inputs change
    const bf = formData.basicFreight ?? 0;
    const sums =
      (formData.fuelCharges ?? 0) +
      (formData.loadingCharges ?? 0) +
      (formData.unloadingCharges ?? 0) +
      (formData.detentionLoading ?? 0) +
      (formData.detentionUnloading ?? 0) +
      (formData.otherCharges ?? 0);

    const subTotal = bf + sums;
    const gstRate = formData.gstRate ?? 0;
    const gstAmount = +(subTotal * (gstRate / 100)).toFixed(2);
    const totalAmount = +(subTotal + gstAmount).toFixed(2);

    setFormData(p => ({ ...p, subTotal, gstAmount, totalAmount }));
  }, [
    formData.basicFreight,
    formData.fuelCharges,
    formData.loadingCharges,
    formData.unloadingCharges,
    formData.detentionLoading,
    formData.detentionUnloading,
    formData.otherCharges,
    formData.gstRate,
  ]);

  return (
    <div className="p-6">
      {/* Actions */}
      <div className="flex items-center justify-start mb-6 gap-3">
        <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
          <UserPlus size={16} /> Create
        </button>
        <button onClick={handleEdit} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
          <SquarePen size={16} /> Edit
        </button>
        <button onClick={handleView} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
          <BadgeInfo size={16} /> View
        </button>
        <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
          <Trash2 size={16} /> Delete
        </button>
      </div>

      {/* Loads Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1100px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell className="px-5 py-3 w-12">
                    <input
                      type="checkbox"
                      onChange={(e) => setSelectedIds(e.target.checked ? loads.map(l => l.id) : [])}
                      checked={selectedIds.length > 0 && selectedIds.length === loads.length}
                    />
                  </TableCell>
                  <TableCell className="px-5 py-3">Load ID</TableCell>
                  <TableCell className="px-5 py-3">Customer PAN</TableCell>
                  <TableCell className="px-5 py-3">Vendor PAN</TableCell>
                  <TableCell className="px-5 py-3">Status</TableCell>
                  <TableCell className="px-5 py-3">Date / Time</TableCell>
                  <TableCell className="px-5 py-3">Creator</TableCell>
                  <TableCell className="px-5 py-3">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loads.map(load => (
                  <TableRow key={load.id}>
                    <TableCell className="px-5 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(load.id)}
                        onChange={() => toggleSelect(load.id)}
                      />
                    </TableCell>
                    <TableCell className="px-5 py-3">{load.loadNumber}</TableCell>
                    <TableCell className="px-5 py-3">{load.customerPanNumber ?? "-"}</TableCell>
                    <TableCell className="px-5 py-3">{load.vendorPanNumber ?? "-"}</TableCell>
                    <TableCell className="px-5 py-3">
                      <Badge size="sm" color={
                        load.status === "active" ? "success" :
                        load.status === "approved" ? "info" :
                        load.status === "closed" ? "error" :
                        "warning"
                      }>
                        {load.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      {load.loadDate ? new Date(load.loadDate).toLocaleDateString() : "-"}{" "}
                      <span className="text-xs text-gray-500">{load.loadTime ?? ""}</span>
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      <div className="text-sm">
                        <div className="font-medium">{load.creatorName}</div>
                        <div className="text-xs text-gray-500">{load.creatorEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-3 flex gap-2">
                      {load.lorryReceiptFile && (
                        <a href={load.lorryReceiptFile} target="_blank" rel="noreferrer"
                           className="px-3 py-1 text-xs rounded border border-gray-300 dark:border-gray-600">
                          <FileDown size={14} /> LR
                        </a>
                      )}
                      {load.invoiceFile && (
                        <a href={load.invoiceFile} target="_blank" rel="noreferrer"
                           className="px-3 py-1 text-xs rounded border border-gray-300 dark:border-gray-600">
                          <FileDown size={14} /> Invoice
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-5xl relative">
            <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white" onClick={closeModal}>
              <X size={22} />
            </button>

            {/* Header */}
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{createMode ? "Create Load" : editMode ? "Edit Load" : "View Load"}</h3>
              <div className="flex items-center gap-2 text-xs">
                <button className="px-2 py-1 rounded border" onClick={() => setStep(s => Math.max(1, (s - 1) as any))} disabled={step === 1}>
                  <ChevronLeft size={14} />
                </button>
                <span>Step {step} / 5</span>
                <button className="px-2 py-1 rounded border" onClick={() => setStep(s => Math.min(5, (s + 1) as any))} disabled={step === 5}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Step 1: Customer picker table */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="relative w-full md:w-96">
                      <input
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 pl-8 text-sm"
                        placeholder="Search customers by name, company, username, PAN"
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                      />
                      <Search className="absolute left-2 top-2.5" size={16} />
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="max-w-full overflow-x-auto">
                      <div className="min-w-[800px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableCell className="px-4 py-2">Select</TableCell>
                              <TableCell className="px-4 py-2">Name</TableCell>
                              <TableCell className="px-4 py-2">Company</TableCell>
                              <TableCell className="px-4 py-2">Username</TableCell>
                              <TableCell className="px-4 py-2">PAN</TableCell>
                              <TableCell className="px-4 py-2">Contact</TableCell>
                              <TableCell className="px-4 py-2">Mail</TableCell>
                              <TableCell className="px-4 py-2">Address</TableCell>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCustomers.map(c => (
                              <TableRow key={c.id}>
                                <TableCell className="px-4 py-2">
                                  <input
                                    type="radio"
                                    name="customerSelect"
                                    checked={formData.customerPanNumber === c.panNumber}
                                    onChange={() => set("customerPanNumber", c.panNumber)}
                                  />
                                </TableCell>
                                <TableCell className="px-4 py-2">{c.customerName}</TableCell>
                                <TableCell className="px-4 py-2">{c.companyName ?? "-"}</TableCell>
                                <TableCell className="px-4 py-2">{c.username}</TableCell>
                                <TableCell className="px-4 py-2">{c.panNumber}</TableCell>
                                <TableCell className="px-4 py-2">{c.phone ?? "-"}</TableCell>
                                <TableCell className="px-4 py-2">{c.email ?? "-"}</TableCell>
                                <TableCell className="px-4 py-2">{c.address ?? "-"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Creator & IST & money fields */}
              {step === 2 && (
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Creator block (read-only) */}
                  <div className="rounded-lg border p-4">
                    <h4 className="font-semibold mb-2">Created By (auto)</h4>
                    <div className="text-sm space-y-1">
                      <div>Name: {me?.name ?? "-"}</div>
                      <div>Username: {me?.username ?? "-"}</div>
                      <div>Role: {me?.role ?? "-"}</div>
                      <div>Phone: {me?.phone ?? "-"}</div>
                      <div>Email: {me?.email ?? "-"}</div>
                      <div>Address: {me?.address ?? "-"}</div>
                    </div>
                  </div>

                  {/* Money */}
                  <div className="rounded-lg border p-4">
                    <h4 className="font-semibold mb-2">Load Charges</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <input className="input" placeholder="Loading Date (ISO)" type="datetime-local"
                        onChange={e => set("loadingDate", e.target.value || null)} />
                      <input className="input" placeholder="Basic Freight" type="number"
                        onChange={e => set("basicFreight", money(e.target.value))} />
                      <input className="input" placeholder="Fuel Charges" type="number"
                        onChange={e => set("fuelCharges", money(e.target.value))} />
                      <input className="input" placeholder="Loading Charges" type="number"
                        onChange={e => set("loadingCharges", money(e.target.value))} />
                      <input className="input" placeholder="Unloading Charges" type="number"
                        onChange={e => set("unloadingCharges", money(e.target.value))} />
                      <input className="input" placeholder="Detention Loading" type="number"
                        onChange={e => set("detentionLoading", money(e.target.value))} />
                      <input className="input" placeholder="Detention Unloading" type="number"
                        onChange={e => set("detentionUnloading", money(e.target.value))} />
                      <input className="input" placeholder="Other Charges" type="number"
                        onChange={e => set("otherCharges", money(e.target.value))} />
                      <input className="input" placeholder="GST Rate %" type="number"
                        onChange={e => set("gstRate", money(e.target.value))} />
                      <input className="input" placeholder="Sub Total" type="number" value={formData.subTotal ?? 0} readOnly />
                      <input className="input" placeholder="GST Amount" type="number" value={formData.gstAmount ?? 0} readOnly />
                      <input className="input" placeholder="Total Amount" type="number" value={formData.totalAmount ?? 0} readOnly />
                      <input className="input col-span-2" placeholder="Remarks"
                        onChange={e => set("remarks", e.target.value)} />
                    </div>
                  </div>

                  {/* Arrays */}
                  <div className="rounded-lg border p-4 md:col-span-2">
                    <h4 className="font-semibold mb-2">Logistics Fields</h4>
                    <div className="grid md:grid-cols-3 gap-2">
                      <input className="input" placeholder="Payment Terms"
                        onChange={e => set("paymentTerms", e.target.value)} />
                      <input className="input" placeholder="Origin Cities (comma separated)"
                        onChange={e => set("originCities", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} />
                      <input className="input" placeholder="Destination Cities (comma separated)"
                        onChange={e => set("destinationCities", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} />
                      <input className="input" placeholder="Vehicle Types (comma separated)"
                        onChange={e => set("vehicleTypes", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} />
                      <input className="input" placeholder="Material Types (comma separated)"
                        onChange={e => set("materialTypes", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Vendor picker + vendor details */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="relative w-full md:w-96">
                      <input
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 pl-8 text-sm"
                        placeholder="Search vendors by name, company, username, PAN"
                        value={vendorSearch}
                        onChange={(e) => setVendorSearch(e.target.value)}
                      />
                      <Search className="absolute left-2 top-2.5" size={16} />
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="max-w-full overflow-x-auto">
                      <div className="min-w-[800px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableCell className="px-4 py-2">Select</TableCell>
                              <TableCell className="px-4 py-2">Vendor</TableCell>
                              <TableCell className="px-4 py-2">Company</TableCell>
                              <TableCell className="px-4 py-2">Username</TableCell>
                              <TableCell className="px-4 py-2">PAN</TableCell>
                              <TableCell className="px-4 py-2">Contact</TableCell>
                              <TableCell className="px-4 py-2">Mail</TableCell>
                              <TableCell className="px-4 py-2">Address</TableCell>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredVendors.map(v => (
                              <TableRow key={v.id}>
                                <TableCell className="px-4 py-2">
                                  <input
                                    type="radio"
                                    name="vendorSelect"
                                    checked={formData.vendorPanNumber === v.panNumber}
                                    onChange={() => set("vendorPanNumber", v.panNumber)}
                                  />
                                </TableCell>
                                <TableCell className="px-4 py-2">{v.vendorName}</TableCell>
                                <TableCell className="px-4 py-2">{v.companyName ?? "-"}</TableCell>
                                <TableCell className="px-4 py-2">{v.username}</TableCell>
                                <TableCell className="px-4 py-2">{v.panNumber}</TableCell>
                                <TableCell className="px-4 py-2">{v.phone ?? "-"}</TableCell>
                                <TableCell className="px-4 py-2">{v.email ?? "-"}</TableCell>
                                <TableCell className="px-4 py-2">{v.address ?? "-"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <h4 className="font-semibold mb-2">Vendor Extra Details</h4>
                    <div className="grid md:grid-cols-4 gap-2">
                      <input className="input" placeholder="Vendor Name" onChange={e => set("vendorName", e.target.value)} />
                      <input className="input" placeholder="Vendor Phone" onChange={e => set("vendorPhone", e.target.value)} />
                      <input className="input" placeholder="Vendor Address" onChange={e => set("vendorAddress", e.target.value)} />
                      <input className="input" placeholder="Vehicle Owner PAN" onChange={e => set("vendorOwnerPan", e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Consignor/Consignee */}
              {step === 4 && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4">
                    <h4 className="font-semibold mb-2">Consignor (Sender)</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <input className="input" placeholder="Name" onChange={e => set("consignor", { ...(formData.consignor ?? {}), name: e.target.value })} />
                      <input className="input" placeholder="Phone" onChange={e => set("consignor", { ...(formData.consignor ?? {}), number: e.target.value })} />
                      <input className="input col-span-2" placeholder="Address" onChange={e => set("consignor", { ...(formData.consignor ?? {}), address: e.target.value })} />
                      <input className="input" placeholder="GST" onChange={e => set("consignor", { ...(formData.consignor ?? {}), gst: e.target.value })} />
                      <input className="input" placeholder="PAN" onChange={e => set("consignor", { ...(formData.consignor ?? {}), pan: e.target.value })} />
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h4 className="font-semibold mb-2">Consignee (Receiver)</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <input className="input" placeholder="Name" onChange={e => set("consignee", { ...(formData.consignee ?? {}), name: e.target.value })} />
                      <input className="input" placeholder="Phone" onChange={e => set("consignee", { ...(formData.consignee ?? {}), number: e.target.value })} />
                      <input className="input col-span-2" placeholder="Address" onChange={e => set("consignee", { ...(formData.consignee ?? {}), address: e.target.value })} />
                      <input className="input" placeholder="GST" onChange={e => set("consignee", { ...(formData.consignee ?? {}), gst: e.target.value })} />
                      <input className="input" placeholder="PAN" onChange={e => set("consignee", { ...(formData.consignee ?? {}), pan: e.target.value })} />
                    </div>
                  </div>

                  <div className="rounded-lg border p-4 md:col-span-2">
                    <h4 className="font-semibold mb-2">Invoice & LR Text</h4>
                    <div className="grid md:grid-cols-3 gap-2">
                      <input className="input" placeholder="Invoice Description" onChange={e => set("invoiceDescription", e.target.value)} />
                      <input className="input" placeholder="Invoice Packages" type="number" onChange={e => set("invoicePackages", e.target.value === "" ? null : Number(e.target.value))} />
                      <input className="input" placeholder="Invoice Instructions" onChange={e => set("invoiceInstructions", e.target.value)} />
                      <input className="input" placeholder="LR Description" onChange={e => set("lrDescription", e.target.value)} />
                      <input className="input" placeholder="LR Packages" type="number" onChange={e => set("lrPackages", e.target.value === "" ? null : Number(e.target.value))} />
                      <input className="input" placeholder="LR Instructions" onChange={e => set("lrInstructions", e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Review */}
              {step === 5 && (
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h4 className="font-semibold mb-2">Review Summary</h4>
                    <div className="grid md:grid-cols-3 gap-2 text-sm">
                      <div>Customer PAN: {formData.customerPanNumber ?? "-"}</div>
                      <div>Vendor PAN: {formData.vendorPanNumber ?? "-"}</div>
                      <div>Total: ₹ {formData.totalAmount ?? 0}</div>
                      <div>Origin: {(formData.originCities ?? []).join(", ") || "-"}</div>
                      <div>Destination: {(formData.destinationCities ?? []).join(", ") || "-"}</div>
                      <div>Vehicles: {(formData.vehicleTypes ?? []).join(", ") || "-"}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 p-4">
              <button onClick={() => setStep(s => Math.max(1, (s - 1) as any))}
                disabled={step === 1} className="px-4 py-2 rounded-lg text-sm border">
                Back
              </button>
              <div className="flex gap-2">
                {createMode && step === 5 && (
                  <button onClick={saveCreate} className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700">
                    Save
                  </button>
                )}
                {!createMode && editMode && step === 5 && (
                  <button onClick={saveEdit} className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700">
                    Save
                  </button>
                )}
                <button onClick={() => setStep(s => Math.min(5, (s + 1) as any))}
                  disabled={step === 5} className="px-4 py-2 rounded-lg text-sm border">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .input {
          border: 1px solid var(--tw-prose-body, rgba(229,231,235));
          background: transparent;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
