// src/app/admin/layout.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import HeaderAdmin from "@/layout/admin/HeaderAdmin";
import SidebarAdmin from "@/layout/admin/SidebarAdmin";
import Backdrop from "@/layout/Backdrop";

type AuthState = "checking" | "ok" | "no";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const [auth, setAuth] = useState<AuthState>("checking");
  const router = useRouter();
  const pathname = usePathname();

  const isLoginRoute = pathname === "/admin/login";

  useEffect(() => {
    let aborted = false;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch("/api/admin/me", {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        if (aborted) return;

        if (!res.ok) {
          setAuth("no");
          if (!isLoginRoute) router.replace("/admin/login");
          return;
        }

        const data = await res.json();
        if (data?.loggedIn) {
          setAuth("ok");
          if (isLoginRoute) router.replace("/admin");
        } else {
          setAuth("no");
          if (!isLoginRoute) router.replace("/admin/login");
        }
      } catch {
        if (!aborted) {
          setAuth("no");
          if (!isLoginRoute) router.replace("/admin/login");
        }
      }
    })();

    return () => {
      aborted = true;
      controller.abort();
    };
  }, [pathname, router, isLoginRoute]);

  // Sidebar spacing
  const sidebarVisible = !isLoginRoute;
  const mainContentMargin =
    sidebarVisible
      ? isMobileOpen
        ? "ml-0"
        : isExpanded || isHovered
          ? "lg:ml-[290px]"
          : "lg:ml-[90px]"
      : "ml-0";

  return (
    <div className="min-h-screen flex">
      {/* Sidebar mounted always; visually hidden on login */}
      <div className={sidebarVisible ? "" : "pointer-events-none opacity-0 lg:opacity-0"}>
        <SidebarAdmin />
        <Backdrop />
      </div>

      {/* Right column = sticky header + scrollable, FULL-WIDTH content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${mainContentMargin}`}>
        {sidebarVisible && <HeaderAdmin />}

        {/* Full width scroll area (no mx-auto, no max-w) */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {isLoginRoute ? (
            children
          ) : auth === "checking" ? (
            <div className="flex items-center justify-center h-[40vh] text-gray-500">
              Checking admin auth…
            </div>
          ) : auth === "ok" ? (
            children
          ) : (
            <div className="flex items-center justify-center h-[40vh] text-gray-500">
              Redirecting to login…
            </div>
          )}
        </main>
      </div>
    </div>
  );
}