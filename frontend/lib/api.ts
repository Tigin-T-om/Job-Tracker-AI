// ---------------------------------------------------------------------------
// api.ts - Backend API base URL configuration
// Reads the API URL from the NEXT_PUBLIC_API_URL environment variable.
// Defaults to the local development server if not set.
// ---------------------------------------------------------------------------
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
