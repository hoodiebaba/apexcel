"use client";

import React, { useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import SidebarWidget from "@/layout/SidebarWidget";
import {
  LayoutDashboard,
  Truck,
  ShoppingCart,
  Users,
  PhoneCall,
  Headset,
  Wallet,
  Bell,
  MoreHorizontal,
} from "lucide-react";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
};

const navItems: NavItem[] = [
  { icon: <LayoutDashboard size={20} />, name: "Dashboard",    path: "/admin" },
  { icon: <Truck size={20} />,           name: "Loads",        path: "/admin/loads" },
  { icon: <ShoppingCart size={20} />,    name: "Vendor",       path: "/admin/vendor" },
  { icon: <Users size={20} />,           name: "Customer",     path: "/admin/customer" },
  { icon: <PhoneCall size={20} />,       name: "Call",         path: "/admin/call" },
  { icon: <Headset size={20} />,         name: "Support",      path: "/admin/support" },
  { icon: <Wallet size={20} />,          name: "Wallet",       path: "/admin/wallet" },
  { icon: <Bell size={20} />,            name: "Notification", path: "/admin/notification" },
];

const SidebarAdmin: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  // ✅ exact-match for "/admin"; prefix for others
  const isActive = useCallback(
    (path: string) => {
      if (!pathname) return false;
      if (path === "/admin") return pathname === "/admin";               // only exact dashboard
      return pathname === path || pathname.startsWith(path + "/");       // sub-pages
    },
    [pathname]
  );

  return (
    <aside
      className={`fixed mt-16 lg:mt-0 top-0 left-0 h-screen px-5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out z-[9980]
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link href="/admin">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image className="dark:hidden" src="/images/logo/logo.svg" alt="Logo" width={150} height={40} />
              <Image className="hidden dark:block" src="/images/logo/logo-dark.svg" alt="Logo" width={150} height={40} />
            </>
          ) : (
            <Image src="/images/logo/logo-icon.svg" alt="Logo" width={32} height={32} />
          )}
        </Link>
      </div>

      {/* Nav */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <h2
            className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
              !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
            }`}
          >
            {isExpanded || isHovered || isMobileOpen ? "Menu" : <MoreHorizontal size={18} />}
          </h2>

          <ul className="flex flex-col gap-4">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.path}
                  className={`menu-item group ${isActive(item.path) ? "menu-item-active" : "menu-item-inactive"}`}
                >
                  <span className={`${isActive(item.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
                    {item.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">{item.name}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {(isExpanded || isHovered || isMobileOpen) && <SidebarWidget />}
      </div>
    </aside>
  );
};

export default SidebarAdmin;