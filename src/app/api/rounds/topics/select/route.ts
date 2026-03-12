import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const session = await getServerSession(authOptions);
        const user = session?.user as any

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { round_id, cse_topic_id, other_topic_id, team_id, single_topic } = await request.json()

        if (!round_id || !team_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Validate single vs dual topic mode
        if (single_topic && !cse_topic_id) {
            return NextResponse.json({ error: 'Missing topic_id for single topic selection.' }, { status: 400 })
        }
        if (!single_topic && (!cse_topic_id || !other_topic_id)) {
            return NextResponse.json({ error: 'Missing CSE or Other topic for dual selection.' }, { status: 400 })
        }

        // 1. Verify user is the leader of the team
        const { data: teamData } = await supabase
            .from('teams')
            .select('leader_id')
            .eq('id', team_id)
            .single()

        if (teamData?.leader_id !== user.id) {
            return NextResponse.json({ error: 'Only the team leader can select topics.' }, { status: 403 })
        }

        // 2. Check if the team already selected topics for this round
        const { data: existingSelections } = await supabase
            .from('topic_selections')
            .select('id')
            .eq('round_id', round_id)
            .eq('team_id', team_id)

        if (existingSelections && existingSelections.length > 0) {
            return NextResponse.json({ error: 'Your team has already selected topics for this round.' }, { status: 400 })
        }

        if (single_topic) {
            // DEBATE MODE: single topic selection
            const { data: topicData } = await supabase
                .from('topics')
                .select('max_teams, category')
                .eq('id', cse_topic_id)
                .single()

            const { count: topicCount } = await supabase
                .from('topic_selections')
                .select('*', { count: 'exact', head: true })
                .eq('topic_id', cse_topic_id)

            if (topicCount !== null && topicData && topicCount >= topicData.max_teams) {
                return NextResponse.json({ error: 'This topic is already full. Please choose another.' }, { status: 400 })
            }

            const { error: insertErr } = await supabase
                .from('topic_selections')
                .insert([{ team_id, round_id, topic_id: cse_topic_id, category: topicData?.category || 'debate' }])

            if (insertErr) {
                return NextResponse.json({ error: 'Failed to lock topic. It may have just been taken.' }, { status: 400 })
            }

        } else {
            // T-LEARN MODE: dual topic selection (CSE + Other)

            // Verify CSE topic capacity
            const { data: cseTopic } = await supabase
                .from('topics')
                .select('max_teams')
                .eq('id', cse_topic_id)
                .single()

            const { count: cseCount } = await supabase
                .from('topic_selections')
                .select('*', { count: 'exact', head: true })
                .eq('topic_id', cse_topic_id)

            if (cseCount !== null && cseTopic && cseCount >= cseTopic.max_teams) {
                return NextResponse.json({ error: 'The selected CSE topic is already full (Max 3 teams).' }, { status: 400 })
            }

            // Verify Other topic capacity
            const { data: otherTopic } = await supabase
                .from('topics')
                .select('max_teams')
                .eq('id', other_topic_id)
                .single()

            const { count: otherCount } = await supabase
                .from('topic_selections')
                .select('*', { count: 'exact', head: true })
                .eq('topic_id', other_topic_id)

            if (otherCount !== null && otherTopic && otherCount >= otherTopic.max_teams) {
                return NextResponse.json({ error: 'The selected Other Domain topic is already full (Max 3 teams).' }, { status: 400 })
            }

            const { error: insertErr } = await supabase
                .from('topic_selections')
                .insert([
                    { team_id, round_id, topic_id: cse_topic_id, category: 'cse' },
                    { team_id, round_id, topic_id: other_topic_id, category: 'other' }
                ])

            if (insertErr) {
                return NextResponse.json({ error: 'Failed to lock topics. They might have just been taken by another team.' }, { status: 400 })
            }
        }

        return NextResponse.json({ success: true, message: 'Topics successfully locked!' })
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
