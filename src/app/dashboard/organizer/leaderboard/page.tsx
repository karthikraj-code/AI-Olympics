'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Trophy, Eye, EyeOff, Download } from 'lucide-react'

export default function OrganizerLeaderboardPage() {
    const supabase = createClient()

    const [leaderboard, setLeaderboard] = useState<any[]>([])
    const [isReleased, setIsReleased] = useState(false)
    const [loading, setLoading] = useState(true)
    const [toggling, setToggling] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            // 1. Get Config
            const { data: config } = await supabase.from('leaderboard_config').select('is_released').eq('id', 1).single()
            setIsReleased(config?.is_released || false)

            // 2. Calculate Leaderboard
            // Fetch all teams
            const { data: teams } = await supabase.from('teams').select('id, team_name')

            // Fetch all scores
            const { data: scores } = await supabase.from('scores').select('team_id, score')

            if (teams && scores) {
                const board = teams.map(team => {
                    const teamScores = scores.filter(s => s.team_id === team.id)
                    const totalScore = teamScores.reduce((sum, s) => sum + s.score, 0)
                    return {
                        ...team,
                        totalScore,
                        roundsGraded: teamScores.length
                    }
                }).sort((a, b) => b.totalScore - a.totalScore) // Sort descending

                setLeaderboard(board)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleToggle = async () => {
        setToggling(true)
        try {
            const res = await fetch('/api/organizer/leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_released: !isReleased })
            })

            if (!res.ok) throw new Error('Failed to toggle')
            setIsReleased(!isReleased)
        } catch (err) {
            console.error(err)
            alert('Failed to update leaderboard status')
        } finally {
            setToggling(false)
        }
    }

    const exportCSV = () => {
        const headers = ['Rank', 'Team Name', 'Total Score', 'Rounds Graded']
        const csvContent = [
            headers.join(','),
            ...leaderboard.map((team, idx) =>
                `"${idx + 1}","${team.team_name}","${team.totalScore}","${team.roundsGraded}"`
            )
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `ai-olympics-leaderboard-${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading leaderboard...</div>

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <Trophy className="text-sky-600" /> Leaderboard Control
                    </h2>
                    <p className="text-gray-600">
                        Control visibility and export final results.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={exportCSV}
                        className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md font-medium hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <Download size={18} /> Export CSV
                    </button>

                    <button
                        onClick={handleToggle}
                        disabled={toggling}
                        className={`px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 ${isReleased
                                ? 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                    >
                        {isReleased ? <><EyeOff size={18} /> Hide Results</> : <><Eye size={18} /> Release Results</>}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className={`p-4 text-center font-medium ${isReleased ? 'bg-blue-50 text-blue-600 border-b border-blue-100' : 'bg-sky-50 text-sky-800 border-b border-sky-200'}`}>
                    {isReleased
                        ? 'Participant view: Leaderboard is currently PUBLIC.'
                        : 'Participant view: Leaderboard is HIDDEN.'}
                </div>

                <div className="overflow-x-auto">
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
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${idx === 0 ? 'bg-sky-100 text-sky-700' :
                                                idx === 1 ? 'bg-gray-200 text-gray-700' :
                                                    idx === 2 ? 'bg-slate-100 text-slate-800' :
                                                        'bg-gray-50 text-gray-500'
                                            }`}>
                                            {idx + 1}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                        {team.team_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-500 text-sm">
                                        {team.roundsGraded} / 7
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-gray-900 text-lg">
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
