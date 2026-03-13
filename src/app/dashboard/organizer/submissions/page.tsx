import { createAdminClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Clock, Users, FileText, AlertCircle } from 'lucide-react'

export default async function OrganizerSubmissionsPage() {
    const supabase = await createAdminClient()

    // 1. Get all teams
    const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, team_name')
        .order('team_name')

    // 2. Get all rounds
    const { data: allRounds, error: roundsError } = await supabase
        .from('rounds')
        .select('id, name, round_number, end_time, submission_type')
        .order('round_number', { ascending: true })

    // 3. Get all submissions
    const { data: submissions, error: subsError } = await supabase
        .from('submissions')
        .select('team_id, round_id, submitted_at')

    // 4. Get all scores
    const { data: scores, error: scoresError } = await supabase
        .from('scores')
        .select('team_id, round_id, score')

    if (teamsError || roundsError || subsError || scoresError) {
        console.error('Supabase Error:', { teamsError, roundsError, subsError, scoresError })
    }

    const now = new Date()

    // Build a lookup: matrix[team_id][round_id] = { submission, score }
    const matrix: any = {}
    teams?.forEach(t => {
        matrix[t.id] = {}
        allRounds?.forEach(r => {
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

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-sky-400" />
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Participant Submissions</h2>
                    <p className="text-gray-500 font-medium max-w-2xl">
                        Comprehensive overview of all {teams?.length || 0} teams. 
                        Global Engagement: <span className="text-blue-600 font-black">{teams?.length && submissions?.length ? Math.round((submissions.length / (teams.length * (allRounds?.length || 1))) * 100) : 0}%</span> of total possible submissions recorded.
                    </p>
                </div>
                <div className="flex gap-4">
                     <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 flex items-center gap-3">
                        <Users size={20} className="text-blue-600" />
                        <div className="text-right">
                            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Teams</p>
                            <p className="text-xl font-black text-blue-900 leading-none">{teams?.length || 0}</p>
                        </div>
                    </div>
                    <div className="bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100 flex items-center gap-3">
                        <FileText size={20} className="text-emerald-600" />
                        <div className="text-right">
                            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Total Logs</p>
                            <p className="text-xl font-black text-emerald-900 leading-none">{submissions?.length || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-10">
                {teams?.map(team => (
                    <div key={team.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-lg hover:border-blue-200 group">
                        <div className="bg-slate-900 px-8 py-5 flex justify-between items-center group-hover:bg-blue-900 transition-colors">
                            <h3 className="text-xl font-black text-white flex items-center gap-3">
                                <span className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black uppercase shadow-inner">
                                    {team.team_name.charAt(0)}
                                </span>
                                {team.team_name}
                            </h3>
                            <div className="text-right">
                                <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest block mb-0.5">Submissions Tracked</span>
                                <span className="text-lg font-black text-white">
                                    {allRounds?.filter(r => matrix[team.id][r.id].submission).length} / {allRounds?.length}
                                </span>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {allRounds?.map(round => {
                                const data = matrix[team.id]?.[round.id] || {}
                                const hasSubmission = !!data.submission
                                const isGraded = !!data.score
                                const deadlinePassed = now > new Date(round.end_time)
                                const isQuiz = round.submission_type?.includes('quiz')

                                return (
                                    <div key={round.id} className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors group/row">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-3">
                                                <h4 className="text-lg font-bold text-gray-900 group-hover/row:text-blue-700 transition-colors">
                                                    {round.round_number}. {round.name}
                                                </h4>
                                                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-gray-100 text-gray-500 uppercase tracking-widest border border-gray-200">
                                                    {round.submission_type?.join(', ').replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                            
                                            <div className="flex flex-wrap items-center gap-6">
                                                {hasSubmission ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                        <span className="text-sm font-bold text-emerald-600">Successfully Submitted</span>
                                                        <span className="text-xs text-gray-400 font-medium ml-1">
                                                            {new Date(data.submission.submitted_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${deadlinePassed ? 'bg-red-500' : 'bg-amber-400'}`} />
                                                        <span className={`text-sm font-bold ${deadlinePassed ? 'text-red-600' : 'text-amber-500'}`}>
                                                            {deadlinePassed ? 'Missing Submission' : 'Awaiting Participant Input'}
                                                        </span>
                                                    </div>
                                                )}

                                                {isGraded ? (
                                                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                                        <CheckCircle2 size={14} className="text-blue-600" />
                                                        <span className="text-xs font-black text-blue-700 uppercase tracking-tight">Evaluated: {data.score.score} pts</span>
                                                    </div>
                                                ) : isQuiz && hasSubmission ? (
                                                    <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                                        <CheckCircle2 size={14} className="text-emerald-600" />
                                                        <span className="text-xs font-black text-emerald-700 uppercase tracking-tight italic">Auto-Graded</span>
                                                    </div>
                                                ) : hasSubmission ? (
                                                    <div className="flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 text-amber-600">
                                                        <Clock size={14} />
                                                        <span className="text-xs font-bold uppercase tracking-tight italic">Pending Judge Review</span>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="shrink-0">
                                            {hasSubmission ? (
                                                <Link
                                                    href={`/dashboard/organizer/submissions/${team.id}/${round.id}`}
                                                    className="inline-flex items-center gap-3 px-6 py-3 bg-white border-2 border-slate-900 text-slate-900 rounded-xl font-black text-sm hover:bg-slate-900 hover:text-white transition-all transform hover:-translate-y-0.5 shadow-sm active:translate-y-0"
                                                >
                                                    View Details
                                                    <ArrowRight size={18} />
                                                </Link>
                                            ) : (
                                                <div className="px-6 py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 text-sm font-bold flex items-center gap-2 opacity-60">
                                                    No Data
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}

                {teams?.length === 0 && (
                    <div className="text-center py-32 bg-white rounded-2xl border-2 border-dashed border-gray-200 shadow-sm max-w-2xl mx-auto">
                        <FileText size={64} className="mx-auto text-gray-200 mb-6" />
                        <h3 className="text-2xl font-black text-gray-900">No Participants Registered</h3>
                        <p className="text-gray-500 mt-2 font-medium">As soon as teams register and start submitting, they will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
