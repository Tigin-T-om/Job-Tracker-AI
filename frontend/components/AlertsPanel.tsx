"use client";

import { useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { getToken } from "@/lib/auth";

type AlertItem = {
  id: string;
  type: "inactive" | "interview" | "followup";
  title: string;
  message: string;
  job_id?: number | null;
  days?: number | null;
};

type AlertsPanelProps = {
  alerts: AlertItem[];
  onRefresh: () => void;
};

export default function AlertsPanel({ alerts, onRefresh }: AlertsPanelProps) {
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");

  async function handleSendEmailDigest() {
    setEmailLoading(true);
    setEmailStatus("");

    const token = getToken();
    if (!token) {
      setEmailStatus("Please login first");
      setEmailLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/reminders/email-digest`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to send digest");
      }

      const data = await res.json();
      setEmailStatus("Digest emailed successfully!");
      alert(`Digest sent to: ${data.recipient}`);
    } catch {
      setEmailStatus("Failed to send email digest");
    } finally {
      setEmailLoading(false);
    }
  }

  if (alerts.length === 0) {
    return (
      <div className="rounded-2xl border border-white/20 bg-white/70 p-6 backdrop-blur-md shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span>🔔</span> Notifications & Alerts
        </h2>
        <p className="mt-2 text-sm text-gray-500 italic">
          All clear! No pending follow-ups, upcoming interviews, or inactive applications right now.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/20 bg-white/70 p-6 backdrop-blur-md shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            Active Alerts ({alerts.length})
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Important tasks and updates requiring your attention.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {emailStatus && (
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
              {emailStatus}
            </span>
          )}
          <button
            onClick={handleSendEmailDigest}
            disabled={emailLoading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            {emailLoading ? "Sending..." : "✉️ Email Me Digest"}
          </button>
        </div>
      </div>

      <div className="mt-4 max-h-[300px] overflow-y-auto pr-1 space-y-3">
        {alerts.map((alert) => {
          let typeColor = "border-l-blue-500 bg-blue-50/10";
          let badgeText = "📅 Interview";
          let badgeColor = "bg-blue-100 text-blue-800";

          if (alert.type === "followup") {
            typeColor = "border-l-red-500 bg-red-50/10";
            badgeText = "⚠️ Overdue";
            badgeColor = "bg-red-100 text-red-800";
          } else if (alert.type === "inactive") {
            typeColor = "border-l-amber-500 bg-amber-50/10";
            badgeText = "⌛ Inactive";
            badgeColor = "bg-amber-100 text-amber-800";
          }

          return (
            <div
              key={alert.id}
              className={`flex items-start gap-3 rounded-xl border border-gray-100 border-l-4 p-4 shadow-sm transition-all duration-200 hover:shadow-md ${typeColor}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeColor}`}>
                    {badgeText}
                  </span>
                  <strong className="text-sm font-bold text-slate-800">
                    {alert.title}
                  </strong>
                </div>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                  {alert.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
