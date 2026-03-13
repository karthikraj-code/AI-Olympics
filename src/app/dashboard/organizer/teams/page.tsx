'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { UserPlus, UserMinus, ShieldCheck, AlertCircle } from 'lucide-react'

export default function ManageTeamsPage() {
    const supabase = createClient()

    const [teams, setTeams] = useState<any[]>([])
    const [judges, setJudges] = useState<any[]>([])
    const [whitelistedEmails, setWhitelistedEmails] = useState<string[]>([])
    const [assignments, setAssignments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null) // Contains teamId-judgeId

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            // Fetch teams without chaining .team_members if it causes RLS issue, 
            // but for organizer we assume full select works or we fetch separately.
            const [
                { data: teamsData }, 
                { data: judgesData }, 
                { data: assignsData },
                { data: whitelistedData }
            ] = await Promise.all([
                supabase.from('teams').select(`
                    id, 
                    team_name, 
                    team_members(
                        user_id,
                        users(name, email)
                    )
                `).order('created_at'),
                supabase.from('users').select('id, name, email').eq('role', 'judge'),
                supabase.from('judge_assignments').select('*'),
                supabase.from('judge_emails').select('email')
            ])

            setTeams(teamsData || [])
            setJudges(judgesData || [])
            setAssignments(assignsData || [])
            setWhitelistedEmails((whitelistedData || []).map(d => d.email.toLowerCase()))
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleAssignment = async (team_id: string, judge_id: string, action: 'assign' | 'remove') => {
        const key = `${team_id}-${judge_id}`
        setProcessing(key)
        try {
            const res = await fetch('/api/organizer/assign-judge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ team_id, judge_id, action })
            })
            if (!res.ok) throw new Error('Failed to update assignment')
            await fetchData() // Refresh data
        } catch (err) {
            console.error(err)
            alert('Failed to update assignment')
        } finally {
            setProcessing(null)
        }
    }

    const isAssigned = (teamId: string, judgeId: string) => {
        return assignments.some(a => a.team_id === teamId && a.judge_id === judgeId)
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading teams and judges...</div>

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Manage Teams & Judges</h2>
                <p className="text-gray-600">Assign specific teams to judges for review. <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">Note: Judges only evaluate manual submission rounds. Quiz rounds are auto-graded and hidden from judges.</span></p>
            </div>

            {judges.length === 0 && (
                <div className="bg-sky-50 text-sky-800 p-4 rounded-lg flex items-start gap-3 border border-sky-200">
                    <ShieldCheck className="mt-0.5 shrink-0" />
                    <div>
                        <p className="font-bold">No Registered Judges Found</p>
                        <p className="text-sm">You need to have users registered as 'judge' to assign them. Please create judge accounts in your database or registration system.</p>
                    </div>
                </div>
            )}

            {whitelistedEmails.filter(email => !judges.some(j => j.email.toLowerCase() === email)).length > 0 && (
                <div className="bg-amber-50 text-amber-800 p-4 rounded-lg flex items-start gap-3 border border-amber-200 shadow-sm">
                    <AlertCircle className="mt-0.5 shrink-0 text-amber-600" />
                    <div>
                        <p className="font-bold">Pending Judges Detected</p>
                        <p className="text-sm mb-2">The following emails are whitelisted as judges but haven't logged in yet. They will appear in the assignment list once they sign in for the first time:</p>
                        <ul className="flex flex-wrap gap-2">
                            {whitelistedEmails
                                .filter(email => !judges.some(j => j.email.toLowerCase() === email))
                                .map(email => (
                                    <li key={email} className="bg-white px-2 py-0.5 rounded border border-amber-200 text-xs font-mono font-bold">
                                        {email}
                                    </li>
                                ))
                            }
                        </ul>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                {teams.map(team => (
                    <div key={team.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-start">
                            <div className="w-full">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-gray-900 text-lg">{team.team_name}</h3>
                                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                                        {team.team_members?.length || 0} Members
                                    </span>
                                </div>

                                {team.team_members && team.team_members.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {team.team_members.map((member: any) => (
                                            <div key={member.user_id} className="bg-white border border-gray-200 shadow-sm px-3 py-1.5 rounded-md text-sm flex flex-col">
                                                <span className="font-semibold text-gray-800">{member.users?.name || 'Unknown'}</span>
                                                <span className="text-xs text-gray-500">{member.users?.email || 'No email'}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-100 pb-2">Assign Judges</h4>
                            <div className="space-y-3">
                                {judges.map(judge => {
                                    const assigned = isAssigned(team.id, judge.id)
                                    const key = `${team.id}-${judge.id}`
                                    const isProcessing = processing === key

                                    return (
                                        <div key={judge.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white hover:border-slate-600 transition-colors">
                                            <div>
                                                <p className="font-medium text-gray-900 leading-tight">{judge.name}</p>
                                                <p className="text-xs text-gray-500">{judge.email}</p>
                                            </div>

                                            <button
                                                onClick={() => handleAssignment(team.id, judge.id, assigned ? 'remove' : 'assign')}
                                                disabled={isProcessing}
                                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 ${assigned
                                                    ? 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {isProcessing ? (
                                                    'Updating...'
                                                ) : assigned ? (
                                                    <><UserMinus size={16} /> Unassign</>
                                                ) : (
                                                    <><UserPlus size={16} /> Assign</>
                                                )}
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                ))}

                {teams.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                        No teams have registered yet.
                    </div>
                )}
            </div>
        </div>
    )
}
