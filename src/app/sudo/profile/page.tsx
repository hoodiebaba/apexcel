"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

type FormState = {
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  bio?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  taxId?: string;
  accountHolder?: string;
  bankName?: string;
  accountType?: string;
  bankAccountNo?: string;
  ifsc?: string;
  upi?: string;
  gstNumber?: string;
  password?: string; // always blank in UI; only sent if user types
};

const InputField = ({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}) => (
  <div className="w-full">
    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
      {label}
    </label>
    <input
      type={type}
      value={value || ""}
      onChange={onChange}
      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm 
        focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
    />
  </div>
);

export default function ProfilePage() {
  const [formData, setFormData] = useState<FormState>({ password: "" });
  const [photo, setPhoto] = useState("/user.png");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ---------- Prefill (cookie-based auth) ----------
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/sudo/profile", {
          credentials: "include", // <— httpOnly cookie
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();

        if (data?.user) {
          // convert "null" strings to ""
          const cleanUser: Record<string, any> = Object.fromEntries(
            Object.entries(data.user).map(([k, v]) => [k, v === "null" ? "" : v])
          );
          // never show password
          setFormData({ ...cleanUser, password: "" });
          setPhoto(
            cleanUser.photo && String(cleanUser.photo).trim() !== ""
              ? cleanUser.photo
              : "/user.png"
          );
        }
      } catch (e) {
        console.error("Profile fetch failed:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = (field: keyof FormState, value: string) => {
    setFormData((p) => ({ ...p, [field]: value }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPhoto(URL.createObjectURL(f));
    }
  };

  // Remove undefined/null/"null"; keep empty string allowed for clearing
  const sanitizeData = (data: Record<string, any>) => {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v === undefined || v === null || v === "null") continue;
      if (k === "password" && String(v).trim() === "") continue; // don't send blank password
      cleaned[k] = v;
    }
    // hard guard: never allow role/permissions/status from UI
    delete cleaned.role;
    delete cleaned.permissions;
    delete cleaned.status;
    delete cleaned.createdAt;
    delete cleaned.updatedAt;
    delete cleaned.id;
    return cleaned;
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      let res: Response;
      if (file) {
        const form = new FormData();
        const cleanData = sanitizeData(formData as any);
        Object.keys(cleanData).forEach((key) => {
          form.append(key, cleanData[key] as string);
        });
        form.append("file", file);

        res = await fetch("/api/sudo/profile", {
          method: "POST",
          body: form,
          credentials: "include", // cookie auth
        });
      } else {
        res = await fetch("/api/sudo/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sanitizeData(formData as any)),
          credentials: "include",
        });
      }

      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ Profile updated");
        const cleanUser = Object.fromEntries(
          Object.entries(data.user).map(([k, v]) => [k, v === "null" ? "" : v])
        ) as Record<string, any>;
        setFormData({ ...cleanUser, password: "" });
        setPhoto(cleanUser.photo || "/user.png");

        // optional: ping /api/sudo/me so header can re-pull (if you listen somewhere)
        fetch("/api/sudo/me", { credentials: "include", cache: "no-store" }).catch(() => {});
      } else {
        alert("❌ Error: " + (data.error || res.status));
      }
    } catch (err: any) {
      console.error("Save failed:", err);
      alert("❌ Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full p-6 text-center text-gray-500 dark:text-gray-400">
        Loading profile…
      </div>
    );
  }

  return (
    <div className="w-full p-4 sm:p-6 space-y-6">
      {/* Profile */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Profile</h2>
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex flex-col items-center gap-3">
            <Image
              src={photo}
              alt="Profile"
              width={120}
              height={120}
              className="rounded-full border dark:border-gray-600 object-cover"
              unoptimized
            />
            <label className="cursor-pointer text-sm px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-800 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
              Upload
              <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            <InputField label="Name" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} />
            <InputField label="Username" value={formData.username} onChange={(e) => handleChange("username", e.target.value)} />
            <InputField label="Email" type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} />
            <InputField label="Phone" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} />
            <InputField label="Bio" value={formData.bio} onChange={(e) => handleChange("bio", e.target.value)} />
            <InputField label="Password" type="password" value={formData.password} onChange={(e) => handleChange("password", e.target.value)} />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Address Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="City" value={formData.city} onChange={(e) => handleChange("city", e.target.value)} />
          <InputField label="State" value={formData.state} onChange={(e) => handleChange("state", e.target.value)} />
          <InputField label="Country" value={formData.country} onChange={(e) => handleChange("country", e.target.value)} />
          <InputField label="Postal Code" value={formData.pinCode} onChange={(e) => handleChange("pinCode", e.target.value)} />
          <InputField label="Tax ID" value={formData.taxId} onChange={(e) => handleChange("taxId", e.target.value)} />
        </div>
      </div>

      {/* Banking */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Banking Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Account Holder Name" value={formData.accountHolder} onChange={(e) => handleChange("accountHolder", e.target.value)} />
          <InputField label="Bank Name" value={formData.bankName} onChange={(e) => handleChange("bankName", e.target.value)} />
          <InputField label="Account Type" value={formData.accountType} onChange={(e) => handleChange("accountType", e.target.value)} />
          <InputField label="Account Number" value={formData.bankAccountNo} onChange={(e) => handleChange("bankAccountNo", e.target.value)} />
          <InputField label="IFSC Code" value={formData.ifsc} onChange={(e) => handleChange("ifsc", e.target.value)} />
          <InputField label="UPI ID" value={formData.upi} onChange={(e) => handleChange("upi", e.target.value)} />
          <InputField label="GST Number" value={formData.gstNumber} onChange={(e) => handleChange("gstNumber", e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}