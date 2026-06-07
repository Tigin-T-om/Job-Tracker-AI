// ---------------------------------------------------------------------------
// auth.ts - Client-side authentication helpers
// Manages the JWT access token in browser localStorage.
// Used by all authenticated pages and API calls throughout the frontend.
// ---------------------------------------------------------------------------

/** Store the JWT access token after a successful login. */
export function saveToken(token: string) {
  localStorage.setItem("access_token", token);
}

/** Retrieve the stored JWT. Returns null if the user is not logged in. */
export function getToken() {
  return localStorage.getItem("access_token");
}

/** Remove the stored JWT (used during logout). */
export function removeToken() {
  localStorage.removeItem("access_token");
}
