import { API_BASE_URL } from "@/lib/api";
import AddJobForm from "@/components/AddJobForm";

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

async function getJobs(): Promise<Job[]> {
  const res = await fetch(`${API_BASE_URL}/jobs/`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch jobs");
  }

  return res.json();
}

export default async function Home() {
  const jobs = await getJobs();

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-900">Job Tracker AI</h1>
        <p className="mt-2 text-gray-600">
          Track your job applications, follow-ups, and interview progress.
        </p>

        <AddJobForm />

        <section className="mt-8 rounded-xl bg-white p-6 shadow">
          <h2 className="text-xl font-semibold text-gray-900">Applications</h2>

          {jobs.length === 0 ? (
            <p className="mt-4 text-gray-500">No jobs added yet.</p>
          ) : (
            <div className="mt-4 grid gap-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {job.role}
                      </h3>
                      <p className="text-gray-600">{job.company_name}</p>
                    </div>

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                      {job.status}
                    </span>
                  </div>

                  <div className="mt-3 text-sm text-gray-600">
                    {job.location && <p>Location: {job.location}</p>}
                    {job.source && <p>Source: {job.source}</p>}
                    {job.applied_date && <p>Applied: {job.applied_date}</p>}
                    {job.follow_up_date && (
                      <p>Follow up: {job.follow_up_date}</p>
                    )}
                    {job.notes && <p className="mt-2">Notes: {job.notes}</p>}
                  </div>

                  {job.job_link && (
                    <a
                      href={job.job_link}
                      target="_blank"
                      className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline"
                    >
                      View job
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
