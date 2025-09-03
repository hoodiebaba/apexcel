"use client";

import { useState } from "react";
import Button from "@/components/button";

interface IMenuButton {
  toggleMenu: React.MouseEventHandler<HTMLButtonElement>;
  showMenu: boolean;
}

type Link = {
  label: string;
  href: string;
};

const links: Link[] = [
  { label: "Features", href: "/" },
  { label: "Testimonials", href: "/" },
  { label: "Pricing", href: "/" },
  { label: "Blog", href: "/" },
];

const secondaryLinks: Link[] = [
  { label: "Contact sales", href: "/" },
  { label: "Log in", href: "/login" },
  { label: "Get started", href: "/register" },
];

const MenuButton = ({ toggleMenu, showMenu }: IMenuButton) => (
  <button
    type="button"
    aria-controls="mobile-menu"
    aria-expanded={showMenu}
    onClick={toggleMenu}
    className="p-2 text-gray-400"
  >
    <span className="sr-only">Open menu</span>
    {showMenu ? (
      <svg
        className="h-6 w-6"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ) : (
      <svg
        className="h-6 w-6"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    )}
  </button>
);

const MobileMenu = () => (
  <div className="md:hidden">
    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
      {links.map((link) => (
        <a
          href={link.href}
          key={link.label}
          className="text-gray-500 block px-3 py-2 text-base font-medium hover:text-gray-700"
        >
          {link.label}
        </a>
      ))}
    </div>
    <div className="pt-4 pb-3 border-t border-gray-400">
      <div className="px-2 space-y-1">
        {secondaryLinks.map((link) => (
          <a
            key={`mobile-${link.label}`}
            href={link.href}
            className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-800"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  </div>
);

const Navigation = () => {
  const [showMenu, setShowMenu] = useState(false);
  const toggleMenu = () => setShowMenu(!showMenu);

  return (
    <nav className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          {/* Left logo + links */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <a href="/">
                <img className="h-12 w-12" src="/logo.svg" alt="logo" />
              </a>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md font-medium"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right buttons */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <a href="/">
                <Button modifier="border-0 mr-2">Contact sales</Button>
              </a>
              <a href="/login">
                <Button modifier="border-0 mr-2">Log in</Button>
              </a>
              <a href="/register">
                <Button primary>Get started</Button>
              </a>
            </div>
          </div>

          {/* Mobile toggle */}
          <div className="-mr-2 flex md:hidden">
            <MenuButton showMenu={showMenu} toggleMenu={toggleMenu} />
          </div>
        </div>
      </div>
      {showMenu ? <MobileMenu /> : null}
    </nav>
  );
};

export default Navigation;