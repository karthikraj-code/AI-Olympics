import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Clock } from 'lucide-react'

export default async function JudgeSubmissionsPage() {
    const supabase = await createClient()
    const session = await getServerSession(authOptions);
    const user = session?.user as any

    // 1. Get teams assigned to this judge
    const { data: assignments } = await supabase
        .from('judge_assignments')
        .select('team_id')
        .eq('judge_id', user?.id)

    const assignedTeamIds = assignments?.map(a => a.team_id) || []

    // 2. Get details of those teams
    const { data: teams } = await supabase
        .from('teams')
        .select('id, team_name')
        .in('id', assignedTeamIds.length ? assignedTeamIds : ['00000000-0000-0000-0000-000000000000']) // Use dummy array if empty to avoid syntax error

    // 3. Get all rounds (excluding strictly quiz rounds from judge evaluation)
    const { data: allRounds } = await supabase
        .from('rounds')
        .select('id, name, end_time, submission_type')
        .order('start_time', { ascending: true })

    // Filter out quiz rounds so Judges don't see them
    const rounds = allRounds?.filter(r => !r.submission_type?.includes('quiz')) || []

    // 4. Get submissions for these teams
    const { data: submissions } = await supabase
        .from('submissions')
        .select('*')
        .in('team_id', assignedTeamIds.length ? assignedTeamIds : ['00000000-0000-0000-0000-000000000000'])

    // 5. Get existing scores given by THIS judge
    const { data: scores } = await supabase
        .from('scores')
        .select('*')
        .eq('judge_id', user?.id)

    const now = new Date()

    // Build a lookup for easy access: map[team_id][round_id] = { submission, score }
    const matrix: any = {}
    teams?.forEach(t => {
        matrix[t.id] = {}
        rounds?.forEach(r => {
            matrix[t.id][r.id] = { submission: null, score: null }
        })
    })

    submissions?.forEach(sub => {
        if (matrix[sub.team_id] && matrix[sub.team_id][sub.round_id]) {
            matrix[sub.team_id][sub.round_id].submission = sub
        }
    })

    scores?.forEach(sc => {
        if (matrix[sc.team_id] && matrix[sc.team_id][sc.round_id]) {
            matrix[sc.team_id][sc.round_id].score = sc
        }
    })

    if (!assignedTeamIds.length) {
        return (
            <div className="p-12 text-center bg-white rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Assignments Yet</h3>
                <p className="text-gray-600">The organizer has not assigned any teams to you for review.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Submissions</h2>
                <p className="text-gray-600">
                    You are assigned to evaluate {teams?.length} teams across {rounds?.length} rounds.
                </p>
            </div>

            <div className="space-y-8">
                {teams?.map(team => (
                    <div key={team.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">{team.team_name}</h3>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {rounds?.map(round => {
                                const data = matrix[team.id]?.[round.id] || {}
                                const hasSubmission = !!data.submission
                                const isGraded = !!data.score
                                const deadlinePassed = now > new Date(round.end_time)

                                return (
                                    <div key={round.id} className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900">{round.name}</h4>
                                            <div className="text-sm text-gray-500 mt-1 flex items-center gap-4">
                                                {hasSubmission ? (
                                                    <span className="text-blue-600 font-medium flex items-center gap-1">
                                                        <CheckCircle2 size={16} /> Submitted
                                                    </span>
                                                ) : (
                                                    <span className={`${deadlinePassed ? 'text-slate-600' : 'text-gray-400'} flex items-center gap-1`}>
                                                        <Clock size={16} /> {deadlinePassed ? 'Missing (Deadline Passed)' : 'Awaiting Submission'}
                                                    </span>
                                                )}

                                                {isGraded && (
                                                    <span className="text-blue-600 font-medium px-2 py-0.5 bg-blue-50 rounded border border-blue-100">
                                                        Score: {data.score.score}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            {hasSubmission ? (
                                                <Link
                                                    href={`/dashboard/judge/submissions/${team.id}/${round.id}`}
                                                    className={`px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2 ${isGraded
                                                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                                        }`}
                                                >
                                                    {isGraded ? 'Edit Score' : 'Evaluate'} <ArrowRight size={16} />
                                                </Link>
                                            ) : (
                                                <button disabled className="px-4 py-2 rounded-md font-medium text-sm bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed">
                                                    No Submission
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
