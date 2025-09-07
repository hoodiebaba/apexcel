"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import {
  LayoutDashboard,
  UserCog,
  Truck,
  ShoppingCart,
  Users,
  PhoneCall,
  Headset,
  Wallet,
  Bell,
  MoreHorizontal,
} from "lucide-react"; // ✅ Icons
import SidebarWidget from "@/layout/SidebarWidget";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
};

// ✅ Har nav item ko direct uske folder ke page.tsx pe point kiya
const navItems: NavItem[] = [
  { icon: <LayoutDashboard size={20} />, name: "Dashboard", path: "/sudo" },
  { icon: <UserCog size={20} />, name: "Admin", path: "/sudo/admin" },
  { icon: <Truck size={20} />, name: "Loads", path: "/sudo/loads" },
  { icon: <ShoppingCart size={20} />, name: "Vendor", path: "/sudo/vendor" },
  { icon: <Users size={20} />, name: "Customer", path: "/sudo/customer" },
  { icon: <PhoneCall size={20} />, name: "Call", path: "/sudo/call" },
  { icon: <Headset size={20} />, name: "Support", path: "/sudo/support" },
  { icon: <Wallet size={20} />, name: "Wallet", path: "/sudo/wallet" },
  { icon: <Bell size={20} />, name: "Notification", path: "/sudo/notification" },
];

const SidebarSudo: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 
        bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 dark:text-gray-100 
        h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/sudo">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Sudo Logo"
                width={150}
                height={40}
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Sudo Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <Image
              src="/images/logo/logo-icon.svg"
              alt="Sudo Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>

      {/* Nav Items */}
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
                  className={`menu-item ${
                    pathname === item.path
                      ? "menu-item-active"
                      : "menu-item-inactive"
                  }`}
                >
                  {item.icon}
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="ml-2">{item.name}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom Widget */}
        {(isExpanded || isHovered || isMobileOpen) && <SidebarWidget />}
      </div>
    </aside>
  );
};

export default SidebarSudo;