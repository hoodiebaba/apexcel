"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/context/ThemeContext";
import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import Image from "next/image";
import Link from "next/link";

export default function ClientRegisterShell({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      {/* 3 : 2 grid (left wider) */}
      <div className="min-h-screen bg-white dark:bg-gray-900 lg:grid lg:grid-cols-[3fr_2fr]">
        {/* LEFT (scrolls with page content) */}
        <div className="flex flex-col overflow-y-auto no-scrollbar">
          {children}
        </div>

        {/* RIGHT (fixed panel – doesn't move) */}
        <div className="relative hidden lg:block">
          <div className="sticky top-0 h-screen">
            {/* base tone */}
            <div className="absolute inset-0 bg-brand-950 dark:bg-white/5" />

            {/* grid overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <GridShape />
            </div>

            {/* centered logo + tagline */}
            <div className="relative h-full grid place-items-center px-6">
              <div className="text-center">
                <Link href="/" className="inline-block mb-4">
                  <Image
                    width={231}
                    height={48}
                    src="/images/logo/auth-logo.svg"
                    alt="Logo"
                    priority
                  />
                </Link>
                <p className="text-gray-400 dark:text-white/60">
                  #1 Premier Freight Brokerage Company
                  <br />
                  Delivering Efficiency and Growth
                </p>
              </div>

              {/* theme toggle pinned */}
              <div className="absolute bottom-6 right-6">
                <ThemeTogglerTwo />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}