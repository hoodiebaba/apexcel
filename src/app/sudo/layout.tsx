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
  const isLoginRoute = pathname === "/sudo/login";

  useEffect(() => {
    if (!pathname || isLoginRoute) return;

    const checkAuth = async () => {
      try {
        const res = await fetch("/api/sudo/me", {
          credentials: "include",
          cache: "no-store", // 🚫 no stale cache (fixes auto-login after logout)
        });
        const data = await res.json();
        if (res.ok && data?.loggedIn && data.user?.role === "sudo") {
          setAuthorized(true);
        } else {
          setAuthorized(false);
          router.replace("/sudo/login");
        }
      } catch {
        setAuthorized(false);
        router.replace("/sudo/login");
      }
    };

    checkAuth();
  }, [pathname, isLoginRoute, router]);

  if (isLoginRoute) return <>{children}</>;

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