import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Trophy, ArrowLeft, Lock } from 'lucide-react'

export const revalidate = 0 // Opt out of static rendering

export default async function PublicLeaderboardPage() {
    const supabase = await createClient()

    // 1. Check if leaderboard is released
    const { data: config } = await supabase
        .from('leaderboard_config')
        .select('is_released')
        .eq('id', 1)
        .single()

    const isReleased = config?.is_released

    if (!isReleased) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
                <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                    <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Results Hidden</h1>
                    <p className="text-gray-600 mb-8">
                        The organizer has not yet released the final leaderboard for the AI Olympics. Please check back later!
                    </p>
                    <Link href="/" className="text-blue-600 font-medium hover:underline flex items-center justify-center gap-2">
                        <ArrowLeft className="w-4 h-4" /> Return to Home
                    </Link>
                </div>
            </div>
        )
    }

    // 2. Load leaderboard data
    const { data: teams } = await supabase.from('teams').select('id, team_name')
    const { data: scores } = await supabase.from('scores').select('team_id, score')

    const leaderboard = teams?.map(team => {
        const teamScores = scores?.filter(s => s.team_id === team.id) || []
        return {
            ...team,
            totalScore: teamScores.reduce((sum, s) => sum + s.score, 0),
            roundsGraded: teamScores.length
        }
    }).sort((a, b) => b.totalScore - a.totalScore) || []

    return (
        <div className="min-h-screen bg-background py-16 px-4">
            <div className="max-w-4xl mx-auto space-y-8">

                <div className="mb-4">
                    <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Link>
                </div>

                <div className="text-center space-y-4 mb-12">
                    <Trophy className="w-16 h-16 text-sky-600 mx-auto" />
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">Official Leaderboard</h1>
                    <p className="text-xl text-gray-600">AI Olympics Final Results</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider">
                                <th className="px-6 py-4 font-semibold border-b border-gray-200">Rank</th>
                                <th className="px-6 py-4 font-semibold border-b border-gray-200">Team Name</th>
                                <th className="px-6 py-4 font-semibold border-b border-gray-200 text-right">Rounds Graded</th>
                                <th className="px-6 py-4 font-semibold border-b border-gray-200 text-right">Total Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {leaderboard.map((team, idx) => (
                                <tr key={team.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg ${idx === 0 ? 'bg-sky-100 text-sky-700 ring-2 ring-sky-200' :
                                                idx === 1 ? 'bg-gray-200 text-gray-700 ring-2 ring-gray-300' :
                                                    idx === 2 ? 'bg-slate-100 text-slate-800 ring-2 ring-slate-200' :
                                                        'bg-gray-50 text-gray-500'
                                            }`}>
                                            {idx + 1}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 font-bold text-gray-900 text-lg">
                                        {team.team_name}
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-right text-gray-500">
                                        {team.roundsGraded} / 7
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-right font-black text-gray-900 text-2xl">
                                        {team.totalScore}
                                    </td>
                                </tr>
                            ))}
                            {leaderboard.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 bg-gray-50">
                                        No scores calculated yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
