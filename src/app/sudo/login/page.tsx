"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SudoLoginPage() {
  const [error, setError] = useState("");
  const router = useRouter();

  // ✅ already logged-in sudo ko bounce karo
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/sudo/me", {
          credentials: "include",
          cache: "no-store", // 🚀 important
        });
        const data = await res.json();
        if (res.ok && data.loggedIn && data.user?.role === "sudo") {
          router.replace("/sudo");
        }
      } catch {
        // ignore errors, stay on login
      }
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
        cache: "no-store", // 🚀 avoid stale login state
      });

      const data = await res.json();

      if (res.ok) {
        router.replace("/sudo"); // ✅ dashboard
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
          className="border w-full p-2 mb-4 rounded"
          required
        />

        <button
          type="submit"
          className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700"
        >
          Login
        </button>
      </form>
    </div>
  );
}