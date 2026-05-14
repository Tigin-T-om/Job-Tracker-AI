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

function Card({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`rounded-xl p-5 text-white shadow ${color}`}>
      <p className="text-sm font-medium opacity-90">{title}</p>

      <h3 className="mt-2 text-3xl font-bold">{value}</h3>
    </div>
  );
}

export default function DashboardCards({
  summary,
}: {
  summary: DashboardSummary;
}) {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card
        title="Total Jobs"
        value={summary.total_jobs}
        color="bg-gray-900"
      />

      <Card
        title="Applied"
        value={summary.applied}
        color="bg-blue-600"
      />

      <Card
        title="Offers"
        value={summary.offer_received}
        color="bg-green-600"
      />

      <Card
        title="Rejected"
        value={summary.rejected}
        color="bg-red-600"
      />

      <Card
        title="Overdue Follow-ups"
        value={summary.overdue_follow_ups}
        color="bg-orange-600"
      />

      <Card
        title="Today's Follow-ups"
        value={summary.today_follow_ups}
        color="bg-purple-600"
      />

      <Card
        title="Upcoming Follow-ups"
        value={summary.upcoming_follow_ups}
        color="bg-indigo-600"
      />

      <Card
        title="Interview Stages"
        value={
          summary.aptitude_test +
          summary.technical_interview +
          summary.hr_interview +
          summary.final_interview
        }
        color="bg-pink-600"
      />
    </div>
  );
}