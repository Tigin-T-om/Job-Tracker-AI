"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { API_BASE_URL } from "@/lib/api";
import { getToken, removeToken } from "@/lib/auth";

import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import AlertsPanel from "@/components/AlertsPanel";
import DashboardCards from "@/components/DashboardCards";
import FollowUpSections from "@/components/FollowUpSections";
import Navbar from "@/components/Navbar";

type Job = {
    id: number;
    company_name: string;
    role: string;
    status: string;
    follow_up_date: string;
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

type User = {
    id: number;
    name: string;
    email: string;
};

export default function DashboardPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [overdueFollowUps, setOverdueFollowUps] = useState<Job[]>([]);
    const [todayFollowUps, setTodayFollowUps] = useState<Job[]>([]);
    const [upcomingFollowUps, setUpcomingFollowUps] = useState<Job[]>([]);
    const [upcomingInterviews, setUpcomingInterviews] = useState<any[]>([]);
    const [alerts, setAlerts] = useState<any[]>([]);
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
    async function fetchSummary() {
        try {
            const headers = getAuthHeaders();
            if (!headers) return;
            const res = await fetch(`${API_BASE_URL}/jobs/dashboard/summary`, { headers });
            if (res.status === 401) {
                handleUnauthorized();
                return;
            }
            if (!res.ok) return;
            const data = await res.json();
            setSummary(data);
        } catch (err) {
            console.error("Failed to load summary", err);
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
            if (
                overdueRes.status === 401 ||
                todayRes.status === 401 ||
                upcomingRes.status === 401
            ) {
                handleUnauthorized();
                return;
            }
            if (!overdueRes.ok || !todayRes.ok || !upcomingRes.ok) {
                return;
            }
            const overdueData = await overdueRes.json();
            const todayData = await todayRes.json();
            const upcomingData = await upcomingRes.json();
            setOverdueFollowUps(overdueData);
            setTodayFollowUps(todayData);
            setUpcomingFollowUps(upcomingData);
        } catch (err) {
            console.error("Failed to load follow-ups", err);
        }
    }
    async function fetchUpcomingInterviews() {
        try {
            const headers = getAuthHeaders();
            if (!headers) return;
            const res = await fetch(`${API_BASE_URL}/interviews/`, { headers });
            if (res.status === 401) {
                handleUnauthorized();
                return;
            }
            if (!res.ok) return;
            const data = await res.json();

            const now = new Date();
            const upcoming = data.filter(
                (item: any) => new Date(item.interview_date) >= now
            );

            setUpcomingInterviews(upcoming);
        } catch (err) {
            console.error("Failed to load upcoming interviews", err);
        }
    }

    async function fetchAlerts() {
        try {
            const headers = getAuthHeaders();
            if (!headers) return;
            const res = await fetch(`${API_BASE_URL}/reminders/alerts`, { headers });
            if (res.status === 401) {
                handleUnauthorized();
                return;
            }
            if (!res.ok) return;
            const data = await res.json();
            setAlerts(data);
        } catch (err) {
            console.error("Failed to load alerts", err);
        }
    }

    async function refreshData() {
        const token = getToken();
        if (!token) {
            handleUnauthorized();
            return;
        }
        try {
            setLoading(true);
            await Promise.all([
                fetchCurrentUser(),
                fetchSummary(),
                fetchFollowUps(),
                fetchUpcomingInterviews(),
                fetchAlerts(),
            ]);
            setError("");
        } catch (err) {
            setError("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        refreshData();
    }, []);

    return (
        <main className="min-h-screen bg-gray-100 px-6 py-8">
            <div className="mx-auto max-w-6xl">
                <Navbar />
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                        <p className="mt-2 text-gray-600">
                            Track your overall application metrics and follow-up reminders.
                        </p>
                        {currentUser && (
                            <p className="mt-2 text-sm text-gray-500">
                                Welcome back, <span className="font-semibold text-gray-700">{currentUser.name}</span> ({currentUser.email})
                            </p>
                        )}
                    </div>
                </div>
                {loading ? (
                    <div className="mt-12 flex justify-center">
                        <p className="text-gray-500">Loading dashboard metrics...</p>
                    </div>
                ) : error ? (
                    <div className="mt-12 text-center text-red-500">
                        <p>{error}</p>
                    </div>
                ) : (
                    <>
                        <div className="mb-8">
                            <AlertsPanel alerts={alerts} onRefresh={refreshData} />
                        </div>
                        {summary && <DashboardCards summary={summary} />}

                        <AnalyticsDashboard />
                        <FollowUpSections
                            overdue={overdueFollowUps}
                            today={todayFollowUps}
                            upcoming={upcomingFollowUps}
                        />

                        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <span className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                    </span>
                                    Upcoming Interviews ({upcomingInterviews.length})
                                </h2>
                                <a
                                    href="/interviews"
                                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                    View all
                                </a>
                            </div>

                            {upcomingInterviews.length === 0 ? (
                                <p className="mt-6 text-sm text-gray-500 text-center py-6 border border-dashed border-gray-100 rounded-xl">
                                    No upcoming interviews scheduled.
                                </p>
                            ) : (
                                <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                                    {upcomingInterviews.slice(0, 3).map((item) => (
                                        <div
                                            key={item.id}
                                            className="rounded-xl border border-gray-100 bg-gradient-to-br from-white to-blue-50/10 p-4 shadow-sm hover:shadow transition-all duration-200"
                                        >
                                            <div className="flex justify-between items-start gap-2">
                                                <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
                                                    {item.round_type}
                                                </span>
                                                <span className="text-xs text-gray-500 capitalize">
                                                    {item.location_type}
                                                </span>
                                            </div>
                                            <h3 className="mt-3 text-base font-bold text-gray-900 truncate">
                                                {item.job?.role}
                                            </h3>
                                            <p className="text-sm font-semibold text-gray-500 truncate">
                                                {item.job?.company_name}
                                            </p>
                                            <p className="mt-3 text-xs text-gray-600 font-medium">
                                                📅 {new Date(item.interview_date).toLocaleString()}
                                            </p>
                                            {item.location_type === "online" && item.meeting_link && (
                                                <a
                                                    href={item.meeting_link}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                                                >
                                                    Join Call 🔗
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}