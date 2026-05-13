"use client";

import { useState } from "react";
import { API_BASE_URL } from "@/lib/api";

type Job = {
  id: number;
  company_name: string;
  role: string;
  job_link?: string | null;
  location?: string | null;
  source?: string | null;
  status: string;
  applied_date?: string | null;
  follow_up_date?: string | null;
  notes?: string | null;
};

function getStatusClass(status: string) {
  switch (status) {
    case "Applied":
      return "bg-blue-100 text-blue-700";
    case "No Response":
      return "bg-gray-100 text-gray-700";
    case "Callback Received":
      return "bg-purple-100 text-purple-700";
    case "Aptitude Test":
      return "bg-yellow-100 text-yellow-700";
    case "Technical Interview":
      return "bg-orange-100 text-orange-700";
    case "HR Interview":
      return "bg-pink-100 text-pink-700";
    case "Final Interview":
      return "bg-indigo-100 text-indigo-700";
    case "Offer Received":
      return "bg-green-100 text-green-700";
    case "Rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function JobCard({
  job,
  onDelete,
  onUpdated,
}: {
  job: Job;
  onDelete: (id: number) => void;
  onUpdated: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    company_name: job.company_name,
    role: job.role,
    job_link: job.job_link || "",
    location: job.location || "",
    source: job.source || "",
    status: job.status,
    applied_date: job.applied_date || "",
    follow_up_date: job.follow_up_date || "",
    notes: job.notes || "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const res = await fetch(`${API_BASE_URL}/jobs/${job.id}`, {
      method: "PUT",
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
      alert("Failed to update job");
      return;
    }

    setIsEditing(false);
    onUpdated();
  }

  if (isEditing) {
    return (
      <form
        onSubmit={handleUpdate}
        className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-gray-900">Edit Job</h3>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input
            name="company_name"
            value={formData.company_name}
            onChange={handleChange}
            required
            className="rounded border p-3 text-gray-900"
          />

          <input
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            className="rounded border p-3 text-gray-900"
          />

          <input
            name="job_link"
            value={formData.job_link}
            onChange={handleChange}
            className="rounded border p-3 text-gray-900"
          />

          <input
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="rounded border p-3 text-gray-900"
          />

          <input
            name="source"
            value={formData.source}
            onChange={handleChange}
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

          <input
            type="date"
            name="applied_date"
            value={formData.applied_date}
            onChange={handleChange}
            className="rounded border p-3 text-gray-900"
          />

          <input
            type="date"
            name="follow_up_date"
            value={formData.follow_up_date}
            onChange={handleChange}
            className="rounded border p-3 text-gray-900"
          />
        </div>

        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          className="mt-4 w-full rounded border p-3 text-gray-900"
        />

        <div className="mt-4 flex gap-3">
          <button type="submit" className="rounded bg-black px-4 py-2 text-white">
            Save
          </button>

          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="rounded border px-4 py-2 text-gray-700"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{job.role}</h3>
          <p className="mt-1 text-sm text-gray-600">{job.company_name}</p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
            job.status
          )}`}
        >
          {job.status}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-gray-600 md:grid-cols-2">
        {job.location && <p><span className="font-medium">Location:</span> {job.location}</p>}
        {job.source && <p><span className="font-medium">Source:</span> {job.source}</p>}
        {job.applied_date && <p><span className="font-medium">Applied:</span> {job.applied_date}</p>}
        {job.follow_up_date && <p><span className="font-medium">Follow up:</span> {job.follow_up_date}</p>}
      </div>

      {job.notes && (
        <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
          {job.notes}
        </p>
      )}

      <div className="mt-4 flex gap-3">
        {job.job_link && (
          <a
            href={job.job_link}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            View job
          </a>
        )}

        <button
          onClick={() => setIsEditing(true)}
          className="text-sm font-medium text-gray-700 hover:underline"
        >
          Edit
        </button>

        <button
          onClick={() => onDelete(job.id)}
          className="text-sm font-medium text-red-600 hover:underline"
        >
          Delete
        </button>
      </div>
    </div>
  );
}