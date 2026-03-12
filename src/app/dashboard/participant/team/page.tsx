import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Users, Copy, Plus, UserPlus } from 'lucide-react'

export default async function ParticipantTeamPage() {
    const supabase = await createClient()
    const session = await getServerSession(authOptions);
    const user = session?.user as any

    // 1. Check if user is in a team
    const { data: membership } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user?.id)
        .single()

    // If not in a team, show join/create options
    if (!membership) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
                    <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">You don't have a team yet</h2>
                    <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                        To participate in the AI Olympics, you need to form a team of 2-4 members. Create a new team or join an existing one using an invite code.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/dashboard/participant/team/create"
                            className="bg-blue-600 text-white px-6 py-2.5 rounded-md font-medium hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2"
                        >
                            <Plus size={20} />
                            Create a Team
                        </Link>
                        <Link
                            href="/dashboard/participant/team/join"
                            className="bg-white text-gray-700 border border-gray-300 px-6 py-2.5 rounded-md font-medium hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-2"
                        >
                            <UserPlus size={20} />
                            Join with Code
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    // If in a team, get team details
    const { data: team } = await supabase
        .from('teams')
        .select(`
      id, team_name, leader_id, invite_code,
      team_members (
        user_id,
        users (id, name, email)
      )
    `)
        .eq('id', membership.team_id)
        .single()

    const isLeader = team?.leader_id === user?.id

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{team?.team_name}</h2>
                    <p className="text-gray-600">
                        {team?.team_members?.length} / 4 Members
                    </p>
                </div>
                {isLeader && (
                    <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium border border-blue-100">
                        Team Leader
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Members List */}
                <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="font-semibold text-gray-900">Team Members</h3>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {team?.team_members?.map((member: any) => (
                            <li key={member.user_id} className="px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium">
                                        {member.users?.name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 flex items-center gap-2">
                                            {member.users?.name}
                                            {team.leader_id === member.user_id && (
                                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Leader</span>
                                            )}
                                            {user?.id === member.user_id && (
                                                <span className="text-xs text-blue-600">(You)</span>
                                            )}
                                        </p>
                                        <p className="text-sm text-gray-500">{member.users?.email}</p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Invite Code (Leader Only) */}
                {isLeader && ((team?.team_members?.length || 0) < 4) && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
                        <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">Invite Members</h3>
                        <p className="text-sm text-gray-600">
                            Share this code with your teammates to let them join your team.
                        </p>
                        <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between border border-gray-200">
                            <span className="font-mono text-xl font-bold tracking-widest text-gray-800">
                                {team?.invite_code}
                            </span>
                            {/* Note: Client-side copy functionality would be in a child component, simplified here */}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
