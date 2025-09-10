// /app/(sudo)/admin/page.tsx   (ya jahan aapki page file hai)
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { UserPlus, BadgeInfo, SquarePen, Trash2, Phone, Mail, X, AlertTriangle } from "lucide-react";

/* ---------- constants shared with backend ---------- */
const PAGES = [
  "Dashboard",
  "Loads",
  "Vendor",
  "Customer",
  "Call",
  "Support",
  "Wallet",
  "Notification",
] as const;

const ACTIONS = [
  "page_view",
  "view",
  "create",
  "edit",
  "delete",
  "download",
  "search",
] as const;

type Page = (typeof PAGES)[number];
type Action = (typeof ACTIONS)[number];

type PermMatrix = Record<Page, Record<Action, boolean>>;

type Admin = {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string;
  email: string;
  phone: string | null;
  role: "admin" | "sudo" | string;
  bio?: string | null;
  socialUrls?: Record<string, any> | null;
  address?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  pinCode?: string | null;
  taxId?: string | null;
  gstNumber?: string | null;
  accountHolder?: string | null;
  bankName?: string | null;
  accountType?: string | null;
  ifsc?: string | null;
  bankAccountNo?: string | null;
  upi?: string | null;
  permissions: PermMatrix | string[];
  createdAt: string;
  updatedAt: string;
  status?: "active" | "inactive" | string;
};

function emptyMatrix(): PermMatrix {
  const obj: any = {};
  for (const p of PAGES) {
    obj[p] = {} as any;
    for (const a of ACTIONS) obj[p][a] = false;
  }
  return obj;
}
function isMatrix(x: any): x is PermMatrix {
  return x && typeof x === "object" && PAGES.every((p) => x[p]);
}

export default function AdminPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewAdmin, setViewAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState<Partial<Admin>>({});
  const [step, setStep] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadAdmins = async () => {
    const res = await fetch("/api/sudo/admin", { cache: "no-store" });
    const data = await res.json();
    setAdmins(data);
  };
  useEffect(() => { loadAdmins(); }, []);

  // Simple live caps (UI hint only; real enforcement backend pe hai)
  const activeSudoCount = useMemo(
    () => admins.filter(a => a.role === "sudo" && String(a.status).toLowerCase() === "active").length,
    [admins]
  );
  const activeAdminCount = useMemo(
    () => admins.filter(a => a.role === "admin" && String(a.status).toLowerCase() === "active").length,
    [admins]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    await fetch("/api/sudo/admin", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds }),
    });
    setSelectedIds([]);
    loadAdmins();
  };

  const openView = (mode: "view" | "edit" | "create") => {
    setErrorMsg(null);
    if (mode === "create") {
      setViewAdmin(null);
      setFormData({
        role: "admin",
        status: "active",
        permissions: emptyMatrix(),
        password: "",
      } as any);
      setEditMode(true);
      setCreateMode(true);
      setStep(1);
      return;
    }
    if (selectedIds.length !== 1) return;
    const admin = admins.find((a) => a.id === selectedIds[0]) || null;
    setViewAdmin(admin);
    setFormData({
      ...(admin || {}),
      password: "",
      permissions: isMatrix(admin?.permissions)
        ? admin?.permissions
        : emptyMatrix(),
    } as any);
    setEditMode(mode === "edit");
    setCreateMode(false);
    setStep(1);
  };

  const updateField = (field: keyof Admin, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updatePerm = (page: Page, action: Action, val: boolean) => {
    setFormData((prev) => {
      const matrix = isMatrix(prev.permissions) ? prev.permissions : emptyMatrix();
      const clone: PermMatrix = JSON.parse(JSON.stringify(matrix));
      clone[page][action] = val;
      return { ...prev, permissions: clone };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    try {
      const payload: any = { ...formData };
      const res = await fetch("/api/sudo/admin", {
        method: createMode ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        const msg = j?.error || (res.status === 409 ? "Role capacity limit reached." : "Save failed");
        setErrorMsg(msg);
        return;
      }
      setViewAdmin(null);
      setEditMode(false);
      setCreateMode(false);
      await loadAdmins();
    } finally {
      setSaving(false);
    }
  };

  const selectedAll = useMemo(
    () => selectedIds.length > 0 && selectedIds.length === admins.length,
    [selectedIds, admins]
  );

  // Small helper to show caps hint (UI only)
  const capsHint = (
    <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
      <div className="flex items-center gap-1">
        <AlertTriangle size={14} /> <b>Limits:</b>
      </div>
      <span>1 active sudo (now: {activeSudoCount})</span>
      <span>•</span>
      <span>2 active admins (now: {activeAdminCount})</span>
    </div>
  );

  return (
    <div className="p-6">
      {/* Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => openView("create")} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
            <UserPlus size={16} /> Create
          </button>
          <button onClick={() => openView("edit")} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
            <SquarePen size={16} /> Edit
          </button>
          <button onClick={() => openView("view")} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
            <BadgeInfo size={16} /> View
          </button>
          <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
            <Trash2 size={16} /> Delete
          </button>
        </div>
        {capsHint}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1000px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell className="px-5 py-3 w-12">
                    <input
                      type="checkbox"
                      onChange={(e) =>
                        setSelectedIds(e.target.checked ? admins.map((a) => a.id) : [])
                      }
                      checked={selectedAll}
                    />
                  </TableCell>
                  <TableCell className="px-5 py-3">Name</TableCell>
                  <TableCell className="px-5 py-3">Username</TableCell>
                  <TableCell className="px-5 py-3">Contact</TableCell>
                  <TableCell className="px-5 py-3">Role</TableCell>
                  <TableCell className="px-5 py-3">Status</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="px-5 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(admin.id)}
                        onChange={() => toggleSelect(admin.id)}
                      />
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      <p className="font-medium">{admin.name ?? "N/A"}</p>
                      <span className="text-xs text-gray-500">{admin.email}</span>
                    </TableCell>
                    <TableCell className="px-5 py-3">{admin.username}</TableCell>
                    <TableCell className="px-5 py-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone size={14} /> {admin.phone ?? "-"}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Mail size={14} /> {admin.email}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-3">{admin.role}</TableCell>
                    <TableCell className="px-5 py-3">
                      <Badge size="sm" color={String(admin.status).toLowerCase() === "inactive" ? "warning" : "success"}>
                        {String(admin.status || "active").toUpperCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {(viewAdmin || createMode) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg w-full max-w-3xl relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
              onClick={() => {
                setViewAdmin(null);
                setEditMode(false);
                setCreateMode(false);
                setErrorMsg(null);
              }}
            >
              <X size={22} />
            </button>

            <div className="p-6 space-y-5">
              {errorMsg && (
                <div className="text-sm px-3 py-2 rounded bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
                  {errorMsg}
                </div>
              )}

              {/* Step 1: Basic */}
              {step === 1 && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Basic Info</h3>
                    {capsHint}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      ["name", "Name"],
                      ["firstName", "First Name"],
                      ["lastName", "Last Name"],
                      ["username", "Username"],
                      ["email", "Email"],
                      ["phone", "Phone"],
                    ].map(([k, label]) =>
                      editMode ? (
                        <input
                          key={k}
                          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                          value={(formData as any)[k] ?? ""}
                          onChange={(e) => updateField(k as any, e.target.value)}
                          placeholder={label}
                          type={k === "email" ? "email" : "text"}
                        />
                      ) : (
                        <div key={k} className="text-sm">
                          <span className="font-medium">{label}:</span> {(viewAdmin as any)?.[k] ?? "-"}
                        </div>
                      )
                    )}
                    {editMode && (
                      <input
                        className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                        value={(formData as any).password ?? ""}
                        onChange={(e) => updateField("password" as any, e.target.value)}
                        placeholder="Set New Password"
                        type="password"
                      />
                    )}
                  </div>
                </>
              )}

              {/* Step 2: Profile */}
              {step === 2 && (
                <>
                  <h3 className="text-lg font-semibold">Profile</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {editMode ? (
                      <>
                        <select
                          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                          value={(formData.role as any) ?? "admin"}
                          onChange={(e) => updateField("role", e.target.value)}
                        >
                          <option value="admin">Admin</option>
                          <option value="sudo">Sudo</option>
                        </select>
                        <select
                          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                          value={(formData.status as any) ?? "active"}
                          onChange={(e) => updateField("status", e.target.value)}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                        <textarea
                          className="sm:col-span-2 w-full h-28 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                          placeholder="Bio"
                          value={(formData.bio as any) ?? ""}
                          onChange={(e) => updateField("bio", e.target.value)}
                        />
                      </>
                    ) : (
                      <>
                        <div className="text-sm"><span className="font-medium">Role:</span> {viewAdmin?.role}</div>
                        <div className="text-sm"><span className="font-medium">Status:</span> {viewAdmin?.status ?? "Active"}</div>
                        <div className="sm:col-span-2 text-sm"><span className="font-medium">Bio:</span> {viewAdmin?.bio ?? "-"}</div>
                      </>
                    )}
                  </div>
                </>
              )}

              {/* Step 3: Address */}
              {step === 3 && (
                <>
                  <h3 className="text-lg font-semibold">Address</h3>
                  {["address", "country", "state", "city", "pinCode"].map((field) =>
                    editMode ? (
                      <input
                        key={field}
                        className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm mb-2"
                        value={(formData as any)[field] ?? ""}
                        onChange={(e) => updateField(field as any, e.target.value)}
                        placeholder={field}
                      />
                    ) : (
                      <div key={field} className="text-sm">
                        <span className="font-medium">{field}:</span> {(viewAdmin as any)?.[field] ?? "-"}
                      </div>
                    )
                  )}
                </>
              )}

              {/* Step 4: Tax & Banking */}
              {step === 4 && (
                <>
                  <h3 className="text-lg font-semibold">Tax & Banking</h3>
                  {[
                    "taxId",
                    "gstNumber",
                    "accountHolder",
                    "bankName",
                    "accountType",
                    "ifsc",
                    "bankAccountNo",
                    "upi",
                  ].map((field) =>
                    editMode ? (
                      <input
                        key={field}
                        className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm mb-2"
                        value={(formData as any)[field] ?? ""}
                        onChange={(e) => updateField(field as any, e.target.value)}
                        placeholder={field}
                      />
                    ) : (
                      <div key={field} className="text-sm">
                        <span className="font-medium">{field}:</span> {(viewAdmin as any)?.[field] ?? "-"}
                      </div>
                    )
                  )}
                </>
              )}

              {/* Step 5: Permissions */}
              {step === 5 && (
                <>
                  <h3 className="text-lg font-semibold">Permissions</h3>
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800">
                          <th className="text-left px-3 py-2">Page</th>
                          {ACTIONS.map((a) => (
                            <th key={a} className="px-3 py-2 text-center">{a}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {PAGES.map((page) => {
                          const matrix = isMatrix(formData.permissions) ? formData.permissions : emptyMatrix();
                          return (
                            <tr key={page} className="border-t border-gray-200 dark:border-gray-700">
                              <td className="px-3 py-2 font-medium">{page}</td>
                              {ACTIONS.map((a) => (
                                <td key={a} className="px-3 py-2 text-center">
                                  {editMode ? (
                                    <input
                                      type="checkbox"
                                      checked={matrix[page][a]}
                                      onChange={(e) => updatePerm(page, a, e.target.checked)}
                                    />
                                  ) : (
                                    <span>{matrix[page][a] ? "✓" : "—"}</span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 p-4">
              <button
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1 || saving}
                className="px-4 py-2 rounded-lg text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-400 disabled:opacity-50"
              >
                Back
              </button>
              <div className="flex gap-2">
                {editMode && step === 5 && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-4 py-2 rounded-lg text-sm text-white ${saving ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"}`}
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                )}
                <button
                  onClick={() => setStep((s) => Math.min(5, s + 1))}
                  disabled={step === 5 || saving}
                  className="px-4 py-2 rounded-lg text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-400 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}