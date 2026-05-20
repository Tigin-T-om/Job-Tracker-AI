"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { API_BASE_URL } from "@/lib/api";
import { getToken } from "@/lib/auth";

import AddJobForm from "@/components/AddJobForm";
import JobCard from "@/components/JobCard";
import DashboardCards from "@/components/DashboardCards";
import FollowUpSections from "@/components/FollowUpSections";

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

type DashboardSummary = {
  total_jobs: number;
  applied: number;
  no_response: number;
  callback_received: number;
  aptitude_test: number;
  technical_interview: number;
  hr_interview: number;
  final_interview: number;
  offer_received: number;
  rejected: number;
  overdue_follow_ups: number;
  today_follow_ups: number;
  upcoming_follow_ups: number;
};

export default function Home() {
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const [overdueFollowUps, setOverdueFollowUps] = useState<Job[]>([]);
  const [todayFollowUps, setTodayFollowUps] = useState<Job[]>([]);
  const [upcomingFollowUps, setUpcomingFollowUps] = useState<Job[]>([]);

  function getAuthHeaders() {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return null;
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  }

  async function fetchJobs() {
    try {
      setLoading(true);

      const headers = getAuthHeaders();
      if (!headers) return;

      const res = await fetch(`${API_BASE_URL}/jobs/`, {
        headers,
      });

      if (!res.ok) {
        throw new Error("Failed to fetch jobs");
      }

      const data = await res.json();
      setJobs(data);
    } catch {
      setError("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }

  async function fetchSummary() {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const res = await fetch(`${API_BASE_URL}/jobs/dashboard/summary`, {
        headers,
      });

      if (!res.ok) {
        throw new Error("Failed to fetch summary");
      }

      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchFollowUps() {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const [overdueRes, todayRes, upcomingRes] = await Promise.all([
        fetch(`${API_BASE_URL}/jobs/follow-ups/overdue`, { headers }),
        fetch(`${API_BASE_URL}/jobs/follow-ups/today`, { headers }),
        fetch(`${API_BASE_URL}/jobs/follow-ups/upcoming`, { headers }),
      ]);

      if (!overdueRes.ok || !todayRes.ok || !upcomingRes.ok) {
        throw new Error("Failed to fetch follow-ups");
      }

      const overdueData = await overdueRes.json();
      const todayData = await todayRes.json();
      const upcomingData = await upcomingRes.json();

      setOverdueFollowUps(overdueData);
      setTodayFollowUps(todayData);
      setUpcomingFollowUps(upcomingData);
    } catch (err) {
      console.error(err);
    }
  }

  async function refreshData() {
    await fetchJobs();
    await fetchSummary();
    await fetchFollowUps();
  }

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

      if (!res.ok) {
        throw new Error("Failed to delete job");
      }

      await refreshData();
    } catch {
      alert("Failed to delete job");
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

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || job.status === statusFilter;

    const matchesType =
      typeFilter === "All" ||
      (typeFilter === "Active" && activeStatuses.includes(job.status)) ||
      (typeFilter === "Finished" && finishedStatuses.includes(job.status));

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-900">Job Tracker AI</h1>

        <p className="mt-2 text-gray-600">
          Track your job applications, follow-ups, and interview progress.
        </p>

        <AddJobForm />

        {summary && <DashboardCards summary={summary} />}

        <FollowUpSections
          overdue={overdueFollowUps}
          today={todayFollowUps}
          upcoming={upcomingFollowUps}
        />

        <section className="mt-8 rounded-xl bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Applications
            </h2>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
              {filteredJobs.length} shown / {jobs.length} total
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search company or role..."
              className="rounded border p-3 text-gray-900"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded border p-3 text-gray-900"
            >
              <option>All</option>
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
              className="rounded border p-3 text-gray-900"
            >
              <option>All</option>
              <option>Active</option>
              <option>Finished</option>
            </select>
          </div>

          {loading ? (
            <p className="mt-4 text-gray-500">Loading jobs...</p>
          ) : error ? (
            <p className="mt-4 text-red-500">{error}</p>
          ) : filteredJobs.length === 0 ? (
            <p className="mt-4 text-gray-500">
              No matching jobs found. Try changing your search or filters.
            </p>
          ) : (
            <div className="mt-4 grid gap-4">
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