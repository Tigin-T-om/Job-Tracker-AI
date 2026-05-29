import AddJobForm from "@/components/AddJobForm";
import Navbar from "@/components/Navbar";

export default function AddJobPage() {
  return (
    <main className="min-h-screen bg-gray-100 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <Navbar />

        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-gray-900">Add Application</h1>
          <p className="mt-2 text-gray-600">
            Submit your new job application details to track it in your pipeline.
          </p>
          <AddJobForm />
        </div>
      </div>
    </main>
  );
}
