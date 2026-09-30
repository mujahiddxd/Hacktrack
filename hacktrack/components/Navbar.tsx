"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import {
  Home,
  Calendar,
  Clock,
  Settings,
  Plus,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar({ adminEmail }: { adminEmail?: string }) {
  const pathname = usePathname();
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on route change
  useEffect(() => {
    setAccountDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Click outside and Escape key to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        accountRef.current &&
        !accountRef.current.contains(event.target as Node)
      ) {
        setAccountDropdownOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Hide navbar on login page
  if (pathname === "/login") return null;

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Hackathons", href: "/hackathons", icon: Calendar },
    { name: "History", href: "/history", icon: Clock },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FEFDF8] border-b-2 sm:border-b-3 border-[#121212] px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Logo + Desktop Navigation */}
        <div className="flex items-center gap-6 lg:gap-10">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#FFEB3B] border-2 sm:border-3 border-[#121212] shadow-brutal-sm flex items-center justify-center font-black text-base sm:text-lg group-hover:-translate-y-0.5 transition-transform">
              HT
            </div>
            <span className="font-black text-xl tracking-tight text-[#121212]">
              HACKTRACK
            </span>
          </Link>

          {/* Desktop Navigation Links with yellow active bottom bar */}
          <nav className="hidden lg:flex items-center gap-6 lg:gap-8 pt-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative text-sm font-bold transition-colors pb-1.5 ${
                    isActive
                      ? "text-[#121212] after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-1 after:bg-[#FFEB3B] after:border-b-2 after:border-[#121212]"
                      : "text-[#71717A] hover:text-[#121212]"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Desktop Right Actions: + New Hackathon & Account Dropdown */}
        <div className="hidden lg:flex items-center gap-3">
          <Link href="/hackathons/new">
            <button className="brutal-btn bg-[#FFEB3B] hover:bg-[#FDD835] text-[#121212] px-4 py-2 text-sm font-black rounded-lg gap-1.5 border-2 border-[#121212] shadow-brutal-sm">
              + New Hackathon
            </button>
          </Link>

          {/* Account Dropdown */}
          <div className="relative" ref={accountRef}>
            <button
              type="button"
              onClick={() => setAccountDropdownOpen((prev) => !prev)}
              aria-label="Account menu"
              aria-expanded={accountDropdownOpen}
              className={`w-9 h-9 rounded-lg border-2 border-[#121212] flex items-center justify-center shadow-brutal-sm transition-all ${
                accountDropdownOpen
                  ? "bg-[#FFEB3B] translate-x-0.5 translate-y-0.5 shadow-none"
                  : "bg-white hover:bg-[#F4F4F5]"
              }`}
            >
              <User className="w-4 h-4 text-[#121212]" />
            </button>

            {accountDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 brutal-card rounded-xl bg-white p-2 z-50 shadow-brutal animate-in fade-in">
                <div className="px-3 py-2">
                  <div className="text-[10px] font-mono font-bold text-[#71717A] uppercase tracking-wider mb-1">
                    Signed in as
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#121212] truncate">
                    <span className="w-2 h-2 rounded-full bg-[#00E676] border border-[#121212] shrink-0" />
                    <span className="truncate">
                      {adminEmail || "admin@hacktrack.com"}
                    </span>
                  </div>
                </div>

                <div className="my-1 border-t-2 border-[#121212]" />

                <form action={logoutAction} className="w-full">
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#121212] hover:bg-[#FF5252] hover:text-white rounded-lg transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log out</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Tablet and Mobile Right Actions: New Hackathon / + New & Hamburger */}
        <div className="flex lg:hidden items-center gap-2 sm:gap-2.5">
          <Link href="/hackathons/new">
            <button className="brutal-btn bg-[#FFEB3B] hover:bg-[#FDD835] text-[#121212] px-3 py-1.5 text-xs sm:text-sm font-black rounded-lg border-2 border-[#121212] shadow-brutal-sm">
              <span className="inline sm:hidden">+ New</span>
              <span className="hidden sm:inline">+ New Hackathon</span>
            </button>
          </Link>

          <div className="relative" ref={mobileMenuRef}>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              className={`w-9 h-9 rounded-lg border-2 border-[#121212] flex items-center justify-center shadow-brutal-sm transition-all ${
                mobileMenuOpen
                  ? "bg-[#FFEB3B] translate-x-0.5 translate-y-0.5 shadow-none"
                  : "bg-white hover:bg-[#F4F4F5]"
              }`}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-[#121212]" />
              ) : (
                <Menu className="w-5 h-5 text-[#121212]" />
              )}
            </button>

            {/* Mobile Dropdown Menu matching Reference (Screen 3) */}
            {mobileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 sm:w-72 brutal-card rounded-xl bg-white p-2.5 z-50 shadow-brutal animate-in fade-in">
                <nav className="flex flex-col gap-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/dashboard" &&
                        pathname.startsWith(item.href));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg font-bold text-sm transition-colors ${
                          isActive
                            ? "bg-[#FFEB3B] text-[#121212] border-2 border-[#121212] shadow-brutal-sm"
                            : "text-[#121212] hover:bg-[#F4F4F5]"
                        }`}
                      >
                        <Icon className="w-4 h-4 text-[#121212]" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>

                <div className="my-2 border-t-2 border-[#121212]" />

                {/* Account info */}
                <div className="px-3 py-1.5">
                  <div className="text-[10px] font-mono font-bold text-[#71717A] uppercase tracking-wider mb-1">
                    Account
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#121212] truncate">
                    <span className="w-2 h-2 rounded-full bg-[#00E676] border border-[#121212] shrink-0" />
                    <span className="truncate">
                      {adminEmail || "admin@hacktrack.com"}
                    </span>
                  </div>
                </div>

                <div className="mt-1 pt-1 border-t border-[#121212]/20">
                  <form action={logoutAction} className="w-full">
                    <button
                      type="submit"
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#121212] hover:bg-[#FF5252] hover:text-white rounded-lg transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
