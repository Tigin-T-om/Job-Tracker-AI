"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { saveToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const loginData = new URLSearchParams();

    loginData.append("username", formData.email);
    loginData.append("password", formData.password);

    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: loginData,
    });

    if (!res.ok) {
      alert("Login failed");
      return;
    }

    const data = await res.json();

    saveToken(data.access_token);

    router.push("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow"
      >
        <h1 className="text-2xl font-bold text-gray-900">Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="mt-4 w-full rounded border p-3 text-gray-900"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          className="mt-4 w-full rounded border p-3 text-gray-900"
          required
        />

        <button
          type="submit"
          className="mt-4 w-full rounded bg-black px-5 py-3 text-white"
        >
            Login
        </button>
      </form>
    </main>
  );
}
 