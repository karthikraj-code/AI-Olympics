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

        const {
            round_id,
            text_response,
            file_url,
            link,
            github_url,
            quiz_score // Used if it's a quiz auto-calculation from client
        } = await request.json()

        if (!round_id) {
            return NextResponse.json({ error: 'Round ID is required' }, { status: 400 })
        }

        // 1. Check if user is in a team and is leader
        const { data: membership } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', user.id)
            .single()

        if (!membership) return NextResponse.json({ error: 'You are not in a team' }, { status: 400 })

        const { data: team } = await supabase
            .from('teams')
            .select('leader_id')
            .eq('id', membership.team_id)
            .single()

        if (team?.leader_id !== user.id) {
            return NextResponse.json({ error: 'Only the team leader can submit' }, { status: 403 })
        }

        // 2. Validate round time
        const { data: round } = await supabase
            .from('rounds')
            .select('end_time, submission_type')
            .eq('id', round_id)
            .single()

        if (!round) return NextResponse.json({ error: 'Round not found' }, { status: 404 })

        const now = new Date()
        const endTime = new Date(round.end_time)

        if (now > endTime) {
            return NextResponse.json({ error: 'Submission deadline has passed' }, { status: 400 })
        }

        // 3. Insert or update submission
        const { data: existingSub } = await supabase
            .from('submissions')
            .select('id')
            .eq('team_id', membership.team_id)
            .eq('round_id', round_id)
            .single()

        let submissionResult;

        if (existingSub) {
            const { data, error } = await supabase
                .from('submissions')
                .update({
                    text_response,
                    file_url,
                    link,
                    github_url,
                    submitted_at: new Date().toISOString()
                })
                .eq('id', existingSub.id)
                .select()

            if (error) throw error
            submissionResult = data
        } else {
            const { data, error } = await supabase
                .from('submissions')
                .insert([{
                    team_id: membership.team_id,
                    round_id,
                    text_response,
                    file_url,
                    link,
                    github_url
                }])
                .select()

            if (error) throw error
            submissionResult = data
        }

        // 4. Handle auto-grading for quiz if applicable
        if (round.submission_type?.includes('quiz') && quiz_score !== undefined) {

            // Auto assign score bypassing judge table, or create system score
            // For simplicity, we create a system "judge" score based on the quiz result.
            const { data: existingScore } = await supabase
                .from('scores')
                .select('*')
                .eq('team_id', membership.team_id)
                .eq('round_id', round_id)
                .single()

            if (existingScore) {
                await supabase.from('scores').update({ score: quiz_score }).eq('id', existingScore.id)
            } else {
                await supabase.from('scores').insert([{
                    team_id: membership.team_id,
                    round_id,
                    judge_id: user.id, // Using user's own ID as system marker for quizzes, or could omit if schema allowed
                    score: quiz_score,
                    feedback: 'Auto-graded quiz'
                }])
            }
        }

        return NextResponse.json({ success: true, submission: submissionResult })
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
