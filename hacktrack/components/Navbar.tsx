"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import {
  Home,
  LayoutDashboard,
  Calendar,
  Clock,
  Settings,
  Plus,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navbar({ userEmail, userName }: { userEmail?: string; userName?: string | null }) {
  const pathname = usePathname();
  const initials = (userName?.trim() || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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

  // Hide on the landing, auth and onboarding screens; they have their own headers
  if (pathname === "/" || pathname === "/login" || pathname === "/register" || pathname.startsWith("/onboarding")) return null;

  const navItems = [
    { name: "Home", href: "/home", icon: Home },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Hackathons", href: "/hackathons", icon: Calendar },
    { name: "History", href: "/history", icon: Clock },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 bg-canvas border-b-2 sm:border-b-3 border-ink px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Logo + Desktop Navigation */}
        <div className="flex items-center gap-6 lg:gap-10">
          <Link href="/home" onClick={() => {
            setAccountDropdownOpen(false);
            setMobileMenuOpen(false);
          }} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#FFEB3B] text-on-accent border-2 sm:border-3 border-ink shadow-brutal-sm flex items-center justify-center font-black text-base sm:text-lg group-hover:-translate-y-0.5 transition-transform">
              HT
            </div>
            <span className="font-black text-xl tracking-tight text-ink">
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
                  onClick={() => setAccountDropdownOpen(false)}
                  className={`relative text-sm font-bold transition-colors pb-1.5 ${
                    isActive
                      ? "text-ink after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-1 after:bg-[#FFEB3B] after:border-b-2 after:border-ink"
                      : "text-muted hover:text-ink"
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
          <ThemeToggle />
          <Link
            href="/hackathons/new"
            onClick={() => setAccountDropdownOpen(false)}
            className={buttonVariants({ className: "border-2 shadow-brutal-sm font-black" })}
          >
            <Plus className="h-4 w-4" />
            New Hackathon
          </Link>

          {/* Account Dropdown */}
          <div className="relative" ref={accountRef}>
            <button
              type="button"
              onClick={() => setAccountDropdownOpen((prev) => !prev)}
              aria-label="Account menu"
              aria-expanded={accountDropdownOpen}
              className={`w-9 h-9 rounded-lg border-2 border-ink flex items-center justify-center shadow-brutal-sm transition-all ${
                accountDropdownOpen
                  ? "bg-[#FFEB3B] text-on-accent translate-x-0.5 translate-y-0.5 shadow-none"
                  : "bg-surface text-ink hover:bg-quiet"
              }`}
            >
              {initials ? (
                <span className="text-xs font-black">{initials}</span>
              ) : (
                <User className="w-4 h-4" />
              )}
            </button>

            {accountDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 brutal-card rounded-xl bg-surface p-2 z-50 shadow-brutal animate-in fade-in">
                <div className="px-3 py-2">
                  <div className="text-[10px] font-mono font-bold text-muted uppercase tracking-wider mb-1">
                    Signed in as
                  </div>
                  {userName && (
                    <div className="text-sm font-black text-ink truncate mb-0.5">{userName}</div>
                  )}
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-ink truncate">
                    <span className="w-2 h-2 rounded-full bg-[#00E676] text-on-accent border border-ink shrink-0" />
                    <span className="truncate">{userEmail}</span>
                  </div>
                </div>

                <div className="my-1 border-t-2 border-ink" />

                <Link
                  href="/account"
                  onClick={() => setAccountDropdownOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-ink hover:bg-quiet rounded-lg transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>My Account</span>
                </Link>

                <form action={logoutAction} className="w-full">
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-ink hover:bg-[#FF5252] hover:text-white rounded-lg transition-colors text-left"
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
          <Link
            href="/hackathons/new"
            className={buttonVariants({ size: "sm", className: "border-2 shadow-brutal-sm font-black sm:text-sm" })}
          >
            <Plus className="h-4 w-4" />
            <span className="sm:hidden">New</span>
            <span className="hidden sm:inline">New Hackathon</span>
          </Link>

          <div className="relative" ref={mobileMenuRef}>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              className={`w-9 h-9 rounded-lg border-2 border-ink flex items-center justify-center shadow-brutal-sm transition-all ${
                mobileMenuOpen
                  ? "bg-[#FFEB3B] text-on-accent translate-x-0.5 translate-y-0.5 shadow-none"
                  : "bg-surface text-ink hover:bg-quiet"
              }`}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            {/* Mobile Dropdown Menu matching Reference (Screen 3) */}
            {mobileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 sm:w-72 brutal-card rounded-xl bg-surface p-2.5 z-50 shadow-brutal animate-in fade-in">
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
                            ? "bg-[#FFEB3B] text-on-accent border-2 border-ink shadow-brutal-sm"
                            : "text-ink hover:bg-quiet"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>

                <div className="my-2 border-t-2 border-ink" />

                <div className="px-3 py-1.5">
                  <div className="mb-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-muted">Theme</div>
                  <ThemeToggle showLabels className="flex w-full" />
                </div>

                <div className="my-2 border-t-2 border-ink" />

                {/* Account info */}
                <div className="px-3 py-1.5">
                  <div className="text-[10px] font-mono font-bold text-muted uppercase tracking-wider mb-1">
                    Account
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-ink truncate">
                    <span className="w-2 h-2 rounded-full bg-[#00E676] text-on-accent border border-ink shrink-0" />
                    <span className="truncate">{userEmail}</span>
                  </div>
                </div>

                <div className="mt-1 pt-1 border-t border-ink/20">
                  <Link
                    href="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-ink hover:bg-quiet rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>My Account</span>
                  </Link>
                  <form action={logoutAction} className="w-full">
                    <button
                      type="submit"
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-ink hover:bg-[#FF5252] hover:text-white rounded-lg transition-colors text-left"
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
