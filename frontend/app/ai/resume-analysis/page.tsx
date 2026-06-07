// ---------------------------------------------------------------------------
// ai/resume-analysis/page.tsx - AI resume analysis workspace
// Allows users to select a resume from their repository, paste a job
// description, and run an AI-powered ATS audit via Google Gemini.
// Displays scores, missing keywords, skills gaps, and interview prep questions.
// ---------------------------------------------------------------------------
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { getToken, removeToken } from "@/lib/auth";
import Navbar from "@/components/Navbar";

type Resume = {
  id: number;
  resume_name: string;
  filename: string;
};

type AnalysisResult = {
  ats_score: number;
  job_match_percentage: number;
  missing_keywords: string[];
  skills_gap: string[];
  improvements: string[];
  interview_prep: string[];
};

export default function AIResumeAnalysisPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  
  // Loading sub-status messages for interactive UI
  const [loadStatus, setLoadStatus] = useState("Extracting text from PDF...");

  function handleUnauthorized() {
    removeToken();
    router.push("/login");
  }

  useEffect(() => {
    async function loadResumes() {
      const token = getToken();
      if (!token) {
        handleUnauthorized();
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/resumes/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 401) {
          handleUnauthorized();
          return;
        }
        if (res.ok) {
          setResumes(await res.json());
        }
      } catch (err) {
        console.error("Failed to load resumes", err);
      }
    }
    loadResumes();
  }, []);

  // Update loading message sequentially during analysis
  useEffect(() => {
    if (!analyzing) return;
    const intervals = [
      setTimeout(() => setLoadStatus("Uploading document text..."), 1500),
      setTimeout(() => setLoadStatus("Matching keywords with ATS engine..."), 3500),
      setTimeout(() => setLoadStatus("Analyzing skills gap via Gemini AI..."), 5500),
      setTimeout(() => setLoadStatus("Generating tailored mock interview questions..."), 7500),
    ];
    return () => intervals.forEach(clearTimeout);
  }, [analyzing]);

  async function handleAnalyze(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedResumeId) {
      showToast("Please select a resume version first.", "warning");
      return;
    }

    const token = getToken();
    if (!token) return;

    try {
      setAnalyzing(true);
      setResult(null);
      setError("");
      setLoadStatus("Extracting text from PDF...");

      const res = await fetch(`${API_BASE_URL}/resumes/${selectedResumeId}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          job_description: jobDescription || null
        })
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!res.ok) {
        throw new Error("Analysis failed");
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError("AI analysis failed. Please verify your Gemini API key configuration and PDF format.");
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  }

  // Helper to color-code scores
  /** Map a numeric score to a colour class for visual feedback. */
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500 stroke-emerald-500 bg-emerald-50 border-emerald-100";
    if (score >= 50) return "text-amber-500 stroke-amber-500 bg-amber-50 border-amber-100";
    return "text-rose-500 stroke-rose-500 bg-rose-50 border-rose-100";
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <Navbar />

        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">AI Resume Workspace</h1>
          <p className="mt-1 text-sm text-gray-600">
            Select a resume from your repository, paste a job description, and use AI to audit your alignment.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Inputs Section */}
          <div className="lg:col-span-1">
            <form onSubmit={handleAnalyze} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>🤖</span> Analysis Setup
              </h2>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase">Select Resume Version</label>
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-900 bg-white focus:border-blue-500 focus:outline-none"
                  required
                  disabled={analyzing}
                >
                  <option value="">-- Choose Resume Version --</option>
                  {resumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.resume_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase">
                  Paste Job Description (Optional)
                </label>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Leave blank to perform a general layout and format scan.
                </p>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste details of the role here..."
                  className="mt-2 w-full h-48 rounded-lg border border-gray-200 p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  disabled={analyzing}
                />
              </div>

              <button
                type="submit"
                disabled={analyzing || resumes.length === 0}
                className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none disabled:bg-blue-300 disabled:cursor-not-allowed transition duration-200"
              >
                {analyzing ? "Auditing Resume..." : "Run AI Analysis"}
              </button>
              
              {resumes.length === 0 && (
                <p className="text-[11px] text-red-500 text-center font-medium">
                  ⚠️ Please upload a resume in the <a href="/profile" className="underline font-bold">Profile Tab</a> first.
                </p>
              )}
            </form>
          </div>

          {/* Results Output Section */}
          <div className="lg:col-span-2">
            {analyzing ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                <h3 className="mt-6 text-lg font-bold text-gray-900">AI auditor running...</h3>
                <p className="mt-2 text-sm text-gray-500 font-medium animate-pulse">{loadStatus}</p>
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center text-red-600 shadow-sm min-h-[400px] flex flex-col items-center justify-center">
                <span className="text-4xl mb-4">⚠️</span>
                <p className="font-semibold text-base">{error}</p>
                <p className="text-xs text-red-500 mt-2 max-w-md mx-auto">
                  Ensure your backend server is running and configured with a valid Google Gemini API Key in the backend `.env` file.
                </p>
              </div>
            ) : result ? (
              <div className="space-y-6">
                {/* 1. Score cards row */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* ATS Format Score */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex items-center gap-6">
                    <div className="relative h-20 w-20 flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path className="text-gray-100 stroke-current" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className={`stroke-current transition-all duration-1000 ${getScoreColor(result.ats_score).split(' ')[1]}`} strokeWidth="3" strokeDasharray={`${result.ats_score}, 100`} fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-xl font-extrabold text-gray-900">
                        {result.ats_score}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">ATS Formatting Score</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Structure, parsability, and formatting validation scan.</p>
                    </div>
                  </div>

                  {/* Job Match Score */}
                  {jobDescription ? (
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex items-center gap-6">
                      <div className="relative h-20 w-20 flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path className="text-gray-100 stroke-current" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <path className={`stroke-current transition-all duration-1000 ${getScoreColor(result.job_match_percentage).split(' ')[1]}`} strokeWidth="3" strokeDasharray={`${result.job_match_percentage}, 100`} fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-xl font-extrabold text-gray-900">
                          {result.job_match_percentage}%
                        </div>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900">Job Description Match</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Semantic relevance between your background and the target role.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-6 flex flex-col justify-center text-center">
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">No Job Description Provided</p>
                      <p className="text-[10px] text-gray-400 mt-1 max-w-[200px] mx-auto">Paste a description in the setup panel to compute your match score.</p>
                    </div>
                  )}
                </div>

                {/* 2. Missing Keywords */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm font-sans">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <span>🏷️</span> Missing Keywords
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Add these terms to your experience statements to improve parsing match rates.</p>
                  
                  {result.missing_keywords.length === 0 ? (
                    <p className="text-xs text-green-600 mt-3 font-semibold">✨ Brilliant! No missing keywords detected.</p>
                  ) : (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {result.missing_keywords.map((word, idx) => (
                        <span key={idx} className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 border border-rose-100/50">
                          {word}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Skills Gaps & Improvements (2 cols) */}
                <div className="grid gap-6 md:grid-cols-2 font-sans">
                  {/* Skills Gaps */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-3">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <span>📉</span> Identified Gaps
                    </h3>
                    <ul className="space-y-2.5">
                      {result.skills_gap.map((gap, idx) => (
                        <li key={idx} className="text-xs text-gray-600 leading-relaxed pl-3 border-l-2 border-amber-400">
                          {gap}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Formatting Improvements */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-3">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <span>💡</span> Actionable Edits
                    </h3>
                    <ul className="space-y-2.5">
                      {result.improvements.map((improvement, idx) => (
                        <li key={idx} className="text-xs text-gray-600 leading-relaxed pl-3 border-l-2 border-blue-400">
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 4. Custom Practice Interview Prep */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4 font-sans">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <span>🎙️</span> Practice Interview Questions
                  </h3>
                  <p className="text-xs text-gray-500">Practice answering these tailored questions created specifically for your profile vs this role.</p>

                  <div className="space-y-3">
                    {result.interview_prep.map((question, idx) => (
                      <div key={idx} className="rounded-xl border border-gray-100 bg-slate-50/50 p-4">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Question {idx + 1}</p>
                        <p className="mt-1 text-sm font-semibold text-gray-800 leading-relaxed">{question}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
                <span className="text-5xl mb-4">🩺</span>
                <h3 className="text-lg font-bold text-gray-700">AI Resume Audit Board</h3>
                <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
                  Select a resume version from the left panel and click <b>"Run AI Analysis"</b> to initialize.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
