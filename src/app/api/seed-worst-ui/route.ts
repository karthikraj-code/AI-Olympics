import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()

        // 1. Create the Worst UI Challenge Round
        const now = new Date();
        const future = new Date();
        future.setDate(future.getDate() + 7);

        let roundId;
        const { data: existingRound } = await supabase
            .from('rounds')
            .select('id')
            .eq('name', 'Worst UI Challenge')
            .single();

        if (existingRound) {
            roundId = existingRound.id;
            // Update
            await supabase.from('rounds').update({
                description: 'Teams create a deliberately confusing or frustrating interface that violates design best practices. Examples may include unclear navigation, poor layout structure, excessive visual elements, or misleading buttons. Submit your theme, app live link, demo video link, and github repository.',
                submission_type: ['worst_ui'],
                rubric: {
                    "Creativity in Frustration": 10,
                    "Violation of Design Principles": 10,
                    "Technical Effort": 10,
                    "Overall Worst Experience": 10
                }
            }).eq('id', roundId);
        } else {
            const { data: newRound, error: roundErr } = await supabase
                .from('rounds')
                .insert([{
                    name: 'Worst UI Challenge',
                    description: 'Teams create a deliberately confusing or frustrating interface that violates design best practices. Examples may include unclear navigation, poor layout structure, excessive visual elements, or misleading buttons. Submit your theme, app live link, demo video link, and github repository.',
                    start_time: now.toISOString(),
                    end_time: future.toISOString(),
                    submission_type: ['worst_ui'],
                    rubric: {
                        "Creativity in Frustration": 10,
                        "Violation of Design Principles": 10,
                        "Technical Effort": 10,
                        "Overall Worst Experience": 10
                    }
                }])
                .select()
                .single()

            if (roundErr) throw roundErr;
            roundId = newRound.id;
        }

        return NextResponse.json({
            success: true,
            message: `Seeded Worst UI Challenge to round ${roundId}`
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
