// ---------------------------------------------------------------------------
// interviews/page.tsx - Interviews management page
// Displays all scheduled interviews split into two columns: upcoming rounds
// and past/completed rounds. Supports cancelling/deleting entries.
// ---------------------------------------------------------------------------
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { API_BASE_URL } from "@/lib/api";
import { getToken, removeToken } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import { showToast } from "@/components/Toast";

type JobMinInfo = {
  id: number;
  company_name: string;
  role: string;
};

type Interview = {
  id: number;
  job_id: number;
  user_id: number;
  round_type: string;
  interview_date: string;
  location_type: string;
  meeting_link?: string | null;
  location?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  job?: JobMinInfo | null;
};

export default function InterviewsPage() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function handleUnauthorized() {
    removeToken();
    router.push("/login");
  }

  function getAuthHeaders() {
    const token = getToken();
    if (!token) {
      handleUnauthorized();
      return null;
    }
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  async function fetchInterviews() {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) return;

      const res = await fetch(`${API_BASE_URL}/interviews/`, { headers });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) {
        setError("Failed to load interviews");
        return;
      }

      const data = await res.json();
      setInterviews(data);
      setError("");
    } catch {
      setError("Failed to load interviews");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(interviewId: number) {
    const confirmed = confirm("Are you sure you want to cancel/delete this interview?");
    if (!confirmed) return;

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const res = await fetch(`${API_BASE_URL}/interviews/${interviewId}`, {
        method: "DELETE",
        headers,
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) {
        showToast("Failed to delete interview", "error");
        return;
      }

      // Refresh list
      fetchInterviews();
    } catch {
      showToast("Failed to delete interview", "error");
    }
  }

  useEffect(() => {
    fetchInterviews();
  }, []);

  const now = new Date();
  
  // Separate interviews into upcoming and past
  const upcomingInterviews = interviews.filter(
    (item) => new Date(item.interview_date) >= now
  );
  
  const pastInterviews = interviews.filter(
    (item) => new Date(item.interview_date) < now
  ).reverse(); // Show most recent past interview first

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <Navbar />

        <div>
          <h1 className="text-3xl font-bold text-gray-900">Interviews</h1>
          <p className="mt-2 text-gray-600">
            Track and manage scheduled interview rounds, online meetings, and notes.
          </p>
        </div>

        {loading ? (
          <div className="mt-8 flex justify-center py-6">
            <p className="text-gray-500">Loading interviews...</p>
          </div>
        ) : error ? (
          <div className="mt-8 text-center text-red-500 py-6">
            <p>{error}</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {/* Upcoming Interviews Column */}
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-green-500"></span>
                Upcoming Rounds ({upcomingInterviews.length})
              </h2>

              {upcomingInterviews.length === 0 ? (
                <p className="mt-6 text-sm text-gray-500 py-4 text-center border border-dashed border-gray-200 rounded-lg">
                  No upcoming interviews scheduled.
                </p>
              ) : (
                <div className="mt-6 space-y-4">
                  {upcomingInterviews.map((item) => (
                    <div
                      key={item.id}
                      className="group relative rounded-xl border border-blue-50 bg-gradient-to-br from-white to-blue-50/20 p-5 shadow-sm hover:shadow transition-all duration-200"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                            {item.round_type}
                          </span>
                          <h3 className="mt-2 text-lg font-bold text-gray-900">
                            {item.job?.role || "Position"}
                          </h3>
                          <p className="text-sm font-semibold text-gray-600">
                            {item.job?.company_name || "Company"}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="mt-4 space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">Time:</span>
                          <span>{new Date(item.interview_date).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">Format:</span>
                          <span className="capitalize">{item.location_type}</span>
                        </div>
                        {item.location_type === "online" && item.meeting_link && (
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-gray-900 shrink-0">Link:</span>
                            <a
                              href={item.meeting_link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline break-all font-semibold"
                            >
                              Join Meeting 🔗
                            </a>
                          </div>
                        )}
                        {item.location_type === "offline" && item.location && (
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-gray-900 shrink-0">Location:</span>
                            <span className="text-gray-700">{item.location}</span>
                          </div>
                        )}
                        {item.notes && (
                          <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 whitespace-pre-line border-l-2 border-gray-300">
                            {item.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Past Interviews Column */}
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-gray-400"></span>
                History / Past Rounds ({pastInterviews.length})
              </h2>

              {pastInterviews.length === 0 ? (
                <p className="mt-6 text-sm text-gray-500 py-4 text-center border border-dashed border-gray-200 rounded-lg">
                  No completed interviews recorded.
                </p>
              ) : (
                <div className="mt-6 space-y-4">
                  {pastInterviews.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-gray-100 bg-gray-50/50 p-5 opacity-75 hover:opacity-100 transition-opacity duration-200"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="inline-block rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                            {item.round_type}
                          </span>
                          <h3 className="mt-2 text-base font-bold text-gray-900">
                            {item.job?.role || "Position"}
                          </h3>
                          <p className="text-sm font-semibold text-gray-500">
                            {item.job?.company_name || "Company"}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-xs text-red-400 hover:text-red-600 font-medium"
                        >
                          Delete Log
                        </button>
                      </div>

                      <div className="mt-4 space-y-1.5 text-xs text-gray-500">
                        <p>
                          <span className="font-semibold text-gray-700">Date:</span>{" "}
                          {new Date(item.interview_date).toLocaleString()}
                        </p>
                        <p>
                          <span className="font-semibold text-gray-700">Type:</span>{" "}
                          <span className="capitalize">{item.location_type}</span>
                        </p>
                        {item.notes && (
                          <div className="mt-3 rounded bg-white p-2 text-xs text-gray-500 whitespace-pre-line border border-gray-100">
                            {item.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
