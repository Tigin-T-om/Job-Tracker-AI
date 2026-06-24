// ---------------------------------------------------------------------------
// File: ai/cover-letter/page.tsx
// Description: AI Cover Letter Workspace. Retrieves uploaded resumes and takes a
//              job description input to generate a tailored cover letter using the
//              Gemini API, with copy, TXT export, and print/PDF options.
// ---------------------------------------------------------------------------

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { getToken, removeToken } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import { showToast } from "@/components/Toast";

// Represents an uploaded resume entry from the database
type Resume = {
  id: number;
  resume_name: string;
  filename: string;
};

/**
 * AICoverLetterPage component.
 * Manages selecting a resume version, pasting a target job description,
 * requesting an AI-generated cover letter, and exporting the results.
 */
export default function AICoverLetterPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [error, setError] = useState("");
  
  // Rotating status message displayed while generating cover letter to enhance UX
  const [loadStatus, setLoadStatus] = useState("Extracting text from PDF...");

  /**
   * Clears local authentication state and routes user back to login screen
   */
  function handleUnauthorized() {
    removeToken();
    router.push("/login");
  }

  // Load available resumes on component mount
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

  // Update visual loading messages sequentially to display generation progress
  useEffect(() => {
    if (!generating) return;
    const intervals = [
      setTimeout(() => setLoadStatus("Extracting text from PDF resume..."), 1500),
      setTimeout(() => setLoadStatus("Analyzing resume vs. job requirements..."), 3500),
      setTimeout(() => setLoadStatus("Writing tailored cover letter introduction..."), 6000),
      setTimeout(() => setLoadStatus("Synthesizing professional accomplishments..."), 9000),
      setTimeout(() => setLoadStatus("Finalizing letter structure and layout..."), 12000),
    ];
    return () => intervals.forEach(clearTimeout);
  }, [generating]);

  /**
   * Submits selected resume ID and target job description to backend for cover letter generation
   */
  async function handleGenerate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedResumeId) {
      showToast("Please select a resume version first.", "warning");
      return;
    }
    if (!jobDescription.trim()) {
      showToast("Please paste a job description first.", "warning");
      return;
    }

    const token = getToken();
    if (!token) return;

    try {
      setGenerating(true);
      setCoverLetter("");
      setError("");
      setLoadStatus("Reading PDF document...");

      const res = await fetch(`${API_BASE_URL}/ai/cover-letter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resume_id: parseInt(selectedResumeId),
          job_description: jobDescription,
        })
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to generate cover letter");
      }

      const data = await res.json();
      setCoverLetter(data.cover_letter);
    } catch (err) {
      setError("AI generation failed. Please verify your Gemini API key configuration and backend server connection.");
      console.error(err);
    } finally {
      setGenerating(false);
    }
  }

  /**
   * Copies the generated cover letter text to the user's system clipboard
   */
  function handleCopy() {
    if (!coverLetter) return;
    navigator.clipboard.writeText(coverLetter);
    showToast("Cover letter copied to clipboard!", "success");
  }

  /**
   * Triggers browser download of the cover letter text as a plain text (.txt) file
   */
  function handleDownloadTxt() {
    if (!coverLetter) return;
    const element = document.createElement("a");
    const file = new Blob([coverLetter], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = "Cover_Letter.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  /**
   * Opens a printable window populated with formatted cover letter text to save as PDF or print
   */
  function handlePrintPdf() {
    if (!coverLetter) return;
    const printWindow = window.open('about:blank', '_blank', 'width=800,height=600');
    if (!printWindow) {
      showToast("Popup blocked! Please allow popups for PDF download.", "warning");
      return;
    }
    
    // Convert text newlines into HTML line breaks and escape HTML brackets
    const escapedContent = coverLetter
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");

    printWindow.document.write(`
      <html>
        <head>
          <title>Cover Letter</title>
          <style>
            body {
              font-family: 'Georgia', 'Times New Roman', serif;
              line-height: 1.6;
              padding: 40px;
              color: #1a1a1a;
              font-size: 11pt;
              margin: 0;
            }
            .content {
              max-width: 800px;
              margin: 0 auto;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="content">${escapedContent}</div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <Navbar />

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            🤖 AI Cover Letter Workspace
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Select a resume version, paste a job description, and use Gemini to generate a highly tailored, professional Cover Letter.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Inputs Section */}
          <div className="lg:col-span-1">
            <form onSubmit={handleGenerate} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>⚡</span> Generation Setup
              </h2>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase">Select Resume Version</label>
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-900 bg-white focus:border-blue-500 focus:outline-none"
                  required
                  disabled={generating}
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
                  Paste Target Job Description
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste details of the role here to customize your letter..."
                  className="mt-2 w-full h-64 rounded-lg border border-gray-200 p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  required
                  disabled={generating}
                />
              </div>

              <button
                type="submit"
                disabled={generating || resumes.length === 0}
                className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none disabled:bg-blue-300 disabled:cursor-not-allowed transition duration-200 cursor-pointer"
              >
                {generating ? "Generating letter..." : "Generate Cover Letter"}
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
            {generating ? (
              <div className="flex min-h-[500px] flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                <h3 className="mt-6 text-lg font-bold text-gray-900">AI writer working...</h3>
                <p className="mt-2 text-sm text-gray-500 font-medium animate-pulse">{loadStatus}</p>
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center text-red-600 shadow-sm min-h-[500px] flex flex-col items-center justify-center">
                <span className="text-4xl mb-4">⚠️</span>
                <p className="font-semibold text-base">{error}</p>
                <p className="text-xs text-red-500 mt-2 max-w-md mx-auto">
                  Ensure your backend server is running and configured with a valid Google Gemini API Key in the backend `.env` file.
                </p>
              </div>
            ) : coverLetter ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col min-h-[500px]">
                {/* Actions Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <span>✍️</span> Tailored Cover Letter
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">Feel free to edit the text directly in the box below.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleCopy}
                      className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 border border-gray-200 transition duration-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>📋</span> Copy
                    </button>
                    <button
                      onClick={handleDownloadTxt}
                      className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 border border-blue-100 transition duration-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>📄</span> Download .txt
                    </button>
                    <button
                      onClick={handlePrintPdf}
                      className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 border border-indigo-100 transition duration-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>🖨️</span> PDF / Print
                    </button>
                  </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 mt-4">
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    className="w-full min-h-[500px] h-[550px] p-6 rounded-xl border border-gray-100 bg-slate-50/50 text-gray-800 font-serif leading-relaxed text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all resize-y"
                    placeholder="Edit your cover letter here..."
                  />
                </div>
              </div>
            ) : (
              <div className="flex min-h-[500px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
                <span className="text-5xl mb-4">✍️</span>
                <h3 className="text-lg font-bold text-gray-700">AI Cover Letter Board</h3>
                <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
                  Select a resume version, paste the target job description on the left panel, and click <b>"Generate Cover Letter"</b> to initialize.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
