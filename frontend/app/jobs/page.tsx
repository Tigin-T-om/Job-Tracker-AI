import Navbar from "@/components/Navbar";

export default function JobsPage() {
    return(
        <main className="min-h-screen bg-gray-100 px-6 py-8">
            <div className="mx-auto max-w-6xl">
                <Navbar />
                <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Applications
                    </h1>
                    <p className="mt-2 text-gray-500">
                        The job applications list, search bar, and filters will be moved here in part 30.
                    </p>
                </div>
            </div>
        </main>
    )
}