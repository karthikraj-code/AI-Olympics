import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Users, Calendar, ShieldCheck, Trophy, CheckCircle2 } from 'lucide-react'

export default async function OrganizerDashboard() {
    const supabase = await createClient()
    const now = new Date()

    const [
        { count: teamCount },
        { data: rounds },
        { data: judgeAssignments },
        { data: scores },
        { data: lbConfig },
    ] = await Promise.all([
        supabase.from('teams').select('*', { count: 'exact', head: true }),
        supabase.from('rounds').select('id, name, start_time, end_time'),
        supabase.from('judge_assignments').select('judge_id'),
        supabase.from('scores').select('team_id, round_id'),
        supabase.from('leaderboard_config').select('is_released').eq('id', 1).single(),
    ])

    const totalRounds = rounds?.length ?? 0
    const activeRounds = rounds?.filter(r => new Date(r.start_time) <= now && now <= new Date(r.end_time)).length ?? 0
    const uniqueJudges = new Set(judgeAssignments?.map(a => a.judge_id)).size
    const scoredPairs = new Set(scores?.map(s => `${s.team_id}-${s.round_id}`)).size
    const isLeaderboardReleased = lbConfig?.is_released ?? false

    const stats = [
        { label: 'Total Teams', value: teamCount ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Total Rounds', value: totalRounds, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Active Now', value: activeRounds, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Judges', value: uniqueJudges, icon: ShieldCheck, color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: 'Submissions Scored', value: scoredPairs, icon: Trophy, color: 'text-sky-600', bg: 'bg-sky-50' },
    ]

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Organizer Dashboard</h2>
                <p className="text-gray-500 text-sm">
                    Manage the hackathon, create rounds, assign judges, and release the leaderboard.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {stats.map(stat => (
                    <div key={stat.label} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3">
                        <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                            <stat.icon size={18} className={stat.color} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Rounds status */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-900">Rounds Status</h3>
                        <Link href="/dashboard/organizer/rounds" className="text-xs text-blue-600 hover:underline">Manage →</Link>
                    </div>
                    <div className="space-y-2">
                        {rounds && rounds.length > 0 ? rounds.map(r => {
                            const start = new Date(r.start_time)
                            const end = new Date(r.end_time)
                            const isActive = start <= now && now <= end
                            const isEnded = now > end
                            return (
                                <div key={r.id} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-700 truncate max-w-[200px]">{r.name}</span>
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${isActive ? 'bg-blue-50 text-blue-600 border-blue-200' : isEnded ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                        {isActive ? 'ACTIVE' : isEnded ? 'ENDED' : 'UPCOMING'}
                                    </span>
                                </div>
                            )
                        }) : (
                            <p className="text-sm text-gray-400">No rounds created yet.</p>
                        )}
                    </div>
                </div>

                {/* Quick actions */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <Link href="/dashboard/organizer/rounds/create" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                            <Calendar size={16} className="text-purple-500" /> Create New Round
                        </Link>
                        <Link href="/dashboard/organizer/teams" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                            <ShieldCheck size={16} className="text-orange-500" /> Assign Judges to Teams
                        </Link>
                        <Link href="/dashboard/organizer/leaderboard" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                            <Trophy size={16} className="text-sky-500" />
                            Leaderboard —&nbsp;
                            <span className={`font-semibold ${isLeaderboardReleased ? 'text-green-600' : 'text-amber-600'}`}>
                                {isLeaderboardReleased ? 'Public' : 'Hidden'}
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
