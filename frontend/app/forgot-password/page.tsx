"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { showToast } from "@/components/Toast";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  
  // 'request' = enter email to request OTP
  // 'verify' = enter OTP and set a new password
  const [step, setStep] = useState<"request" | "verify">("request");
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    new_password: "",
    confirm_password: "",
  });

  // Request OTP from backend
  async function handleRequestOTP(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: formData.email }),
      });

      if (!res.ok) {
        showToast("Failed to request reset OTP. Check your email address.", "error");
        return;
      }

      showToast("OTP sent to your email successfully!", "success");
      setStep("verify");
    } catch (err) {
      showToast("An error occurred. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  // Verify OTP and reset password
  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (formData.new_password !== formData.confirm_password) {
      showToast("Passwords do not match!", "error");
      return;
    }

    if (formData.new_password.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp,
          new_password: formData.new_password,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        showToast(errorData.detail || "Reset failed. Check your OTP.", "error");
        return;
      }

      showToast("Password reset successfully! Log in with your new password.", "success");
      router.push("/login");
    } catch (err) {
      showToast("An error occurred. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow">
        {step === "request" ? (
          <form onSubmit={handleRequestOTP}>
            <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
            <p className="mt-2 text-sm text-gray-600">
              Enter your registered email address. We will send you a 6-digit OTP code to verify your identity.
            </p>

            <input
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-4 w-full rounded border p-3 text-gray-900"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded bg-black px-5 py-3 text-white disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
            <p className="mt-2 text-sm text-gray-600">
              Enter the 6-digit OTP sent to <strong className="text-gray-800">{formData.email}</strong> and set your new password.
            </p>

            <input
              type="text"
              maxLength={6}
              placeholder="6-digit OTP Code"
              value={formData.otp}
              onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, "") })}
              className="mt-4 w-full rounded border p-3 text-gray-900 text-center text-lg tracking-widest font-mono"
              required
            />

            <input
              type="password"
              placeholder="New Password"
              value={formData.new_password}
              onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
              className="mt-4 w-full rounded border p-3 text-gray-900"
              required
            />

            <input
              type="password"
              placeholder="Confirm New Password"
              value={formData.confirm_password}
              onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
              className="mt-4 w-full rounded border p-3 text-gray-900"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded bg-black px-5 py-3 text-white disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <button
              type="button"
              onClick={() => setStep("request")}
              className="mt-2 w-full text-center text-sm font-medium text-gray-500 hover:text-gray-800"
            >
              Back to Request OTP
            </button>
          </form>
        )}

        <div className="mt-4 text-center text-sm text-gray-600">
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}
