"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    mobile_number: "",
    age: "",
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...formData,
        age: formData.age ? Number(formData.age) : null,
      }),
    });

    if (!res.ok) {
      alert("Signup failed");
      return;
    }

    alert("Account created successfully");

    router.push("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow"
      >
        <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>

        <input
          type="text"
          placeholder="Full name"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          className="mt-4 w-full rounded border p-3 text-gray-900"
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
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

        <input
          type="text"
          placeholder="Mobile number"
          value={formData.mobile_number}
          onChange={(e) =>
            setFormData({
              ...formData,
              mobile_number: e.target.value,
            })
          }
          className="mt-4 w-full rounded border p-3 text-gray-900"
        />

        <input
          type="number"
          placeholder="Age"
          value={formData.age}
          onChange={(e) =>
            setFormData({ ...formData, age: e.target.value })
          }
          className="mt-4 w-full rounded border p-3 text-gray-900"
        />

        <button
          type="submit"
          className="mt-4 w-full rounded bg-black px-5 py-3 text-white"
        >
          Create Account
        </button>
      </form>
    </main>
  );
}