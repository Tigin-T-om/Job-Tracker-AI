"use client";

import { useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { getToken } from "@/lib/auth";

type ScheduleInterviewModalProps = {
  jobId: number;
  companyName: string;
  role: string;
  onClose: () => void;
  onScheduled: () => void;
};

export default function ScheduleInterviewModal({
  jobId,
  companyName,
  role,
  onClose,
  onScheduled,
}: ScheduleInterviewModalProps) {
  const [formData, setFormData] = useState({
    round_type: "Technical Interview",
    interview_date: "",
    location_type: "online",
    meeting_link: "",
    location: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const token = getToken();
    if (!token) {
      setError("Please login first");
      setLoading(false);
      return;
    }

    if (!formData.interview_date) {
      setError("Please select a date and time");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/interviews/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          job_id: jobId,
          round_type: formData.round_type,
          interview_date: new Date(formData.interview_date).toISOString(),
          location_type: formData.location_type,
          meeting_link: formData.location_type === "online" ? formData.meeting_link : null,
          location: formData.location_type === "offline" ? formData.location : null,
          notes: formData.notes || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to schedule interview");
      }

      alert("Interview scheduled successfully!");
      onScheduled();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md scale-100 rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl transition-all duration-300">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Schedule Interview</h3>
            <p className="text-xs text-gray-500 mt-1">
              For {role} at <span className="font-semibold">{companyName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Round Type
            </label>
            <select
              name="round_type"
              value={formData.round_type}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-200 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none bg-white"
            >
              <option>Phone Screen</option>
              <option>Aptitude Test</option>
              <option>Technical Interview</option>
              <option>HR Interview</option>
              <option>Final Interview</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Date & Time
            </label>
            <input
              type="datetime-local"
              name="interview_date"
              value={formData.interview_date}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-200 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Location Type
            </label>
            <select
              name="location_type"
              value={formData.location_type}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-200 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none bg-white"
            >
              <option value="online">Online (Video Call)</option>
              <option value="offline">Offline (In-Person)</option>
            </select>
          </div>

          {formData.location_type === "online" ? (
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Meeting Link
              </label>
              <input
                type="url"
                name="meeting_link"
                placeholder="https://meet.google.com/..."
                value={formData.meeting_link}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Location Address
              </label>
              <input
                type="text"
                name="location"
                placeholder="Office address, floor, etc."
                value={formData.location}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              placeholder="Preparation topics, panel names, reminders..."
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg border border-gray-200 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Scheduling..." : "Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
