// src/app/register/layout.tsx
import type { ReactNode } from "react";
import ClientRegisterShell from "./ClientRegisterShell";

export default function RegisterLayout({ children }: { children: ReactNode }) {
  // Server component: super minimal. Client bits are inside ClientRegisterShell.
  return <ClientRegisterShell>{children}</ClientRegisterShell>;
}