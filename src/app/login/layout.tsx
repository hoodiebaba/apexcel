// src/app/login/layout.tsx
"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/context/ThemeContext";

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-gray-900">{children}</div>
    </ThemeProvider>
  );
}