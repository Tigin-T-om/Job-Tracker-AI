"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { removeToken } from "@/lib/auth";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  function handleLogout() {
    removeToken();
    router.push("/login");
  }

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/jobs", label: "Applications" },
    { href: "/jobs/add", label: "Add Job" },
    { href: "/ai/resume-analysis", label: "AI Resume" },
    { href: "/profile", label: "Profile" },
  ];

  return (
    <nav className="mb-8 rounded-2xl border border-white/20 bg-white/70 px-6 py-4 backdrop-blur-md shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" className="text-xl font-bold tracking-tight text-slate-900 hover:text-slate-700 transition-colors">
            JobTracker.AI
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-wrap items-center gap-1 md:gap-2">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${active
                  ? "bg-blue-50 text-blue-600 font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Action Button */}
        <button
          onClick={handleLogout}
          className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition-all duration-200 hover:bg-red-100 hover:text-red-700"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
