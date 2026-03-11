export default function JudgeDashboard() {
    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Judge Dashboard</h2>
                <p className="text-gray-600">
                    Review and score submissions for the teams assigned to you.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        Your Assignments
                    </h3>
                    <p className="text-sm text-gray-600">
                        You currently have no teams assigned to you. When the organizer assigns teams, they will appear here.
                    </p>
                </div>
            </div>
        </div>
    )
}
