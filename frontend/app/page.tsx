// ---------------------------------------------------------------------------
// File: page.tsx
// Description: Entry point root page component. Inspects the client token to
//              redirect the user either to the login screen or to the dashboard.
// ---------------------------------------------------------------------------

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";

/**
 * RootPage component acting as a router splash screen.
 * Handles client-side auth redirection.
 */
export default function RootPage() {
  const router = useRouter();

  // Inspect auth token on page load and redirect appropriately
  useEffect(() => {
    const token = getToken();
    if (token) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-gray-500 font-medium animate-pulse">Loading JobTracker.AI...</p>
      </div>
    </main>
  );
}
