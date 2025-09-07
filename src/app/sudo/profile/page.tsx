"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

const InputField = ({ label, value, onChange, type = "text" }: any) => (
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
  const [formData, setFormData] = useState<any>({
    name: "",
    username: "",
    email: "",
    phone: "",
    bio: "",
    city: "",
    state: "",
    country: "",
    pinCode: "",
    taxId: "",
    accountHolder: "",
    bankName: "",
    accountType: "",
    bankAccountNo: "",
    ifsc: "",
    upi: "",
    gstNumber: "",
    password: "",
  });
  const [photo, setPhoto] = useState("/user.png");
  const [file, setFile] = useState<File | null>(null);

  // ✅ token localStorage se lo
  const token =
    typeof window !== "undefined" ? localStorage.getItem("sudo_token") : null;

  // ✅ Fetch profile
  useEffect(() => {
    if (!token) return;

    fetch("/api/sudo/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();
        if (data?.user) {
          const cleanUser = Object.fromEntries(
            Object.entries(data.user).map(([k, v]) => [
              k,
              v === "null" ? "" : v,
            ])
          );
          setFormData({ ...cleanUser, password: "" });

          if (
            data.user.photo &&
            data.user.photo.trim() &&
            data.user.photo !== "null"
          ) {
            setPhoto(data.user.photo);
          } else {
            setPhoto("/user.png");
          }
        }
      })
      .catch((err) => console.error("Profile fetch failed:", err));
  }, [token]);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      setPhoto(URL.createObjectURL(file));
    }
  };

  // ✅ Clean before sending
  const sanitizeData = (data: any) => {
    const cleaned: any = {};
    Object.keys(data).forEach((key) => {
      const val = data[key];
      if (val !== undefined && val !== null && val !== "null") {
        cleaned[key] = val;
      }
    });
    return cleaned;
  };

  // ✅ Save profile
  const handleSave = async () => {
    if (!token) {
      alert("Not logged in!");
      return;
    }

    try {
      let res;
      if (file) {
        const form = new FormData();
        const cleanData = sanitizeData(formData);
        Object.keys(cleanData).forEach((key) => {
          form.append(key, cleanData[key]);
        });
        form.append("file", file);

        res = await fetch("/api/sudo/profile", {
          method: "POST",
          body: form,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        res = await fetch("/api/sudo/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(sanitizeData(formData)),
        });
      }

      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ Profile updated");
        const cleanUser = Object.fromEntries(
          Object.entries(data.user).map(([k, v]) => [
            k,
            v === "null" ? "" : v,
          ])
        );
        setFormData({ ...cleanUser, password: "" });
        setPhoto(data.user.photo || "/user.png");
      } else {
        alert("❌ Error: " + (data.error || res.status));
      }
    } catch (err: any) {
      console.error("Save failed:", err);
      alert("❌ Save failed: " + err.message);
    }
  };

  return (
    <div className="w-full p-4 sm:p-6 space-y-6">
      {/* Profile */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Profile
        </h2>
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
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            <InputField
              label="Name"
              value={formData.name}
              onChange={(e: any) => handleChange("name", e.target.value)}
            />
            <InputField
              label="Username"
              value={formData.username}
              onChange={(e: any) => handleChange("username", e.target.value)}
            />
            <InputField
              label="Email"
              value={formData.email}
              onChange={(e: any) => handleChange("email", e.target.value)}
              type="email"
            />
            <InputField
              label="Phone"
              value={formData.phone}
              onChange={(e: any) => handleChange("phone", e.target.value)}
            />
            <InputField
              label="Bio"
              value={formData.bio}
              onChange={(e: any) => handleChange("bio", e.target.value)}
            />
            <InputField
              label="Password"
              value={formData.password}
              onChange={(e: any) => handleChange("password", e.target.value)}
              type="password"
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Address Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="City"
            value={formData.city}
            onChange={(e: any) => handleChange("city", e.target.value)}
          />
          <InputField
            label="State"
            value={formData.state}
            onChange={(e: any) => handleChange("state", e.target.value)}
          />
          <InputField
            label="Country"
            value={formData.country}
            onChange={(e: any) => handleChange("country", e.target.value)}
          />
          <InputField
            label="Postal Code"
            value={formData.pinCode}
            onChange={(e: any) => handleChange("pinCode", e.target.value)}
          />
          <InputField
            label="Tax ID"
            value={formData.taxId}
            onChange={(e: any) => handleChange("taxId", e.target.value)}
          />
        </div>
      </div>

      {/* Banking */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Banking Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Account Holder Name"
            value={formData.accountHolder}
            onChange={(e: any) => handleChange("accountHolder", e.target.value)}
          />
          <InputField
            label="Bank Name"
            value={formData.bankName}
            onChange={(e: any) => handleChange("bankName", e.target.value)}
          />
          <InputField
            label="Account Type"
            value={formData.accountType}
            onChange={(e: any) => handleChange("accountType", e.target.value)}
          />
          <InputField
            label="Account Number"
            value={formData.bankAccountNo}
            onChange={(e: any) =>
              handleChange("bankAccountNo", e.target.value)
            }
          />
          <InputField
            label="IFSC Code"
            value={formData.ifsc}
            onChange={(e: any) => handleChange("ifsc", e.target.value)}
          />
          <InputField
            label="UPI ID"
            value={formData.upi}
            onChange={(e: any) => handleChange("upi", e.target.value)}
          />
          <InputField
            label="GST Number"
            value={formData.gstNumber}
            onChange={(e: any) => handleChange("gstNumber", e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}