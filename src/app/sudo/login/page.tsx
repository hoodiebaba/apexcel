// src/app/sudo/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

function getOrCreateDeviceId() {
  try {
    const k = "__dev_id__";
    let id = localStorage.getItem(k);
    if (!id) {
      id = crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now();
      localStorage.setItem(k, id);
    }
    return id;
  } catch {
    // SSR / restricted env fallback
    return Math.random().toString(36).slice(2) + Date.now();
  }
}

export default function SudoLoginPage() {
  const [error, setError] = useState("");
  const router = useRouter();
  const [deviceId, setDeviceId] = useState<string>("");

  // device id ready
  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
  }, []);

  // ✅ already logged-in sudo ko bounce karo
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/sudo/me", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();
        if (res.ok && data.loggedIn && data.user?.role === "sudo") {
          router.replace("/sudo");
        }
      } catch {}
    };
    checkAuth();
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
      const res = await fetch("/api/sudo/login", {
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
        router.replace("/sudo");
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err: any) {
      setError("Server error: " + err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 shadow-md rounded w-96"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Sudo Login</h2>

        {error && (
          <p className="text-red-500 text-sm font-medium mb-4">{error}</p>
        )}

        <input
          name="username"
          placeholder="Username"
          className="border w-full p-2 mb-4 rounded"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="border w-full p-2 mb-6 rounded"
          required
        />

        <button
          type="submit"
          className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700"
        >
          Login
        </button>

        {/* chhota hint: device lock */}
        <p className="text-xs text-gray-500 mt-3">
          Note: Sudo login ek hi device par allowed hai.
        </p>
      </form>
    </div>
  );
}