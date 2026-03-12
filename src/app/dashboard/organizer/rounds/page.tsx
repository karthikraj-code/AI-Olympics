import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { PlusCircle, Calendar, Clock, FileText } from 'lucide-react'
import DeleteRoundButton from './DeleteRoundButton'

export default async function OrganizerRoundsPage() {
    const supabase = await createClient()

    // Fetch all rounds
    const { data: rounds } = await supabase
        .from('rounds')
        .select('*')
        .order('round_number', { ascending: true })

    const now = new Date()

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Manage Rounds</h2>
                    <p className="text-gray-600">You have configured {rounds?.length || 0} out of 7 rounds.</p>
                </div>
                <Link
                    href="/dashboard/organizer/rounds/create"
                    className="bg-slate-600 text-white px-6 py-2.5 rounded-md font-medium hover:bg-slate-700 transition-colors inline-flex items-center gap-2 shadow-sm"
                >
                    <PlusCircle size={20} />
                    Create Round
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rounds?.map((round) => {
                    const startTime = new Date(round.start_time)
                    const endTime = new Date(round.end_time)

                    let statusColor = "bg-gray-100 text-gray-800 border-gray-200"
                    let statusText = "UPCOMING"

                    if (now >= startTime && now <= endTime) {
                        statusColor = "bg-blue-50 text-blue-600 border-blue-200"
                        statusText = "ACTIVE"
                    } else if (now > endTime) {
                        statusColor = "bg-slate-50 text-slate-600 border-slate-200"
                        statusText = "ENDED"
                    }

                    return (
                        <div key={round.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-gray-900 text-lg leading-tight">
                                        {round.round_number && <span className="text-blue-600 mr-2">Round {round.round_number}:</span>}
                                        {round.name}
                                    </h3>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${statusColor}`}>
                                        {statusText}
                                    </span>
                                </div>

                                <p className="text-gray-600 text-sm mb-6 line-clamp-2">
                                    {round.description || 'No description provided.'}
                                </p>

                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center text-gray-600 gap-2">
                                        <Calendar size={16} className="text-gray-400" />
                                        <span>{startTime.toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center text-gray-600 gap-2">
                                        <Clock size={16} className="text-gray-400" />
                                        <span>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="flex items-center text-gray-600 gap-2">
                                        <FileText size={16} className="text-gray-400" />
                                        <span className="capitalize">{round.submission_type?.join(', ').replace(/_/g, ' ')}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 border-t border-gray-100 px-6 py-3 flex justify-between items-center text-sm font-medium">
                                {/* Only Quiz rounds get the 'Manage Quiz' button */}
                                {round.submission_type?.includes('quiz') ? (
                                    <Link href={`/dashboard/organizer/rounds/${round.id}/quiz`} className="text-blue-600 hover:underline">
                                        Manage Quiz
                                    </Link>
                                ) : (
                                    <span className="text-gray-400 cursor-not-allowed">Standard Round</span>
                                )}
                                <div className="flex items-center gap-4">
                                    <Link href={`/dashboard/organizer/rounds/${round.id}/edit`} className="text-gray-600 hover:text-gray-900">
                                        Edit
                                    </Link>
                                    <DeleteRoundButton roundId={round.id} roundName={round.name} />
                                </div>
                            </div>
                        </div>
                    )
                })}

                {(!rounds || rounds.length === 0) && (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">No rounds created yet</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mt-1">
                            Start by creating the 7 challenges required for the AI Olympics platform.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
