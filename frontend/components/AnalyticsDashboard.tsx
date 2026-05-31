"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { getToken } from "@/lib/auth";

type PlatformStat = {
  source: string;
  count: number;
  responses: number;
  interviews: number;
};

type AnalyticsData = {
  total_applications: number;
  applications_this_month: number;
  response_rate: number;
  interview_rate: number;
  offer_rate: number;
  platform_stats: PlatformStat[];
  status_stats: Record<string, number>;
};

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const token = getToken();
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/analytics/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          setError("Failed to load analytics");
        }
      } catch (err) {
        console.error("Analytics fetch error:", err);
        setError("Could not connect to server");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="mt-8 rounded-2xl bg-white border border-gray-100 p-6 shadow-sm flex items-center justify-center py-12">
        <p className="text-gray-500 text-sm animate-pulse">Calculating metrics...</p>
      </div>
    );
  }

  if (error || !data || data.total_applications === 0) {
    return null; // Return empty space if there is no data to visualize
  }

  return (
    <div className="mt-8 grid gap-6 md:grid-cols-2">
      {/* Metrics & Conversion Progress Bars */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          📊 Pipeline Conversion Rates
        </h3>
        <div className="space-y-5">
          <div>
            <div className="flex justify-between text-sm font-semibold mb-2">
              <span className="text-gray-600">Response Rate (Callbacks)</span>
              <span className="text-blue-600 font-bold">{data.response_rate}%</span>
            </div>
            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${data.response_rate}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm font-semibold mb-2">
              <span className="text-gray-600">Interview Rate</span>
              <span className="text-amber-500 font-bold">{data.interview_rate}%</span>
            </div>
            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${data.interview_rate}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm font-semibold mb-2">
              <span className="text-gray-600">Offer Success Rate</span>
              <span className="text-green-600 font-bold">{data.offer_rate}%</span>
            </div>
            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
              <div 
                className="bg-green-600 h-full rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${data.offer_rate}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Application Sources Bar Distribution */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            🚀 Top Platforms & Channels
          </h3>
          <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
            {data.platform_stats.map((p) => {
              const pct = data.total_applications > 0 ? (p.count / data.total_applications) * 100 : 0;
              return (
                <div key={p.source} className="flex items-center justify-between text-sm gap-2">
                  <div className="flex-1">
                    <span className="font-semibold text-gray-700">{p.source}</span>
                    <div className="w-full bg-gray-100 h-2 rounded mt-1 overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-full rounded transition-all duration-1000 ease-out" 
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-right whitespace-nowrap min-w-[70px]">
                    <span className="font-bold text-gray-800 text-xs">{p.count} apps</span>
                    <span className="block text-[10px] text-gray-400 font-medium">
                      {p.interviews} Int. ({p.responses} Resp.)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
