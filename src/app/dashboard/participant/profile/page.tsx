import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from '@/utils/supabase/server'
import { UserCircle, Mail, Users, Crown } from 'lucide-react'

export default async function ParticipantProfilePage() {
    const supabase = await createClient()
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as any

    // 1. Get user profile
    const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', sessionUser?.id)
        .single()

    // 2. Get team details
    const { data: membership } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', sessionUser?.id)
        .single()

    let teamName = "";
    let teamLeaderId = "";
    let teamMembers: any[] = [];

    if (membership) {
        const { data: teamData } = await supabase
            .from('teams')
            .select(`
                id, team_name, leader_id,
                team_members (
                    user_id,
                    users (id, name, email)
                )
            `)
            .eq('id', membership.team_id)
            .single()
            
        if (teamData) {
            teamName = teamData.team_name;
            teamLeaderId = teamData.leader_id;
            teamMembers = teamData.team_members
                ?.map((m: any) => m.users)
                .filter((u: any) => u !== null && u !== undefined) || [];
        }
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-6">
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <UserCircle size={48} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{user?.name}</h2>
                    <div className="flex items-center gap-2 text-gray-600 font-medium">
                        <Mail size={18} />
                        <span>{user?.email}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
                    <Users className="text-blue-600" size={22} />
                    <h3 className="font-semibold text-gray-900 text-lg">Team Information</h3>
                </div>
                
                <div className="p-6">
                    {teamName ? (
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Team Name</h4>
                                <p className="text-xl font-bold text-gray-900">{teamName}</p>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-8">Team Members</h4>
                                <ul className="space-y-3">
                                    {teamMembers.map((member: any) => {
                                        const isLeader = member.id === teamLeaderId;
                                        return (
                                            <li key={member.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 font-bold shadow-sm text-lg">
                                                        {member.name?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 flex items-center gap-2 text-lg">
                                                            {member.name}
                                                            {sessionUser?.id === member.id && (
                                                                <span className="text-xs text-blue-700 font-bold bg-blue-100 px-2.5 py-1 rounded-full uppercase tracking-wider">You</span>
                                                            )}
                                                        </p>
                                                        <p className="text-sm text-gray-600 font-medium">{member.email}</p>
                                                    </div>
                                                </div>
                                                {isLeader && (
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full border border-amber-200 uppercase tracking-wider shadow-sm">
                                                        <Crown size={16} />
                                                        Leader
                                                    </div>
                                                )}
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600 text-lg font-medium">
                                You are not currently part of any team.
                            </p>
                            <p className="text-gray-500 mt-2">
                                Head over to the My Team section to create or join a team!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
