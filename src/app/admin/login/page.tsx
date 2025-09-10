// src/app/admin/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function getOrCreateDeviceId() {
  try {
    const k = "__admin_dev_id__";
    let id = localStorage.getItem(k);
    if (!id) {
      id = crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now();
      localStorage.setItem(k, id);
    }
    return id;
  } catch {
    return Math.random().toString(36).slice(2) + Date.now();
  }
}

export default function AdminLoginPage() {
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);
  const [deviceId, setDeviceId] = useState("");
  const router = useRouter();

  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
  }, []);

  useEffect(() => {
    // already logged-in? → go to /admin
    (async () => {
      try {
        const res = await fetch("/api/admin/me", { credentials: "include", cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data?.loggedIn) {
            router.replace("/admin");
            return;
          }
        }
      } catch {}
      setChecking(false);
    })();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const payload = {
      username: form.get("username"),
      password: form.get("password"),
    };

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-device-id": deviceId || "", // ✅ device header
        },
        body: JSON.stringify(payload),
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (res.ok) {
        router.replace("/admin");
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err: any) {
      setError("Server error: " + err.message);
    }
  };

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center">Checking session…</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 shadow-md rounded w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <input name="username" placeholder="Username" className="border w-full p-2 mb-4 rounded" required />
        <input type="password" name="password" placeholder="Password" className="border w-full p-2 mb-6 rounded" required />

        <button type="submit" className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700">
          Login
        </button>

        <p className="text-xs text-gray-500 mt-3">Note: Admin account ek hi device par lock rahega.</p>
      </form>
    </div>
  );
}