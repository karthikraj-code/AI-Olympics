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

        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (userData?.role !== 'organizer') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const {
            round_id,
            question,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_answer,
            marks
        } = await request.json()

        if (!round_id || !question || !option_a || !option_b || !option_c || !option_d || !correct_answer) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('quiz_questions')
            .insert([{
                round_id, question, option_a, option_b, option_c, option_d, correct_answer, marks: marks || 1
            }])
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, question: data })
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
