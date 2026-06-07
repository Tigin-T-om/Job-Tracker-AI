// ---------------------------------------------------------------------------
// File: components/Toast.tsx
// Description: Global toast notification system. Dispatches custom browser
//              events to display success, error, warning, and info toasts.
// ---------------------------------------------------------------------------

"use client";

import { useEffect, useState } from "react";

// ---- What is this? ----
// This is a global "event system" for toasts.
// When ANY component calls showToast("message"), it fires a custom browser event.
// The Toast component LISTENS for that event and displays the message.
// This way, any component can trigger a toast without prop drilling.

type ToastType = "success" | "error" | "info" | "warning";

type ToastMessage = {
  id: number;
  text: string;
  type: ToastType;
};

// This counter ensures each toast gets a unique ID
let toastIdCounter = 0;

// ---- This is the function you call instead of alert() ----
// Usage:  showToast("Job added successfully")           → green success toast
// Usage:  showToast("Failed to update job", "error")    → red error toast
// Usage:  showToast("Please login first", "warning")    → yellow warning toast
export function showToast(text: string, type: ToastType = "success") {
  // We create a custom browser event called "app-toast"
  // and attach the message data to it.
  // The Toast component below listens for this event.
  const event = new CustomEvent("app-toast", {
    detail: { id: toastIdCounter++, text, type },
  });
  window.dispatchEvent(event);
}

// ---- This is the visual Toast component ----
// It renders at the top-right of the screen and auto-hides after 3.5 seconds
export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    // Listen for the custom "app-toast" event
    function handleToast(e: Event) {
      const detail = (e as CustomEvent).detail as ToastMessage;
      setToasts((prev) => [...prev, detail]);

      // Auto-remove this toast after 3500ms (3.5 seconds)
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== detail.id));
      }, 3500);
    }

    window.addEventListener("app-toast", handleToast);

    // Cleanup: remove listener when component unmounts
    return () => window.removeEventListener("app-toast", handleToast);
  }, []);

  // Don't render anything if there are no toasts
  if (toasts.length === 0) return null;

  return (
    // Position: fixed at top-right, above everything (z-50 = z-index: 50)
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            rounded-lg px-4 py-3 shadow-lg text-sm font-medium
            animate-slide-in
            ${toast.type === "success" ? "bg-green-600 text-white" : ""}
            ${toast.type === "error" ? "bg-red-600 text-white" : ""}
            ${toast.type === "warning" ? "bg-yellow-500 text-white" : ""}
            ${toast.type === "info" ? "bg-blue-600 text-white" : ""}
          `}
        >
          <div className="flex items-center gap-2">
            {/* Icon based on type */}
            <span className="text-base">
              {toast.type === "success" && "✅"}
              {toast.type === "error" && "❌"}
              {toast.type === "warning" && "⚠️"}
              {toast.type === "info" && "ℹ️"}
            </span>
            <span>{toast.text}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
