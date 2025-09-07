"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import {
  UserPlus,
  BadgeInfo,
  SquarePen,
  Trash2,
  Phone,
  Mail,
  X,
} from "lucide-react";

interface Admin {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string;
  password: string;
  email: string;
  phone: string | null;
  role: string;
  photo?: string | null;
  bio?: string | null;
  socialUrls?: Record<string, string> | null;
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
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  status?: string;
}

export default function AdminPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewAdmin, setViewAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState<Partial<Admin>>({});
  const [step, setStep] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [createMode, setCreateMode] = useState(false);

  const allPermissions = [
    "Manage Users",
    "Manage Settings",
    "Access Dashboard",
    "View Reports",
    "Manage Content",
  ];

  const loadAdmins = async () => {
    const res = await fetch("/api/sudo/admin");
    const data = await res.json();
    setAdmins(data);
  };

  useEffect(() => {
    loadAdmins();
  }, []);

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

  const handleView = () => {
    if (selectedIds.length !== 1) return;
    const admin = admins.find((a) => a.id === selectedIds[0]) || null;
    setViewAdmin(admin);
    setFormData(admin || {});
    setStep(1);
    setEditMode(false);
    setCreateMode(false);
  };

  const handleEdit = () => {
    if (selectedIds.length !== 1) return;
    const admin = admins.find((a) => a.id === selectedIds[0]) || null;
    setViewAdmin(admin);
    setFormData(admin || {});
    setStep(1);
    setEditMode(true);
    setCreateMode(false);
  };

  const handleCreate = () => {
    setViewAdmin(null);
    setFormData({});
    setStep(1);
    setEditMode(true);
    setCreateMode(true);
  };

  const handleSave = async () => {
    if (createMode) {
      await fetch("/api/sudo/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
    } else if (formData.id) {
      await fetch("/api/sudo/admin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
    }
    setViewAdmin(null);
    setEditMode(false);
    setCreateMode(false);
    loadAdmins();
  };

  const updateField = (field: keyof Admin, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6">
      {/* Buttons */}
      <div className="flex items-center justify-start mb-6 gap-3">
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 
          text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 
          dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <UserPlus size={16} /> Create
        </button>
        <button
          onClick={handleEdit}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 
          text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 
          dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <SquarePen size={16} /> Edit
        </button>
        <button
          onClick={handleView}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 
          text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 
          dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <BadgeInfo size={16} /> View
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 
          text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 
          dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <Trash2 size={16} /> Delete
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
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
                          e.target.checked ? admins.map((a) => a.id) : []
                        )
                      }
                      checked={
                        selectedIds.length > 0 &&
                        selectedIds.length === admins.length
                      }
                    />
                  </TableCell>
                  <TableCell className="px-5 py-3 text-gray-700 dark:text-gray-400">
                    Name
                  </TableCell>
                  <TableCell className="px-5 py-3 text-gray-700 dark:text-gray-400">
                    Username
                  </TableCell>
                  <TableCell className="px-5 py-3 text-gray-700 dark:text-gray-400">
                    Contact
                  </TableCell>
                  <TableCell className="px-5 py-3 text-gray-700 dark:text-gray-400">
                    Status
                  </TableCell>
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
                      <p className="font-medium text-gray-900 dark:text-gray-300">
                        {admin.name ?? "N/A"}
                      </p>
                      <span className="text-xs text-gray-600 dark:text-gray-500">
                        role - {admin.role}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-3 text-gray-900 dark:text-gray-300">
                      {admin.username}
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Phone size={14} /> {admin.phone ?? "-"}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Mail size={14} /> {admin.email}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      <Badge size="sm" color="success">
                        {admin.status ?? "Active"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Modal (View/Edit/Create) */}
      {(viewAdmin || createMode) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg w-full max-w-2xl relative">
            {/* Close */}
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 
              dark:text-gray-400 dark:hover:text-white"
              onClick={() => {
                setViewAdmin(null);
                setEditMode(false);
                setCreateMode(false);
              }}
            >
              <X size={22} />
            </button>

            {/* Steps */}
            <div className="p-6 space-y-4">
              {/* Step 1 - Basic Info */}
              {step === 1 && (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Basic Info
                  </h3>
                  <div className="space-y-2">
                    {["name", "firstName", "lastName", "username", "password", "email", "phone"].map((field) =>
                      editMode ? (
                        <input
                          key={field}
                          className="w-full rounded border border-gray-300 dark:border-gray-600 
                          bg-white dark:bg-gray-800 px-3 py-2 text-sm 
                          text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                          value={(formData as any)[field] ?? ""}
                          onChange={(e) => updateField(field as keyof Admin, e.target.value)}
                          placeholder={field}
                          type={field === "password" ? "password" : "text"}
                        />
                      ) : (
                        <p key={field} className="text-sm text-gray-700 dark:text-gray-400">
                          <span className="font-medium">{field}:</span>{" "}
                          {(viewAdmin as any)?.[field] ?? "-"}
                        </p>
                      )
                    )}
                  </div>
                </>
              )}

              {/* Step 2 - Profile */}
              {step === 2 && (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Profile
                  </h3>
                  {editMode ? (
                    <>
                      <select
                        className="w-full rounded border border-gray-300 dark:border-gray-600 
                        bg-white dark:bg-gray-800 px-3 py-2 text-sm 
                        text-gray-900 dark:text-white"
                        value={formData.role ?? "admin"}
                        onChange={(e) => updateField("role", e.target.value)}
                      >
                        <option value="sudo">Sudo</option>
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                      </select>
                      <input
                        className="w-full rounded border border-gray-300 dark:border-gray-600 
                        bg-white dark:bg-gray-800 px-3 py-2 text-sm 
                        text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder="Photo URL"
                        value={formData.photo ?? ""}
                        onChange={(e) => updateField("photo", e.target.value)}
                      />
                      <textarea
                        className="w-full rounded border border-gray-300 dark:border-gray-600 
                        bg-white dark:bg-gray-800 px-3 py-2 text-sm 
                        text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder="Bio"
                        value={formData.bio ?? ""}
                        onChange={(e) => updateField("bio", e.target.value)}
                      />
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-700 dark:text-gray-400">Role: {viewAdmin?.role}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-400">Bio: {viewAdmin?.bio ?? "-"}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-400">Photo: {viewAdmin?.photo ?? "-"}</p>
                    </>
                  )}
                </>
              )}

              {/* Step 3 - Address */}
              {step === 3 && (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Address
                  </h3>
                  {["address", "country", "state", "city", "pinCode"].map((field) =>
                    editMode ? (
                      <input
                        key={field}
                        className="w-full rounded border border-gray-300 dark:border-gray-600 
                        bg-white dark:bg-gray-800 px-3 py-2 text-sm 
                        text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        value={(formData as any)[field] ?? ""}
                        onChange={(e) => updateField(field as keyof Admin, e.target.value)}
                        placeholder={field}
                      />
                    ) : (
                      <p key={field} className="text-sm text-gray-700 dark:text-gray-400">
                        <span className="font-medium">{field}:</span>{" "}
                        {(viewAdmin as any)?.[field] ?? "-"}
                      </p>
                    )
                  )}
                </>
              )}

              {/* Step 4 - Tax & Legal */}
              {step === 4 && (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Tax & Legal
                  </h3>
                  {["taxId", "gstNumber"].map((field) =>
                    editMode ? (
                      <input
                        key={field}
                        className="w-full rounded border border-gray-300 dark:border-gray-600 
                        bg-white dark:bg-gray-800 px-3 py-2 text-sm 
                        text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        value={(formData as any)[field] ?? ""}
                        onChange={(e) => updateField(field as keyof Admin, e.target.value)}
                        placeholder={field}
                      />
                    ) : (
                      <p key={field} className="text-sm text-gray-700 dark:text-gray-400">
                        <span className="font-medium">{field}:</span>{" "}
                        {(viewAdmin as any)?.[field] ?? "-"}
                      </p>
                    )
                  )}
                </>
              )}

              {/* Step 5 - Banking */}
              {step === 5 && (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Banking
                  </h3>
                  {["accountHolder", "bankName", "accountType", "ifsc", "bankAccountNo", "upi"].map((field) =>
                    editMode ? (
                      <input
                        key={field}
                        className="w-full rounded border border-gray-300 dark:border-gray-600 
                        bg-white dark:bg-gray-800 px-3 py-2 text-sm 
                        text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        value={(formData as any)[field] ?? ""}
                        onChange={(e) => updateField(field as keyof Admin, e.target.value)}
                        placeholder={field}
                      />
                    ) : (
                      <p key={field} className="text-sm text-gray-700 dark:text-gray-400">
                        <span className="font-medium">{field}:</span>{" "}
                        {(viewAdmin as any)?.[field] ?? "-"}
                      </p>
                    )
                  )}
                </>
              )}

              {/* Step 6 - Permissions */}
              {step === 6 && (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Permissions
                  </h3>
                  {editMode ? (
                    <div className="space-y-2">
                      {allPermissions.map((perm) => (
                        <label key={perm} className="flex items-center gap-2 text-gray-700 dark:text-gray-400">
                          <input
                            type="checkbox"
                            checked={formData.permissions?.includes(perm) ?? false}
                            onChange={(e) => {
                              if (e.target.checked) {
                                updateField("permissions", [
                                  ...(formData.permissions ?? []),
                                  perm,
                                ]);
                              } else {
                                updateField(
                                  "permissions",
                                  (formData.permissions ?? []).filter((p) => p !== perm)
                                );
                              }
                            }}
                          />
                          <span>{perm}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 dark:text-gray-400">
                      {viewAdmin?.permissions?.join(", ") || "-"}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 p-4">
              <button
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="px-4 py-2 rounded-lg text-sm border border-gray-300 dark:border-gray-600 
                text-gray-700 dark:text-gray-400 disabled:opacity-50"
              >
                Back
              </button>
              <div className="flex gap-2">
                {editMode && step === 6 && (
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Save
                  </button>
                )}
                <button
                  onClick={() => setStep((s) => Math.min(6, s + 1))}
                  disabled={step === 6}
                  className="px-4 py-2 rounded-lg text-sm border border-gray-300 dark:border-gray-600 
                  text-gray-700 dark:text-gray-400 disabled:opacity-50"
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