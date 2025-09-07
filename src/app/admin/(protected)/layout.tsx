// src/app/admin/layout.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import HeaderAdmin from "@/layout/admin/HeaderAdmin";
import SidebarAdmin from "@/layout/admin/SidebarAdmin";
import Backdrop from "@/layout/Backdrop";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/admin/me", {
          credentials: "include",
          cache: "no-store",
        });
        if (res.ok) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
          router.replace("/admin/login");
        }
      } catch {
        setAuthorized(false);
        router.replace("/admin/login");
      }
    };
    checkAuth();
  }, [router]);

  if (authorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Checking admin auth...
      </div>
    );
  }
  if (!authorized) return null;

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      <SidebarAdmin />
      <Backdrop />
      <div className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}>
        <HeaderAdmin />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
      </div>
    </div>
  );
}