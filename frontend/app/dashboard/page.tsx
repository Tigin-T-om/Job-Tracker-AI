"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { API_BASE_URL } from "@/lib/api";
import { getToken, removeToken } from "@/lib/auth";

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
                        {summary && <DashboardCards summary={summary} />}
                        <FollowUpSections
                            overdue={overdueFollowUps}
                            today={todayFollowUps}
                            upcoming={upcomingFollowUps}
                        />
                    </>
                )}
            </div>
        </main>
    );
}