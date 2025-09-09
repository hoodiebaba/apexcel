"use client";

import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import NotificationDropdown from "@/components/header/NotificationDropdown";
import UserDropdownAdmin from "@/components/header/UserDropdownAdmin";
import { useSidebar } from "@/context/SidebarContext";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";

const HeaderAdmin: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleToggle = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) toggleSidebar();
    else toggleMobileSidebar();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-[9999] w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:bg-gray-900/95 dark:supports-[backdrop-filter]:bg-gray-900/80 border-gray-200 dark:border-gray-800 lg:border-b shadow-sm">
      <div className="flex flex-col lg:flex-row items-center justify-between grow lg:px-6">
        {/* left */}
        <div className="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          <button
            className="lg:flex items-center justify-center w-10 h-10 lg:w-11 lg:h-11 rounded-lg text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-800 lg:border"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            {isMobileOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M6.22 7.28a1 1 0 0 1 1.06-1.06l4.72 4.72 4.72-4.72a1 1 0 1 1 1.42 1.42L13.42 12l4.72 4.72a1 1 0 1 1-1.42 1.42L12 13.42l-4.72 4.72a1 1 0 0 1-1.42-1.42L10.58 12 6.22 7.28Z" fill="currentColor"/>
              </svg>
            ) : (
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                <path d="M1.333 1.75a.75.75 0 1 1 0-1.5h13.333a.75.75 0 0 1 0 1.5H1.333Zm0 10a.75.75 0 1 1 0-1.5h13.333a.75.75 0 0 1 0 1.5H1.333ZM1.333 7.5a.75.75 0 1 1 0-1.5H8a.75.75 0 0 1 0 1.5H1.333Z" fill="currentColor"/>
              </svg>
            )}
          </button>

          {/* mobile logo */}
          <Link href="/admin" className="lg:hidden">
            <Image width={154} height={32} className="dark:hidden" src="/images/logo/logo.svg" alt="Logo" />
            <Image width={154} height={32} className="hidden dark:block" src="/images/logo/logo-dark.svg" alt="Logo" />
          </Link>

          {/* search (desktop) */}
          <div className="hidden lg:block">
            <form>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="fill-gray-500 dark:fill-gray-400" width="20" height="20" viewBox="0 0 20 20">
                    <path d="M3.042 9.374a6.333 6.333 0 1 1 11.316 3.88l2.82 2.82a.75.75 0 0 1-1.06 1.06l-2.82-2.82a6.333 6.333 0 0 1-10.256-4.94Zm6.333-5.75a5.75 5.75 0 1 0 0 11.5 5.75 5.75 0 0 0 0-11.5Z" />
                  </svg>
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search or type command..."
                  className="h-11 xl:w-[430px] rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900"
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-0.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-white/[0.03] px-[7px] py-[4.5px] text-xs text-gray-500 dark:text-gray-400"
                >
                  <span>⌘</span> <span>K</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* right */}
        <div className={`${isApplicationMenuOpen ? "flex" : "hidden"} lg:flex items-center justify-between w-full gap-4 px-5 py-4 lg:justify-end lg:px-0`}>
          <div className="flex items-center gap-2 2xsm:gap-3">
            <ThemeToggleButton />
            <NotificationDropdown />
          </div>
          <UserDropdownAdmin />
        </div>
      </div>
    </header>
  );
};

export default HeaderAdmin;