"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { removeToken } from "@/lib/auth";

export default function Navbar() {
  const router = useRouter();

  function handleLogout() {
    removeToken();
    router.push("/login");
  }

  return (
    <nav className="mb-8 rounded-xl bg-white px-6 py-4 shadow">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/dashboard" className="text-gray-700 hover:text-black">
          Application
        </Link>

        <Link href="/jobs" className="text-gray-700 hover:text-black">
          Application
        </Link>

        <Link href="/job/add" className="text-gray-700 hover:text-black">
          Add Job
        </Link>

        <Link
          href="/ai/resume-analysis"
          className="text-gray-700 hover:text-black"
        >
          AI Resume Analysis
        </Link>

        <Link href="/profile" className="text-gray-700 hover:text-black">
          Profile
        </Link>

        <button
          onClick={handleLogout}
          className="rounded bg-red-600 px-3 py-2 text-white"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
