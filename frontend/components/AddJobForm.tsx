"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { API_BASE_URL } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function AddJobForm() {
  const router = useRouter();

  // Repository resumes list
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");

  // Upload inline states
  const [isUploadingNew, setIsUploadingNew] = useState(false);
  const [newResumeName, setNewResumeName] = useState("");
  const [newResumeFile, setNewResumeFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    company_name: "",
    role: "",
    job_link: "",
    location: "",
    source: "",
    status: "Applied",
    applied_date: "",
    follow_up_date: "",
    notes: "",
  });

  // Load all resumes from repository on mount
  useEffect(() => {
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
          const data = await res.json();
          setResumes(data);
        }
      } catch (err) {
        console.error("Failed to load resumes repository", err);
      }
    }
    loadResumes();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const token = getToken();
    if (!token) {
      alert("Please login first");
      return;
    }

    let resumeIdToLink: number | null = selectedResumeId ? parseInt(selectedResumeId) : null;

    // 1. If user opted to upload a new resume directly, upload it first to the repository!
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
          resumeIdToLink = uploadResult.id; // Assign the newly uploaded resume's ID to this job!
        } else {
          alert("Failed to upload resume to repository. Creating job application without it.");
        }
      } catch (err) {
        console.error("Error uploading resume", err);
        alert("Failed to upload resume to repository. Creating job application without it.");
      }
    }

    // 2. Create the job application with the linked resume_id
    const res = await fetch(`${API_BASE_URL}/jobs/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...formData,
        applied_date: formData.applied_date || null,
        follow_up_date: formData.follow_up_date || null,
        resume_id: resumeIdToLink,
      }),
    });

    if (!res.ok) {
      alert("Failed to create job");
      return;
    }

    alert("Job added successfully");

    setFormData({
      company_name: "",
      role: "",
      job_link: "",
      location: "",
      source: "",
      status: "Applied",
      applied_date: "",
      follow_up_date: "",
      notes: "",
    });

    setSelectedResumeId("");
    setIsUploadingNew(false);
    setNewResumeName("");
    setNewResumeFile(null);

    router.push("/jobs");
  }

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

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 rounded-xl bg-white p-6 shadow font-sans"
    >
      <h2 className="text-xl font-semibold text-gray-900">Add New Job</h2>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <input
          name="company_name"
          value={formData.company_name}
          onChange={handleChange}
          required
          placeholder="Company name"
          className="rounded border p-3 text-gray-900"
        />

        <input
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
          placeholder="Role"
          className="rounded border p-3 text-gray-900"
        />

        <input
          name="job_link"
          value={formData.job_link}
          onChange={handleChange}
          placeholder="Job link"
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
          placeholder="Source e.g. LinkedIn"
          className="rounded border p-3 text-gray-900"
        />

        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="rounded border p-3 text-gray-900 bg-white"
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

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Applied Date
          </label>
          <input
            type="date"
            name="applied_date"
            value={formData.applied_date}
            onChange={handleChange}
            className="w-full rounded border p-3 text-gray-900"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Follow-up Date
          </label>
          <input
            type="date"
            name="follow_up_date"
            value={formData.follow_up_date}
            onChange={handleChange}
            className="w-full rounded border p-3 text-gray-900"
          />
        </div>
      </div>

      <textarea
        name="notes"
        value={formData.notes}
        onChange={handleChange}
        placeholder="Notes"
        className="mt-4 w-full rounded border p-3 text-gray-900"
      />

      {/* Resume Repository Picker Section */}
      <div className="mt-4 border-t border-gray-100 pt-4">
        <label className="block text-sm font-semibold text-gray-700">
          Link Resume from Repository
        </label>
        
        <select
          value={isUploadingNew ? "upload-new" : selectedResumeId}
          onChange={(e) => {
            if (e.target.value === "upload-new") {
              setIsUploadingNew(true);
              setSelectedResumeId("");
            } else {
              setIsUploadingNew(false);
              setSelectedResumeId(e.target.value);
            }
          }}
          className="mt-2 block w-full rounded border border-gray-200 p-3 text-gray-900 bg-white focus:border-blue-500 focus:outline-none"
        >
          <option value="">No Resume Linked</option>
          {resumes.map((resume) => (
            <option key={resume.id} value={resume.id}>
              {resume.resume_name} ({resume.filename})
            </option>
          ))}
          <option value="upload-new">+ Upload New Resume Version to Repository</option>
        </select>

        {isUploadingNew && (
          <div className="mt-3 p-4 rounded-xl bg-gray-50 border border-gray-200/60 space-y-3">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">New Resume Version Details</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-600">Resume Version Label</label>
                <input
                  type="text"
                  value={newResumeName}
                  onChange={(e) => setNewResumeName(e.target.value)}
                  placeholder="e.g. Google Resume v2"
                  className="mt-1 w-full rounded border p-2 text-sm text-gray-900 bg-white"
                  required={isUploadingNew}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">Select File</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setNewResumeFile(e.target.files?.[0] || null)}
                  className="mt-1 w-full text-sm text-gray-900"
                  required={isUploadingNew}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="mt-6 rounded bg-black px-6 py-3 font-semibold text-white hover:bg-neutral-800 transition"
      >
        Save Job Application
      </button>
    </form>
  );
}
