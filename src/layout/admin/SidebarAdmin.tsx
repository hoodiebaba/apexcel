// src/layout/admin/SidebarAdmin.tsx
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";

// 👇 apne icons index ke path ke hisaab se adjust karna (ye same style rakha hai)
import {
  GridIcon,
  ListIcon,
  TableIcon,
  PageIcon,
  CalenderIcon,
  UserCircleIcon,
  PieChartIcon,
  BoxCubeIcon,
  PlugInIcon,
  ChevronDownIcon,
  HorizontaLDots,
} from "@/icons"; // <- if needed, change to "@/icons"

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const mainNav: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/admin",
  },
  {
    icon: <ListIcon />,
    name: "Loads",
    subItems: [
      { name: "All Loads", path: "/admin/loads" },
      { name: "Create Load", path: "/admin/loads/new" },
    ],
  },
  {
    icon: <UserCircleIcon />,
    name: "Customers",
    subItems: [
      { name: "All Customers", path: "/admin/customers" },
      { name: "Add Customer", path: "/admin/customers/new" },
    ],
  },
  {
    icon: <UserCircleIcon />,
    name: "Vendors",
    subItems: [
      { name: "All Vendors", path: "/admin/vendors" },
      { name: "Add Vendor", path: "/admin/vendors/new" },
    ],
  },
  {
    icon: <CalenderIcon />,
    name: "Calendar",
    path: "/admin/calendar",
  },
  {
    icon: <PageIcon />,
    name: "Profile",
    path: "/admin/profile",
  },
];

const othersNav: NavItem[] = [
  {
    icon: <PieChartIcon />,
    name: "Reports",
    subItems: [
      { name: "Sales", path: "/admin/reports/sales" },
      { name: "Finance", path: "/admin/reports/finance" },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "UI Elements",
    subItems: [
      { name: "Buttons", path: "/admin/ui/buttons" },
      { name: "Tables", path: "/admin/ui/tables" },
    ],
  },
  {
    icon: <PlugInIcon />,
    name: "Auth",
    subItems: [
      { name: "Admin Login", path: "/admin/login" },
      { name: "Sudo Login", path: "/sudo/login" },
    ],
  },
];

const SidebarAdmin: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const [openSubmenu, setOpenSubmenu] = useState<{ type: "main" | "others"; index: number } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    // auto-open correct submenu based on current route
    let matched = false;
    ([
      { items: mainNav, type: "main" as const },
      { items: othersNav, type: "others" as const },
    ]).forEach(({ items, type }) => {
      items.forEach((nav, idx) => {
        if (nav.subItems) {
          nav.subItems.forEach((s) => {
            if (isActive(s.path)) {
              setOpenSubmenu({ type, index: idx });
              matched = true;
            }
          });
        }
      });
    });
    if (!matched) setOpenSubmenu(null);
  }, [pathname, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      const el = subMenuRefs.current[key];
      if (el) {
        setSubMenuHeight((prev) => ({ ...prev, [key]: el.scrollHeight || 0 }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, type: "main" | "others") => {
    setOpenSubmenu((prev) => (prev && prev.type === type && prev.index === index ? null : { type, index }));
  };

  const renderMenuItems = (items: NavItem[], type: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={`${type}-${nav.name}`}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, type)}
              className={`menu-item group ${
                openSubmenu?.type === type && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
            >
              <span
                className={`${
                  openSubmenu?.type === type && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && <span className="menu-item-text">{nav.name}</span>}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === type && openSubmenu?.index === index ? "rotate-180 text-brand-500" : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"}`}
              >
                <span className={`${isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && <span className="menu-item-text">{nav.name}</span>}
              </Link>
            )
          )}

          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${type}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === type && openSubmenu?.index === index
                    ? `${subMenuHeight[`${type}-${index}`] || 0}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((s) => (
                  <li key={`${type}-${nav.name}-${s.name}`}>
                    <Link
                      href={s.path}
                      className={`menu-dropdown-item ${
                        isActive(s.path) ? "menu-dropdown-item-active" : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {s.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {s.new && (
                          <span
                            className={`menu-dropdown-badge ${
                              isActive(s.path) ? "menu-dropdown-badge-active" : "menu-dropdown-badge-inactive"
                            }`}
                          >
                            new
                          </span>
                        )}
                        {s.pro && (
                          <span
                            className={`menu-dropdown-badge ${
                              isActive(s.path) ? "menu-dropdown-badge-active" : "menu-dropdown-badge-inactive"
                            }`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 lg:mt-0 top-0 left-0 h-screen px-5 bg-white dark:bg-gray-900 text-gray-900 dark:border-gray-800 border-r border-gray-200 transition-all duration-300 ease-in-out z-50
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* logo */}
      <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link href="/">
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

      {/* nav */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? "Menu" : <HorizontaLDots />}
              </h2>
              {renderMenuItems(mainNav, "main")}
            </div>

            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? "Others" : <HorizontaLDots />}
              </h2>
              {renderMenuItems(othersNav, "others")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default SidebarAdmin;