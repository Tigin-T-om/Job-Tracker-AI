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
  file_path: string;
  created_at: string;
  applications_count: number;
  interview_count: number;
  callback_rate: number;
};

type User = {
  id: number;
  name: string;
  email: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Upload Form states
  const [resumeName, setResumeName] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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

  async function fetchProfileData() {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) return;

      // 1. Fetch user data
      const userRes = await fetch(`${API_BASE_URL}/auth/me`, { headers });
      if (userRes.status === 401) {
        handleUnauthorized();
        return;
      }

      // 2. Fetch resumes list with stats
      const resumesRes = await fetch(`${API_BASE_URL}/resumes/`, { headers });
      if (resumesRes.status === 401) {
        handleUnauthorized();
        return;
      }

      if (userRes.ok && resumesRes.ok) {
        const userData = await userRes.json();
        const resumesData = await resumesRes.json();
        setCurrentUser(userData);
        setResumes(resumesData);
        setError("");
      } else {
        setError("Failed to fetch profile and resumes details");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfileData();
  }, []);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!resumeName.trim()) {
      alert("Please enter a resume version name.");
      return;
    }
    if (!resumeFile) {
      alert("Please select a file to upload.");
      return;
    }

    const token = getToken();
    if (!token) {
      handleUnauthorized();
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("resume_name", resumeName);
      formData.append("file", resumeFile);

      // CRITICAL: We do NOT set the "Content-Type" header manually here.
      // Since we pass a FormData object as body, the browser automatically 
      // generates the multipart boundary header. Setting it manually breaks the upload!
      const res = await fetch(`${API_BASE_URL}/resumes/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      alert("Resume uploaded to repository successfully!");
      setResumeName("");
      setResumeFile(null);
      
      // Reset input files in UI
      const fileInput = document.getElementById("resume-file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // Refresh data
      fetchProfileData();
    } catch (err) {
      alert("Failed to upload resume. Make sure it's a valid PDF/Doc file.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  async function handleViewResume(resumeId: number) {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/resumes/${resumeId}/view`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        alert("Could not load resume document.");
        return;
      }

      const blob = await res.blob();
      const fileUrl = URL.createObjectURL(blob);
      window.open(fileUrl, "_blank"); // Open PDF in a new browser tab
    } catch (err) {
      console.error("Error viewing resume:", err);
    }
  }

  async function handleDeleteResume(resumeId: number) {
    const confirmed = confirm("Are you sure you want to delete this resume version? This will unlink it from any applications.");
    if (!confirmed) return;

    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/resumes/${resumeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        alert("Failed to delete resume.");
        return;
      }

      alert("Resume deleted successfully.");
      fetchProfileData();
    } catch (err) {
      console.error("Error deleting resume:", err);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <Navbar />

        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Account</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your personal profile details and your permanent Resume Repository.
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
              <p className="mt-4 text-gray-500 font-medium">Loading details...</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-red-600 shadow-sm">
            <p className="font-semibold">{error}</p>
            <button
              onClick={fetchProfileData}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Left Side: Profile Card */}
            <div className="md:col-span-1 space-y-6">
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="text-center pb-6 border-b border-gray-100">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-600 shadow-inner">
                    {currentUser?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <h2 className="mt-4 text-xl font-bold text-gray-900">{currentUser?.name}</h2>
                  <p className="text-sm text-gray-500 font-medium">{currentUser?.email}</p>
                </div>

                <div className="pt-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Account Stats</h3>
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Resumes</span>
                      <span className="font-bold text-gray-900">{resumes.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Applications</span>
                      <span className="font-bold text-gray-900">
                        {resumes.reduce((acc, curr) => acc + curr.applications_count, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Resume Repository */}
            <div className="md:col-span-2 space-y-6">
              {/* Upload Form Card */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span>📄</span> Upload New Resume Version
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Add custom tailored versions of your resume (e.g. Frontend developer, ML engineer) to track their performance separately.
                </p>

                <form onSubmit={handleUpload} className="mt-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase">Resume Name Label</label>
                      <input
                        type="text"
                        value={resumeName}
                        onChange={(e) => setResumeName(e.target.value)}
                        placeholder="e.g. Backend Developer Resume"
                        className="mt-1 w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase">Select File (.pdf, .doc, .docx)</label>
                      <input
                        id="resume-file-input"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                        className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm text-gray-900 focus:outline-none file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full sm:w-auto rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed transition duration-200"
                  >
                    {uploading ? "Uploading version..." : "Save to Repository"}
                  </button>
                </form>
              </div>

              {/* Resumes List Card */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span>📂</span> Resume Repository ({resumes.length})
                </h2>

                {resumes.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl mt-4">
                    <p className="text-gray-500 text-sm font-medium">No resumes in your repository yet.</p>
                    <p className="text-gray-400 text-xs mt-1">Upload a customized version above to get started.</p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    {resumes.map((resume) => (
                      <div
                        key={resume.id}
                        className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 hover:border-blue-100 hover:bg-blue-50/5 transition duration-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                      >
                        <div className="flex-1 min-w-0 font-sans">
                          <h3 className="text-base font-bold text-gray-900 truncate">
                            {resume.resume_name}
                          </h3>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            📎 {resume.filename}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">
                            Uploaded: {new Date(resume.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Stats Dashboard */}
                        <div className="flex items-center gap-4 border-l border-r border-gray-200/50 px-4 py-1 flex-shrink-0 font-sans">
                          <div className="text-center">
                            <span className="block text-[10px] uppercase font-bold text-gray-400">Apps</span>
                            <span className="text-sm font-bold text-gray-950">{resume.applications_count}</span>
                          </div>
                          <div className="text-center">
                            <span className="block text-[10px] uppercase font-bold text-gray-400">Interviews</span>
                            <span className="text-sm font-bold text-blue-600">{resume.interview_count}</span>
                          </div>
                          <div className="text-center">
                            <span className="block text-[10px] uppercase font-bold text-gray-400">Callback</span>
                            <span className="rounded bg-green-50 px-1.5 py-0.5 text-xs font-bold text-green-700 block">
                              {resume.callback_rate}%
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleViewResume(resume.id)}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition"
                            title="View Document"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteResume(resume.id)}
                            className="rounded-lg border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition"
                            title="Delete Version"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
