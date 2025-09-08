// src/app/admin/layout.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import HeaderAdmin from "@/layout/admin/HeaderAdmin";
import SidebarAdmin from "@/layout/admin/SidebarAdmin";
import Backdrop from "@/layout/Backdrop";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const [authorized, setAuthorized] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const isLoginRoute = pathname === "/admin/login"; // login page ko guard se skip karo

  useEffect(() => {
    if (!pathname || isLoginRoute) return; // login route par auth check mat karo

    const checkAuth = async () => {
      try {
        const res = await fetch("/api/admin/me", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();
        if (res.ok && data?.loggedIn && (data.user?.role === "admin" || data.user?.role === "sudo")) {
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
  }, [pathname, isLoginRoute, router]);

  // login route ko bina layout chrome ke hi render hone do
  if (isLoginRoute) return <>{children}</>;

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Checking admin auth...
      </div>
    );
  }

  const mainContentMargin =
    isMobileOpen ? "ml-0" : isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]";

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