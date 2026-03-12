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

        const { team_id, judge_id, action } = await request.json()

        if (!team_id || !judge_id || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        if (action === 'assign') {
            const { error } = await supabase
                .from('judge_assignments')
                .insert([{ team_id, judge_id }])
            if (error) throw error
        } else if (action === 'remove') {
            const { error } = await supabase
                .from('judge_assignments')
                .delete()
                .eq('team_id', team_id)
                .eq('judge_id', judge_id)
            if (error) throw error
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
