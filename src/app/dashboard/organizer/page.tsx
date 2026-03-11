export default function OrganizerDashboard() {
    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Organizer Dashboard</h2>
                <p className="text-gray-600">
                    Manage the hackathon, create rounds, assign judges, and release the leaderboard.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                        Overview
                    </h3>
                    <ul className="space-y-3">
                        <li className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Teams:</span>
                            <span className="font-semibold text-gray-900">0</span>
                        </li>
                        <li className="flex justify-between text-sm">
                            <span className="text-gray-600">Active Rounds:</span>
                            <span className="font-semibold text-gray-900">0 / 7</span>
                        </li>
                        <li className="flex justify-between text-sm">
                            <span className="text-gray-600">Judges Assigned:</span>
                            <span className="font-semibold text-gray-900">0</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
