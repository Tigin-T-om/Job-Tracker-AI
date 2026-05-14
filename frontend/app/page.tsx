"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import AddJobForm from "@/components/AddJobForm";
import JobCard from "@/components/JobCard";
import DashboardCards from "@/components/DashboardCards";

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
  const [jobs, setJobs] = useState<Job[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchJobs() {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/jobs/`);

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
      const res = await fetch(`${API_BASE_URL}/jobs/dashboard/summary`);

      if (!res.ok) {
        throw new Error("Failed to fetch summary");
      }

      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function refreshData() {
    await fetchJobs();
    await fetchSummary();
  }

  async function handleDelete(jobId: number) {
    const confirmed = confirm("Delete this job?");

    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete job");
      }

      setJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobId));
      fetchSummary();
    } catch {
      alert("Failed to delete job");
    }
  }

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-900">Job Tracker AI</h1>

        <p className="mt-2 text-gray-600">
          Track your job applications, follow-ups, and interview progress.
        </p>

        <AddJobForm />

        {summary && <DashboardCards summary={summary} />}

        <section className="mt-8 rounded-xl bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Applications
            </h2>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
              {jobs.length} total
            </span>
          </div>

          {loading ? (
            <p className="mt-4 text-gray-500">Loading jobs...</p>
          ) : error ? (
            <p className="mt-4 text-red-500">{error}</p>
          ) : jobs.length === 0 ? (
            <p className="mt-4 text-gray-500">No jobs added yet.</p>
          ) : (
            <div className="mt-4 grid gap-4">
              {jobs.map((job) => (
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