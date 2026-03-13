import { createClient } from '@/utils/supabase/server'

export default async function DebugPage() {
    const supabase = await createClient()
    
    const { data: teams, count: teamsCount } = await supabase.from('teams').select('*', { count: 'exact' })
    const { data: submissions, count: subsCount } = await supabase.from('submissions').select('*', { count: 'exact' })
    const { data: rounds, count: roundsCount } = await supabase.from('rounds').select('*', { count: 'exact' })
    const { data: scores, count: scoresCount } = await supabase.from('scores').select('*', { count: 'exact' })

    return (
        <div className="p-8 space-y-4 font-mono text-sm">
            <h1 className="text-xl font-bold">Data Debug</h1>
            <div className="space-y-2">
                <p>Teams: {teamsCount} found</p>
                <p>Submissions: {subsCount} found</p>
                <p>Rounds: {roundsCount} found</p>
                <p>Scores: {scoresCount} found</p>
            </div>
            <hr />
            <h2 className="font-bold">Raw Submissions (Top 5):</h2>
            <pre className="p-4 bg-gray-100 rounded overflow-auto">
                {JSON.stringify(submissions?.slice(0, 5), null, 2)}
            </pre>
            <h2 className="font-bold">Raw Teams (Top 5):</h2>
            <pre className="p-4 bg-gray-100 rounded overflow-auto">
                {JSON.stringify(teams?.slice(0, 5), null, 2)}
            </pre>
        </div>
    )
}
