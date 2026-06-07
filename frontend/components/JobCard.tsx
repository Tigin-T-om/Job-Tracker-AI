// ---------------------------------------------------------------------------
// JobCard.tsx - Single job application card component
// Renders a job entry with its details, status badge, and action buttons.
// Supports inline editing, status history viewing, interview scheduling,
// and resume viewing/downloading.
// ---------------------------------------------------------------------------
"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { showToast } from "@/components/Toast";


import ScheduleInterviewModal from "./ScheduleInterviewModal";

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
  resume_filename?: string | null;
  resume_file_path?: string | null;
  resume_id?: number | null;
  resume_name?: string | null;
};

type StatusHistory = {
  id: number;
  job_id: number;
  old_status: string;
  new_status: string;
  changed_at: string;
};

/** Returns a Tailwind CSS class string for the status badge colour. */
function getStatusClass(status: string) {
  switch (status) {
    case "Applied":
      return "bg-blue-100 text-blue-700";
    case "No Response":
      return "bg-gray-100 text-gray-700";
    case "Callback Received":
      return "bg-purple-100 text-purple-700";
    case "Aptitude Test":
      return "bg-yellow-100 text-yellow-700";
    case "Technical Interview":
      return "bg-orange-100 text-orange-700";
    case "HR Interview":
      return "bg-pink-100 text-pink-700";
    case "Final Interview":
      return "bg-indigo-100 text-indigo-700";
    case "Offer Received":
      return "bg-green-100 text-green-700";
    case "Rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function JobCard({
  job,
  onDelete,
  onUpdated,
}: {
  job: Job;
  onDelete: (id: number) => void;
  onUpdated: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);

  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showInterviews, setShowInterviews] = useState(false);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [interviewsLoading, setInterviewsLoading] = useState(false);

  const [resumes, setResumes] = useState<any[]>([]);
  const [isUploadingNew, setIsUploadingNew] = useState(false);
  const [newResumeFile, setNewResumeFile] = useState<File | null>(null);
  const [newResumeName, setNewResumeName] = useState("");
  const [formData, setFormData] = useState({
    company_name: job.company_name,
    role: job.role,
    job_link: job.job_link || "",
    location: job.location || "",
    source: job.source || "",
    status: job.status,
    applied_date: job.applied_date || "",
    follow_up_date: job.follow_up_date || "",
    notes: job.notes || "",
    resume_id: job.resume_id ? String(job.resume_id) : "", // <-- Add this to formData
  });
  // Load resumes when entering Edit Mode
  useEffect(() => {
    if (isEditing) {
      async function loadResumes() {
        const token = getToken();
        if (!token) return;
        try {
          const res = await fetch(`${API_BASE_URL}/resumes/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (res.ok) {
            setResumes(await res.json());
          }
        } catch (err) {
          console.error("Failed to load resumes repository", err);
        }
      }
      loadResumes();
    }
  }, [isEditing]);


  /** Update form state when any input changes. */
  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

    /** Submit the edited job data to the backend. */
  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const token = getToken();
    if (!token) {
      showToast("Please login first", "warning");
      return;
    }

    let resumeIdToLink: number | null = formData.resume_id ? parseInt(formData.resume_id) : null;

    // Upload new resume to repository if chosen
    if (isUploadingNew && newResumeFile && newResumeName) {
      try {
        const resumeData = new FormData();
        resumeData.append("resume_name", newResumeName);
        resumeData.append("file", newResumeFile);

        const uploadRes = await fetch(`${API_BASE_URL}/resumes/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: resumeData,
        });

        if (uploadRes.ok) {
          const uploadResult = await uploadRes.json();
          resumeIdToLink = uploadResult.id;
        } else {
          showToast("Failed to upload resume. Saving job without changing resume link.", "error");
        }
      } catch (err) {
        console.error(err);
      }
    }

    // We PUT the update, sending resume_id
    const res = await fetch(`${API_BASE_URL}/jobs/${job.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        company_name: formData.company_name,
        role: formData.role,
        job_link: formData.job_link || null,
        location: formData.location || null,
        source: formData.source || null,
        status: formData.status,
        applied_date: formData.applied_date || null,
        follow_up_date: formData.follow_up_date || null,
        notes: formData.notes || null,
        resume_id: resumeIdToLink,
      }),
    });

    if (!res.ok) {
      showToast("Failed to update job", "error");
      return;
    }

    setIsEditing(false);
    setIsUploadingNew(false);
    setNewResumeName("");
    setNewResumeFile(null);
    onUpdated();
  }

  /** Toggle the status change history panel. */
  async function handleToggleHistory() {
    if (showHistory) {
      setShowHistory(false);
      return;
    }

    const token = getToken();

    if (!token) {
      showToast("Please login first", "warning");
      return;
    }

    try {
      setHistoryLoading(true);

      const res = await fetch(`${API_BASE_URL}/jobs/${job.id}/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch history");
      }

      const data = await res.json();

      setHistory(data);
      setShowHistory(true);
    } catch {
      showToast("Failed to load status history", "error");
    } finally {
      setHistoryLoading(false);
    }
  }

  /** Toggle the interviews panel for this job. */
  async function handleToggleInterviews() {
    if (showInterviews) {
      setShowInterviews(false);
      return;
    }

    const token = getToken();
    if (!token) {
      showToast("Please login first", "warning");
      return;
    }

    try {
      setInterviewsLoading(true);
      const res = await fetch(`${API_BASE_URL}/interviews/job/${job.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch interviews");
      }

      const data = await res.json();
      setInterviews(data);
      setShowInterviews(true);
    } catch {
      showToast("Failed to load interviews", "error");
    } finally {
      setInterviewsLoading(false);
    }
  }

  /** Delete a specific interview entry. */
  async function handleDeleteInterview(interviewId: number) {
    const confirmed = confirm("Cancel/Delete this interview?");
    if (!confirmed) return;

    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/interviews/${interviewId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error();

      setInterviews(interviews.filter(item => item.id !== interviewId));
      showToast("Interview deleted/cancelled", "success");
    } catch {
      showToast("Failed to delete interview", "error");
    }
  }

    /** Open the linked resume in a new browser tab. */
  async function handleViewResume() {
    const token = getToken();
    if (!token) {
      showToast("Please login first", "warning");
      return;
    }

    // Check if linked from repo or legacy
    const url = job.resume_id
      ? `${API_BASE_URL}/resumes/${job.resume_id}/view`
      : `${API_BASE_URL}/jobs/${job.id}/resume/view`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      showToast("Failed to open resume", "error");
      return;
    }

    const blob = await res.blob();
    const fileUrl = URL.createObjectURL(blob);
    window.open(fileUrl, "_blank");
  }

  /** Download the linked resume as a file. */
  async function handleDownloadResume() {
    const token = getToken();
    if (!token) {
      showToast("Please login first", "warning");
      return;
    }

    const url = job.resume_id
      ? `${API_BASE_URL}/resumes/${job.resume_id}/view`
      : `${API_BASE_URL}/jobs/${job.id}/resume/download`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      showToast("Failed to download resume", "error");
      return;
    }

    const blob = await res.blob();
    const fileUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = job.resume_name || job.resume_filename || "resume";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(fileUrl);
  }


  if (isEditing) {
    return (
      <form
        onSubmit={handleUpdate}
        className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-gray-900">Edit Job</h3>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input
            name="company_name"
            value={formData.company_name}
            onChange={handleChange}
            placeholder="Company Name"
            required
            className="rounded border p-3 text-gray-900"
          />

          <input
            name="role"
            value={formData.role}
            onChange={handleChange}
            placeholder="Role / Position"
            required
            className="rounded border p-3 text-gray-900"
          />

          <input
            name="job_link"
            value={formData.job_link}
            onChange={handleChange}
            placeholder="Job Link (URL)"
            className="rounded border p-3 text-gray-900"
          />

          <input
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Location"
            className="rounded border p-3 text-gray-900"
          />

          <input
            name="source"
            value={formData.source}
            onChange={handleChange}
            placeholder="Source (LinkedIn, Indeed, etc.)"
            className="rounded border p-3 text-gray-900"
          />

          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="rounded border p-3 text-gray-900"
          >
            <option>Applied</option>
            <option>No Response</option>
            <option>Callback Received</option>
            <option>Aptitude Test</option>
            <option>Technical Interview</option>
            <option>HR Interview</option>
            <option>Final Interview</option>
            <option>Offer Received</option>
            <option>Rejected</option>
          </select>

          <input
            type="date"
            name="applied_date"
            value={formData.applied_date}
            onChange={handleChange}
            placeholder="Applied Date"
            className="rounded border p-3 text-gray-900"
          />

          <input
            type="date"
            name="follow_up_date"
            value={formData.follow_up_date}
            onChange={handleChange}
            placeholder="Follow-up Date"
            className="rounded border p-3 text-gray-900"
          />
        </div>

        <div className="md:col-span-2 border-t border-gray-100 pt-3">
          <label className="block text-xs font-semibold text-gray-700">
            Linked Resume Version
          </label>
          <select
            name="resume_id"
            value={isUploadingNew ? "upload-new" : formData.resume_id}
            onChange={(e) => {
              if (e.target.value === "upload-new") {
                setIsUploadingNew(true);
                setFormData({ ...formData, resume_id: "" });
              } else {
                setIsUploadingNew(false);
                setFormData({ ...formData, resume_id: e.target.value });
              }
            }}
            className="mt-1 block w-full rounded border p-3 text-gray-900 bg-white"
          >
            <option value="">No Resume Linked</option>
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.resume_name} ({r.filename})
              </option>
            ))}
            <option value="upload-new">+ Upload New Resume version</option>
          </select>
          {isUploadingNew && (
            <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-200 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500">Label</label>
                <input
                  type="text"
                  value={newResumeName}
                  onChange={(e) => setNewResumeName(e.target.value)}
                  placeholder="e.g. Google Resume v3"
                  className="mt-1 w-full rounded border p-2 text-sm text-gray-900 bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500">File</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setNewResumeFile(e.target.files?.[0] || null)}
                  className="mt-1 w-full text-xs text-gray-900"
                  required
                />
              </div>
            </div>
          )}
        </div>

        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Notes about this application..."
          className="mt-4 w-full rounded border p-3 text-gray-900"
        />

        <div className="mt-4 flex gap-3">
          <button
            type="submit"
            className="rounded bg-black px-4 py-2 text-white"
          >
            Save
          </button>

          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="rounded border px-4 py-2 text-gray-700"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{job.role}</h3>
          <p className="mt-1 text-sm text-gray-600">{job.company_name}</p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
            job.status,
          )}`}
        >
          {job.status}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-gray-600 md:grid-cols-2">
        {job.location && (
          <p>
            <span className="font-medium">Location:</span> {job.location}
          </p>
        )}

        {job.source && (
          <p>
            <span className="font-medium">Source:</span> {job.source}
          </p>
        )}

        {job.applied_date && (
          <p>
            <span className="font-medium">Applied:</span> {job.applied_date}
          </p>
        )}

        {job.follow_up_date && (
          <p>
            <span className="font-medium">Follow up:</span> {job.follow_up_date}
          </p>
        )}
      </div>

      {job.notes && (
        <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
          {job.notes}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
        {job.job_link && (
          <a
            href={job.job_link}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            View job
          </a>
        )}

        {job.resume_name || job.resume_filename ? (
          <>
            <button
              onClick={handleViewResume}
              className="text-sm font-semibold text-green-600 hover:underline flex items-center gap-1"
            >
              📄 {job.resume_name || job.resume_filename}
            </button>
            <button
              onClick={handleDownloadResume}
              className="text-sm font-medium text-indigo-600 hover:underline"
            >
              Download
            </button>
          </>
        ) : (
          <span className="text-sm text-gray-400">No resume linked</span>
        )}

        <button
          onClick={handleToggleHistory}
          className="text-sm font-medium text-purple-600 hover:underline"
        >
          {showHistory ? "Hide History" : "View History"}
        </button>

        <button
          onClick={() => setIsEditing(true)}
          className="text-sm font-medium text-gray-700 hover:underline"
        >
          Edit
        </button>

        <button
          onClick={() => setShowScheduleModal(true)}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          Schedule Interview
        </button>
        <button
          onClick={handleToggleInterviews}
          className="text-sm font-medium text-amber-600 hover:underline"
        >
          {showInterviews ? "Hide Interviews" : "Interviews"}
        </button>

        <button
          onClick={() => onDelete(job.id)}
          className="text-sm font-medium text-red-600 hover:underline"
        >
          Delete
        </button>
      </div>

      {showHistory && (
        <div className="mt-4 rounded-lg bg-gray-50 p-4">
          <h4 className="text-sm font-semibold text-gray-900">
            Status History
          </h4>

          {historyLoading ? (
            <p className="mt-2 text-sm text-gray-500">Loading history...</p>
          ) : history.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No status change yet.</p>
          ) : (
            <div className="mt-3 grid gap-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="rounded border border-gray-200 bg-white p-3 text-sm"
                >
                  <p className="font-medium text-gray-900">
                    {item.old_status} {"->"} {item.new_status}
                  </p>

                  <p className="mt-1 text-gray-500">
                    Changed at: {new Date(item.changed_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

            {showInterviews && (
        <div className="mt-4 rounded-lg bg-slate-50 p-4 border border-slate-100">
          <h4 className="text-sm font-semibold text-gray-900">
            Scheduled Interviews
          </h4>

          {interviewsLoading ? (
            <p className="mt-2 text-sm text-gray-500">Loading interviews...</p>
          ) : interviews.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No interviews scheduled yet.</p>
          ) : (
            <div className="mt-3 grid gap-3">
              {interviews.map((item) => (
                <div
                  key={item.id}
                  className="rounded border border-gray-200 bg-white p-3 text-sm flex justify-between items-start shadow-sm"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="font-semibold text-blue-600 truncate">
                      {item.round_type}
                    </p>
                    <p className="mt-1 font-medium text-gray-700">
                      Date: {new Date(item.interview_date).toLocaleString()}
                    </p>
                    <p className="mt-1 text-gray-500 text-xs">
                      Type: <span className="capitalize">{item.location_type}</span>
                    </p>
                    {item.location_type === "online" && item.meeting_link && (
                      <a
                        href={item.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block text-blue-500 hover:underline break-all text-xs"
                      >
                        Join Call: {item.meeting_link}
                      </a>
                    )}
                    {item.location_type === "offline" && item.location && (
                      <p className="mt-1 text-gray-600 text-xs truncate">
                        Location: {item.location}
                      </p>
                    )}
                    {item.notes && (
                      <p className="mt-2 rounded bg-gray-50 p-2 text-xs text-gray-600 whitespace-pre-line border-l-2 border-gray-300">
                        {item.notes}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteInterview(item.id)}
                    className="text-xs text-red-500 hover:text-red-700 font-semibold flex-shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showScheduleModal && (
        <ScheduleInterviewModal
          jobId={job.id}
          companyName={job.company_name}
          role={job.role}
          onClose={() => setShowScheduleModal(false)}
          onScheduled={() => {
            // If already showing interviews list, refresh it
            if (showInterviews) {
              setShowInterviews(false);
              handleToggleInterviews();
            } else {
              handleToggleInterviews();
            }
          }}
        />
      )}
    </div>
  );
}
