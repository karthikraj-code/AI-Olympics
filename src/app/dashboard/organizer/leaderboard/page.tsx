'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Trophy, Eye, EyeOff, Download, ChevronDown, ChevronUp, CheckCircle, Clock } from 'lucide-react'

export default function OrganizerLeaderboardPage() {
    const supabase = createClient()

    const [teams, setTeams] = useState<any[]>([])
    const [rounds, setRounds] = useState<any[]>([])
    const [scores, setScores] = useState<any[]>([])
    const [isReleased, setIsReleased] = useState(false)
    const [loading, setLoading] = useState(true)
    const [toggling, setToggling] = useState(false)
    const [expandedRound, setExpandedRound] = useState<string | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [
                { data: config },
                { data: teamsData },
                { data: roundsData },
                { data: scoresData },
            ] = await Promise.all([
                supabase.from('leaderboard_config').select('is_released').eq('id', 1).single(),
                supabase.from('teams').select('id, team_name'),
                supabase.from('rounds').select('id, name, submission_type').order('start_time', { ascending: true }),
                supabase.from('scores').select('*'),
            ])

            setIsReleased(config?.is_released || false)
            setTeams(teamsData || [])
            setRounds(roundsData || [])
            setScores(scoresData || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // Get score for a specific team + round (average if multiple judges)
    const getScore = (teamId: string, roundId: string): number | null => {
        const roundScores = scores.filter(s => s.team_id === teamId && s.round_id === roundId)
        if (!roundScores.length) return null
        return Math.round(roundScores.reduce((sum, s) => sum + s.score, 0) / roundScores.length)
    }

    // Build leaderboard with per-round scores and total
    const leaderboard = teams.map(team => {
        const roundScores = rounds.map(r => ({ roundId: r.id, score: getScore(team.id, r.id) }))
        const totalScore = roundScores.reduce((sum, r) => sum + (r.score ?? 0), 0)
        return { ...team, roundScores, totalScore }
    }).sort((a, b) => b.totalScore - a.totalScore)

    // Per-round breakdown data
    const perRoundData = rounds.map(round => {
        const isQuiz = round.submission_type?.includes('quiz')
        const teamBreakdowns = teams.map(team => {
            const roundScoreRows = scores.filter(s => s.team_id === team.id && s.round_id === round.id)
            const hasScore = roundScoreRows.length > 0
            const avgScore = hasScore
                ? Math.round(roundScoreRows.reduce((sum, s) => sum + s.score, 0) / roundScoreRows.length)
                : null
            return { ...team, score: avgScore, hasScore, judgeCount: roundScoreRows.length }
        }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
        return { ...round, isQuiz, teamBreakdowns }
    })

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
        const roundHeaders = rounds.map(r => `"${r.name}"`).join(',')
        const rows = [`"Rank","Team Name",${roundHeaders},"Total Score"`]
        leaderboard.forEach((team, idx) => {
            const roundCols = team.roundScores.map((r: any) => r.score !== null ? `"${r.score}"` : '"-"').join(',')
            rows.push(`"${idx + 1}","${team.team_name}",${roundCols},"${team.totalScore}"`)
        })
        const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
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
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                        <Trophy className="text-sky-600" /> Leaderboard Control
                    </h2>
                    <p className="text-gray-600 text-sm">View scores per round and control participant visibility.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={exportCSV} className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md font-medium hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm text-sm">
                        <Download size={16} /> Export CSV
                    </button>
                    <button
                        onClick={handleToggle}
                        disabled={toggling}
                        className={`px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 text-sm ${isReleased
                            ? 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                            : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                        {isReleased ? <><EyeOff size={16} /> Hide from Participants</> : <><Eye size={16} /> Release to Participants</>}
                    </button>
                </div>
            </div>

            {/* Status Banner */}
            <div className={`px-4 py-2.5 rounded-lg text-center font-medium text-sm border ${isReleased ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                {isReleased ? '✓ Leaderboard is PUBLIC — participants can see rankings.' : '⚠ Leaderboard is HIDDEN — only organizers can see rankings.'}
            </div>

            {/* Main Leaderboard Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                                <th className="px-5 py-4 font-semibold border-b border-gray-200 w-16">Rank</th>
                                <th className="px-5 py-4 font-semibold border-b border-gray-200">Team</th>
                                {rounds.map((r, i) => (
                                    <th key={r.id} className="px-4 py-4 font-semibold border-b border-gray-200 text-center whitespace-nowrap">
                                        <div>Round {i + 1}</div>
                                        <div className="text-gray-400 font-normal normal-case text-xs mt-0.5 max-w-[80px] truncate mx-auto" title={r.name}>
                                            {r.name}
                                        </div>
                                        {r.submission_type?.includes('quiz') && (
                                            <div className="text-blue-400 font-normal normal-case text-xs">(auto)</div>
                                        )}
                                    </th>
                                ))}
                                <th className="px-5 py-4 font-semibold border-b border-gray-200 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {leaderboard.map((team, idx) => (
                                <tr key={team.id} className={`hover:bg-gray-50 transition-colors ${idx === 0 ? 'bg-sky-50/30' : ''}`}>
                                    <td className="px-5 py-4">
                                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${idx === 0 ? 'bg-sky-100 text-sky-700' :
                                            idx === 1 ? 'bg-gray-200 text-gray-600' :
                                            idx === 2 ? 'bg-orange-100 text-orange-700' :
                                            'bg-gray-50 text-gray-400'}`}>
                                            {idx + 1}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 font-semibold text-gray-900">{team.team_name}</td>
                                    {team.roundScores.map((r: any) => (
                                        <td key={r.roundId} className="px-4 py-4 text-center">
                                            {r.score !== null ? (
                                                <span className="font-semibold text-gray-800">{r.score}</span>
                                            ) : (
                                                <span className="text-gray-300 text-base">—</span>
                                            )}
                                        </td>
                                    ))}
                                    <td className="px-5 py-4 text-right font-bold text-gray-900 text-base">{team.totalScore}</td>
                                </tr>
                            ))}
                            {leaderboard.length === 0 && (
                                <tr>
                                    <td colSpan={rounds.length + 3} className="px-6 py-12 text-center text-gray-400 bg-gray-50">
                                        No scores recorded yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Per-Round Accordion Breakdown */}
            <div>
                <h3 className="text-base font-bold text-gray-800 mb-3">Per-Round Breakdown</h3>
                <div className="space-y-3">
                    {perRoundData.map((round, rIdx) => {
                        const scoredCount = round.teamBreakdowns.filter((t: any) => t.hasScore).length
                        return (
                            <div key={round.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <button
                                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                                    onClick={() => setExpandedRound(expandedRound === round.id ? null : round.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-gray-400 w-16">Round {rIdx + 1}</span>
                                        <span className="font-semibold text-gray-900">{round.name}</span>
                                        {round.isQuiz && (
                                            <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
                                                Auto-Graded Quiz
                                            </span>
                                        )}
                                        <span className="text-xs text-gray-400">
                                            {scoredCount} / {teams.length} teams scored
                                        </span>
                                    </div>
                                    {expandedRound === round.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                                </button>

                                {expandedRound === round.id && (
                                    <div className="border-t border-gray-100">
                                        <table className="w-full text-sm border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                                    <th className="px-6 py-3 font-semibold border-b border-gray-100 w-16">Rank</th>
                                                    <th className="px-6 py-3 font-semibold border-b border-gray-100">Team</th>
                                                    <th className="px-6 py-3 font-semibold border-b border-gray-100 text-center">
                                                        {round.isQuiz ? 'Quiz Score' : 'Score (avg)'}
                                                    </th>
                                                    {!round.isQuiz && (
                                                        <th className="px-6 py-3 font-semibold border-b border-gray-100 text-center">Judges</th>
                                                    )}
                                                    <th className="px-6 py-3 font-semibold border-b border-gray-100 text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {round.teamBreakdowns.map((team: any, i: number) => (
                                                    <tr key={team.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-3 text-gray-400">{team.hasScore ? i + 1 : '—'}</td>
                                                        <td className="px-6 py-3 font-medium text-gray-900">{team.team_name}</td>
                                                        <td className="px-6 py-3 text-center font-semibold text-gray-800">{team.hasScore ? team.score : <span className="text-gray-300">—</span>}</td>
                                                        {!round.isQuiz && (
                                                            <td className="px-6 py-3 text-center text-gray-400 text-xs">{team.hasScore ? team.judgeCount : '—'}</td>
                                                        )}
                                                        <td className="px-6 py-3 text-center">
                                                            {team.hasScore ? (
                                                                <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                                                                    <CheckCircle size={11} /> Scored
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                                                                    <Clock size={11} /> Pending
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
