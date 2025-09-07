"use client";

import { useSidebar } from "@/context/SidebarContext";
import HeaderSudo from "@/layout/sudo/HeaderSudo";
import SidebarSudo from "@/layout/sudo/SidebarSudo";
import Backdrop from "@/layout/Backdrop";
import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function SudoLayout({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/sudo/login") return; // skip login page

    const checkAuth = async () => {
      try {
        const res = await fetch("/api/sudo/me", {
          credentials: "include", // ✅ send cookie
        });
        const data = await res.json();

        if (res.ok && data?.loggedIn && data.user?.role === "sudo") {
          setAuthorized(true);
        } else {
          router.replace("/sudo/login");
        }
      } catch {
        router.replace("/sudo/login");
      }
    };

    checkAuth();
  }, [router, pathname]);

  if (pathname === "/sudo/login") return <>{children}</>;

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Checking auth...
      </div>
    );
  }

  const mainContentMargin =
    isMobileOpen ? "ml-0" : isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      <SidebarSudo />
      <Backdrop />
      <div className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}>
        <HeaderSudo />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
      </div>
    </div>
  );
}