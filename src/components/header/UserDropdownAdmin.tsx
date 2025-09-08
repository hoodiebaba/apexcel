// src/components/header/UserDropdownAdmin.tsx
"use client";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

export default function UserDropdownAdmin() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState({
    name: "Admin User",
    email: "admin@apexcel.com",
    photo: "/user.png",
  });

  const toggleDropdown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };
  const closeDropdown = () => setIsOpen(false);

  // ✅ Admin profile via httpOnly cookie
  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/me", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return; // not logged in
        const data = await res.json();
        if (abort) return;
        if (data?.user) {
          setUser({
            name: data.user.name || "Admin User",
            email: data.user.email || "admin@apexcel.com",
            photo:
              data.user.photo &&
              String(data.user.photo).trim() !== "" &&
              data.user.photo !== "null"
                ? data.user.photo
                : "/user.png",
          });
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      abort = true;
    };
  }, []);

  // ✅ Proper logout: server cookie clear + hard redirect
  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } catch {
      // ignore
    } finally {
      // hard reload to bust any client caches
      window.location.assign("/");
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dark:text-gray-400 dropdown-toggle"
      >
        <span className="mr-3 overflow-hidden rounded-full h-11 w-11">
          <Image
            width={44}
            height={44}
            src={user.photo}
            alt="Admin User"
            className="object-cover"
            unoptimized
          />
        </span>
        <span className="block mr-1 font-medium text-theme-sm">{user.name}</span>
        <svg
          className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[220px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        {/* User info */}
        <div>
          <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
            {user.name}
          </span>
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
            {user.email}
          </span>
        </div>

        {/* Actions */}
        <ul className="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/admin/profile"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Edit Profile
            </DropdownItem>
          </li>
          <li>
            <DropdownItem
              onItemClick={() => {
                window.open(
                  "https://www.kalpitevolution.com/contact",
                  "_blank",
                  "noopener,noreferrer"
                );
              }}
              tag="a"
              href="#"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Support
            </DropdownItem>
          </li>
        </ul>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
        >
          Sign out
        </button>
      </Dropdown>
    </div>
  );
}