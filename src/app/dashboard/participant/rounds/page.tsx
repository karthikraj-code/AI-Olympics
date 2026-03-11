import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Calendar, Clock, FileText, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'

export default async function ParticipantRoundsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Get user's team
    const { data: membership } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user?.id)
        .single()

    const teamId = membership?.team_id

    // 2. Fetch all rounds
    const { data: rounds } = await supabase
        .from('rounds')
        .select('*')
        .order('start_time', { ascending: true })

    // 3. Fetch team submissions if part of a team
    let submissions: any[] = []
    if (teamId) {
        const { data: teamSubmissions } = await supabase
            .from('submissions')
            .select('round_id')
            .eq('team_id', teamId)
        submissions = teamSubmissions || []
    }

    const now = new Date()
    const submittedRoundIds = new Set(submissions.map(s => s.round_id))

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Hackathon Rounds</h2>
                <p className="text-gray-600">
                    {!teamId
                        ? "You must join a team before you can submit to rounds."
                        : "Only the team leader can submit work. Make sure to submit before the deadline."}
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {rounds?.map((round) => {
                    const startTime = new Date(round.start_time)
                    const endTime = new Date(round.end_time)
                    const isSubmitted = submittedRoundIds.has(round.id)

                    let statusColor = "bg-gray-100 text-gray-800 border-gray-200"
                    let statusText = "UPCOMING"
                    let isActive = false

                    if (now >= startTime && now <= endTime) {
                        statusColor = "bg-blue-50 text-blue-600 border-blue-200"
                        statusText = "ACTIVE"
                        isActive = true
                    } else if (now > endTime) {
                        statusColor = "bg-slate-50 text-slate-600 border-slate-200"
                        statusText = "ENDED"
                    }

                    if (isSubmitted) {
                        statusColor = "bg-blue-50 text-blue-600 border-blue-200"
                        statusText = "SUBMITTED"
                    }

                    return (
                        <div key={round.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{round.name}</h3>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${statusColor}`}>
                                        {statusText}
                                    </span>
                                </div>

                                <p className="text-gray-600 text-sm mb-4">
                                    {round.description || 'No description provided.'}
                                </p>

                                <div className="flex flex-wrap gap-4 text-sm mt-auto">
                                    <div className="flex items-center text-gray-600 gap-1.5 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-100">
                                        <Clock size={16} className="text-gray-400" />
                                        <span>Ends: {endTime.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="flex items-center text-gray-600 gap-1.5 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-100">
                                        <FileText size={16} className="text-gray-400" />
                                        <span className="capitalize">{round.submission_type?.join(', ').replace(/_/g, ' ')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 border-t md:border-t-0 md:border-l border-gray-100 p-6 flex flex-col justify-center items-center md:min-w-[200px] shrink-0">
                                {isSubmitted ? (
                                    <div className="text-center text-blue-600">
                                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                                        <p className="font-medium">Submitted</p>
                                        <Link href={`/dashboard/participant/rounds/${round.id}`} className="text-sm hover:underline mt-1 block">
                                            View Submission
                                        </Link>
                                    </div>
                                ) : isActive ? (
                                    <Link
                                        href={`/dashboard/participant/rounds/${round.id}`}
                                        className="w-full text-center bg-blue-600 text-white px-4 py-2.5 rounded-md font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                                    >
                                        Open Round <ArrowRight size={16} />
                                    </Link>
                                ) : now < startTime ? (
                                    <div className="text-center text-gray-500">
                                        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="font-medium text-sm">Opens {startTime.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                ) : (
                                    <div className="text-center text-slate-600">
                                        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                                        <p className="font-medium">Closed</p>
                                        <p className="text-xs text-gray-500 mt-1">Deadline passed</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}

                {(!rounds || rounds.length === 0) && (
                    <div className="py-12 text-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                        <h3 className="text-lg font-medium text-gray-900">No rounds available</h3>
                        <p className="text-gray-500">The organizer hasn't created any rounds yet.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
