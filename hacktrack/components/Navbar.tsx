"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import { Terminal, Calendar, LogOut, Settings, Plus, Sparkles, History, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar({ adminEmail }: { adminEmail?: string }) {
  const pathname = usePathname();

  // Hide navbar on login page
  if (pathname === "/login") return null;

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Terminal },
    { name: "Hackathons", href: "/hackathons", icon: Calendar },
    { name: "AI Add", href: "/ai-add", icon: Sparkles },
    { name: "History", href: "/history", icon: History },
    { name: "Test Email", href: "/test-email", icon: Mail },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FEFDF8] border-b-3 border-[#121212] px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-[#FFEB3B] border-3 border-[#121212] shadow-brutal-sm flex items-center justify-center font-black text-lg group-hover:-translate-y-0.5 transition-transform">
            HT
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tight text-[#121212]">
              HACKTRACK
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] -mt-1 font-bold">
              Command Center
            </span>
          </div>
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold text-sm border-2 border-transparent transition-all ${
                  isActive
                    ? "bg-[#FFEB3B] border-[#121212] shadow-brutal-sm text-[#121212]"
                    : "text-[#121212] hover:bg-neutral-100 hover:border-[#121212]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Actions & User */}
        <div className="flex items-center gap-3">
          <Link href="/hackathons/new" className="hidden sm:inline-flex">
            <Button size="sm" variant="mint" className="gap-1.5 font-bold">
              <Plus className="w-4 h-4" />
              New Hackathon
            </Button>
          </Link>

          {adminEmail && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-white border-2 border-[#121212] rounded-md text-xs font-mono font-bold text-[#121212]">
              <span className="w-2 h-2 rounded-full bg-[#00E676] border border-[#121212]" />
              {adminEmail}
            </div>
          )}

          <form action={logoutAction}>
            <button
              type="submit"
              title="Log out"
              className="brutal-btn bg-white hover:bg-[#FF5252] hover:text-white p-2 rounded-lg text-[#121212] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
