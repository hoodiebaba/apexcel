// src/app/login/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// design system
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";

// theme + bg
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import GridShape from "@/components/common/GridShape";

export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);

  // already logged-in vendor/customer? → bounce
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.role === "vendor") return router.replace("/vendor");
          if (data?.role === "customer") return router.replace("/customer");
        }
      } catch {}
      setChecking(false);
    })();
  }, [router]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const payload = {
      username: String(form.get("username") || "").trim(),
      password: String(form.get("password") || ""),
      // keepLoggedIn -> later for cookie maxAge toggle
    };

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) return setError(data?.message || "Login failed");

      if (data?.role === "vendor") router.replace("/vendor");
      else if (data?.role === "customer") router.replace("/customer");
      else setError("Invalid role");
    } catch (err: any) {
      setError(err?.message || "Server error");
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Checking session…
      </div>
    );
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* LEFT: form column */}
      <div className="relative flex items-start lg:items-center justify-center px-6 sm:px-10">
        <div className="w-full max-w-md py-10 lg:py-0">
          {/* back link */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <ChevronLeftIcon />
              Back to dashboard
            </Link>
          </div>

          {/* heading */}
          <div className="mb-6 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>

          {/* form */}
          <form onSubmit={onSubmit}>
            <div className="space-y-6">
              {error ? (
                <div className="text-sm font-medium text-red-600">{error}</div>
              ) : null}

              <div>
                <Label>
                  Username <span className="text-error-500">*</span>
                </Label>
                <Input
                  name="username"
                  placeholder="your.username"
                  type="text"
                  required
                />
              </div>

              <div>
                <Label>
                  Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                  />
                  <span
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox checked={keepLoggedIn} onChange={setKeepLoggedIn} />
                  <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                    Keep me logged in
                  </span>
                </div>
                <Link
                  href="/#contact"
                  className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Forgot password?
                </Link>
              </div>

              <div>
                <Button className="w-full" size="sm">
                  Sign in
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT: brand panel (IMAGE + GRID like your AuthLayout) */}
      <div className="relative hidden lg:block">
        {/* 1) Base tone */}
        <div className="absolute inset-0 z-0 bg-brand-950 dark:bg-white/5" />

        {/* 2) Grid image component (your exact one) */}
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
          <GridShape />
        </div>

        {/* 3) Logo + tagline */}
        <div className="relative z-20 h-full flex items-center justify-center px-8">
          <div className="text-center">
            <img
              src="/images/logo/auth-logo.svg"
              alt="Apexcel"
              className="mx-auto h-16 w-auto mb-6"
            />
            <p className="text-sm text-gray-400 dark:text-white/60 max-w-xs mx-auto">
              #1 Premier Freight Brokerage Company
              <br />
              Delivering Efficiency and Growth
            </p>
          </div>
        </div>
      </div>

      {/* floating theme toggle */}
      <div className="fixed bottom-5 right-5">
        <ThemeToggleButton />
      </div>
    </div>
  );
}