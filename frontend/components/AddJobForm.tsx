"use client";

import { useState } from "react";
import { API_BASE_URL } from "@/lib/api";

export default function AddJobForm() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    company_name: "",
    role: "",
    job_link: "",
    location: "",
    source: "",
    status: "Applied",
    applied_date: "",
    follow_up_date: "",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const res = await fetch(`${API_BASE_URL}/jobs/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...formData,
        applied_date: formData.applied_date || null,
        follow_up_date: formData.follow_up_date || null,
      }),
    });

    if (!res.ok) {
      alert("Failed to create job");
      return;
    }

    const createdJob = await res.json();

    if (resumeFile) {
      const resumeData = new FormData();

      resumeData.append("resume", resumeFile);

      const resumeRes = await fetch(
        `${API_BASE_URL}/jobs/${createdJob.id}/resume`,
        {
          method: "POST",
          body: resumeData,
        },
      );

      if (!resumeRes.ok) {
        alert("Job created, but resume upload failed");
        return;
      }
    }

    alert("Job added successfully");

    setFormData({
      company_name: "",
      role: "",
      job_link: "",
      location: "",
      source: "",
      status: "Applied",
      applied_date: "",
      follow_up_date: "",
      notes: "",
    });

    setResumeFile(null);

    window.location.reload();
  }

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 rounded-xl bg-white p-6 shadow"
    >
      <h2 className="text-xl font-semibold text-gray-900">Add New Job</h2>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <input
          name="company_name"
          value={formData.company_name}
          onChange={handleChange}
          required
          placeholder="Company name"
          className="rounded border p-3 text-gray-900"
        />

        <input
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
          placeholder="Role"
          className="rounded border p-3 text-gray-900"
        />

        <input
          name="job_link"
          value={formData.job_link}
          onChange={handleChange}
          placeholder="Job link"
          className="rounded border p-3 text-gray-900"
        />

        <input
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="Location"
          className="rounded border p-3 text-gray-900"
        />

        <input
          name="source"
          value={formData.source}
          onChange={handleChange}
          placeholder="Source e.g. LinkedIn"
          className="rounded border p-3 text-gray-900"
        />

        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="rounded border p-3 text-gray-900"
        >
          <option>Applied</option>
          <option>No Response</option>
          <option>Callback Received</option>
          <option>Aptitude Test</option>
          <option>Technical Interview</option>
          <option>HR Interview</option>
          <option>Final Interview</option>
          <option>Offer Received</option>
          <option>Rejected</option>
        </select>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Applied Date
          </label>

          <input
            type="date"
            name="applied_date"
            value={formData.applied_date}
            onChange={handleChange}
            className="w-full rounded border p-3 text-gray-900"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Follow-up Date
          </label>

          <input
            type="date"
            name="follow_up_date"
            value={formData.follow_up_date}
            onChange={handleChange}
            className="w-full rounded border p-3 text-gray-900"
          />
        </div>
      </div>

      <textarea
        name="notes"
        value={formData.notes}
        onChange={handleChange}
        placeholder="Notes"
        className="mt-4 w-full rounded border p-3 text-gray-900"
      />

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">
          Upload Resume Optional
        </label>

        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
          className="mt-2 block w-full rounded border p-3 text-gray-900"
        />

        {resumeFile && (
          <p className="mt-2 text-sm text-gray-600">
            Selected: {resumeFile.name}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="mt-4 rounded bg-black px-5 py-3 text-white"
      >
        Add Job
      </button>
    </form>
  );
}
