// ---------------------------------------------------------------------------
// jobs/page.tsx - Job applications listing page
// Displays all job applications in a filterable, searchable pipeline view.
// Supports filtering by status, type (active/closed), and text search.
// ---------------------------------------------------------------------------
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { API_BASE_URL } from "@/lib/api";
import { getToken, removeToken } from "@/lib/auth";
import { showToast } from "@/components/Toast";


import JobCard from "@/components/JobCard";
import Navbar from "@/components/Navbar";

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
  resume_filename?: string | null;
  resume_file_path?: string | null;
};

type User = {
  id: number;
  name: string;
  email: string;
};

export default function JobsPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

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

  async function fetchCurrentUser() {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const res = await fetch(`${API_BASE_URL}/auth/me`, { headers });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) return;

      const data = await res.json();
      setCurrentUser(data);
    } catch {
      handleUnauthorized();
    }
  }

  async function fetchJobs() {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) return;

      const res = await fetch(`${API_BASE_URL}/jobs/`, { headers });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) {
        setError("Failed to load jobs");
        return;
      }

      const data = await res.json();
      setJobs(data);
      setError("");
    } catch {
      setError("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }

  /** Reload both user profile and jobs data simultaneously. */
  async function refreshData() {
    const token = getToken();
    if (!token) {
      handleUnauthorized();
      return;
    }

    try {
      await Promise.all([
        fetchCurrentUser(),
        fetchJobs(),
      ]);
    } catch (err) {
      setError("Failed to refresh application data");
    }
  }

  /** Delete a job application with user confirmation. */
  async function handleDelete(jobId: number) {
    const confirmed = confirm("Delete this job?");
    if (!confirmed) return;

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
        method: "DELETE",
        headers,
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) {
        showToast("Failed to delete job", "error");
        return;
      }

      await refreshData();
    } catch {
      showToast("Failed to delete job", "error");
    }
  }

  useEffect(() => {
    refreshData();
  }, []);

  const activeStatuses = [
    "Applied",
    "No Response",
    "Callback Received",
    "Aptitude Test",
    "Technical Interview",
    "HR Interview",
    "Final Interview",
  ];

  const finishedStatuses = ["Offer Received", "Rejected"];

  // Apply search and filter criteria to the jobs list
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "All" || job.status === statusFilter;

    const matchesType =
      typeFilter === "All" ||
      (typeFilter === "Active" && activeStatuses.includes(job.status)) ||
      (typeFilter === "Finished" && finishedStatuses.includes(job.status));

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <Navbar />

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
            <p className="mt-2 text-gray-600">
              Manage your job search pipeline and track your status for each submission.
            </p>
            {currentUser && (
              <p className="mt-2 text-sm text-gray-500">
                Logged in as <span className="font-semibold text-gray-700">{currentUser.name}</span> ({currentUser.email})
              </p>
            )}
          </div>
        </div>

        <section className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              My Pipeline
            </h2>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
              {filteredJobs.length} shown / {jobs.length} total
            </span>
          </div>

          {/* Filters Panel */}
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search company or role..."
              className="rounded-lg border border-gray-200 p-3 text-gray-900 focus:border-blue-500 focus:outline-none"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-200 p-3 text-gray-900 focus:border-blue-500 focus:outline-none bg-white"
            >
              <option value="All">All Statuses</option>
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

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-gray-200 p-3 text-gray-900 focus:border-blue-500 focus:outline-none bg-white"
            >
              <option value="All">All Types</option>
              <option value="Active">Active Pipeline</option>
              <option value="Finished">Closed Applications</option>
            </select>
          </div>

          {loading ? (
            <div className="mt-8 flex justify-center py-6">
              <p className="text-gray-500">Loading jobs...</p>
            </div>
          ) : error ? (
            <div className="mt-8 text-center text-red-500 py-6">
              <p>{error}</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="mt-8 text-center py-8">
              <p className="text-gray-500">
                No matching applications found. Try changing your search or filters.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onDelete={handleDelete}
                  onUpdated={refreshData}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
