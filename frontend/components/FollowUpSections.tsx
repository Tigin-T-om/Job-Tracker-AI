// ---------------------------------------------------------------------------
// FollowUpSections.tsx - Follow-up tracking section component
// Renders three columns for overdue, today's, and upcoming follow-ups.
// Each column lists the relevant job applications with their details.
// ---------------------------------------------------------------------------
type Job = {
  id: number;
  company_name: string;
  role: string;
  status: string;
  follow_up_date?: string | null;
};

/** Card displaying a single follow-up job entry. */
function FollowUpCard({ job }: { job: Job }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h4 className="font-semibold text-gray-900">{job.company_name}</h4>
      <p className="text-sm text-gray-600">{job.role}</p>

      <div className="mt-2 text-sm text-gray-600">
        <p>Status: {job.status}</p>
        <p>Follow-up: {job.follow_up_date || "Not set"}</p>
      </div>
    </div>
  );
}

export default function FollowUpSections({
  overdue,
  today,
  upcoming,
}: {
  overdue: Job[];
  today: Job[];
  upcoming: Job[];
}) {
  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-3">
      <div className="rounded-xl bg-white p-5 shadow">
        <h3 className="text-lg font-semibold text-red-600">
          Overdue Follow-ups
        </h3>

        <div className="mt-4 grid gap-3">
          {overdue.length === 0 ? (
            <p className="text-sm text-gray-500">No overdue follow-ups.</p>
          ) : (
            overdue.map((job) => <FollowUpCard key={job.id} job={job} />)
          )}
        </div>
      </div>

      <div className="rounded-xl bg-white p-5 shadow">
        <h3 className="text-lg font-semibold text-purple-600">
          Today's Follow-ups
        </h3>

        <div className="mt-4 grid gap-3">
          {today.length === 0 ? (
            <p className="text-sm text-gray-500">No follow-ups today.</p>
          ) : (
            today.map((job) => <FollowUpCard key={job.id} job={job} />)
          )}
        </div>
      </div>

      <div className="rounded-xl bg-white p-5 shadow">
        <h3 className="text-lg font-semibold text-indigo-600">
          Upcoming Follow-ups
        </h3>

        <div className="mt-4 grid gap-3">
          {upcoming.length === 0 ? (
            <p className="text-sm text-gray-500">No upcoming follow-ups.</p>
          ) : (
            upcoming.map((job) => <FollowUpCard key={job.id} job={job} />)
          )}
        </div>
      </div>
    </section>
  );
}
