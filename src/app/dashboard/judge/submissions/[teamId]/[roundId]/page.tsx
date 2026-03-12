'use client'
import { getSession } from "next-auth/react"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, Link as LinkIcon, Download, AlertCircle, Save } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function GradeSubmissionPage() {
    const params = useParams()
    const router = useRouter()
    const teamId = params.teamId as string
    const roundId = params.roundId as string
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const [team, setTeam] = useState<any>(null)
    const [round, setRound] = useState<any>(null)
    const [submission, setSubmission] = useState<any>(null)
    const [existingScore, setExistingScore] = useState<any>(null)

    const [score, setScore] = useState<number | ''>('')
    const [feedback, setFeedback] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const session = await getSession();
    const user = session?.user as any
            if (!user) return

            // Fetch Team, Round, Submission, and existing Score concurrently
            const [
                { data: t },
                { data: r },
                { data: sub },
                { data: sc }
            ] = await Promise.all([
                supabase.from('teams').select('*').eq('id', teamId).single(),
                supabase.from('rounds').select('*').eq('id', roundId).single(),
                supabase.from('submissions').select('*').eq('team_id', teamId).eq('round_id', roundId).single(),
                supabase.from('scores').select('*').eq('team_id', teamId).eq('round_id', roundId).eq('judge_id', user.id).single()
            ])

            setTeam(t)
            setRound(r)
            setSubmission(sub)
            if (sc) {
                setExistingScore(sc)
                setScore(sc.score)
                setFeedback(sc.feedback || '')
            }
        } catch (err: any) {
            console.error(err)
            setError('Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        setSuccess('')

        try {
            const res = await fetch('/api/judge/score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    team_id: teamId,
                    round_id: roundId,
                    score: Number(score),
                    feedback
                })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to save score')
            }

            setSuccess('Score saved successfully!')
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading submission...</div>
    if (!team || !round || !submission) return <div className="p-8 text-center text-slate-500">Data not found or no submission exists.</div>

    const isQuiz = round.submission_type?.includes('quiz')
    const rubric = round.rubric || {}

    // Parse total possible score from rubric if it's an object with numbers
    const maxScore = Object.values(rubric).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0)

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <Link href="/dashboard/judge/submissions" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Submissions
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Left Col: Submission Viewer */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">{team.team_name}</h2>
                        <p className="text-blue-600 font-medium mb-6">Round: {round.name}</p>

                        <div className="space-y-6">
                            {submission.text_response && !isQuiz && (
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2 font-medium text-gray-700">
                                        <FileText size={18} /> Text Response
                                    </div>
                                    <div className="p-4 bg-white text-gray-800 whitespace-pre-wrap">
                                        {submission.text_response}
                                    </div>
                                </div>
                            )}

                            {isQuiz && (
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="bg-blue-50 px-4 py-2 border-b border-blue-200 flex items-center gap-2 font-medium text-blue-600">
                                        <AlertCircle size={18} /> Auto-Graded Quiz Details
                                    </div>
                                    <div className="p-4 bg-white text-gray-800">
                                        <p className="mb-2 text-sm text-gray-600">The system auto-grades quizzes immediately upon submission. Raw submitted JSON state:</p>
                                        <pre className="bg-gray-50 p-3 rounded text-xs border border-gray-100 overflow-x-auto">
                                            {submission.text_response}
                                        </pre>
                                    </div>
                                </div>
                            )}

                            {submission.link && (
                                <div className="border border-gray-200 rounded-lg overflow-hidden flex items-center justify-between p-4 bg-white">
                                    <div className="flex items-center gap-3 font-medium text-gray-700">
                                        <LinkIcon size={20} className="text-blue-600" />
                                        External Link Submitted
                                    </div>
                                    <a href={submission.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline whitespace-nowrap">
                                        Open Link &rarr;
                                    </a>
                                </div>
                            )}

                            {submission.file_url && (
                                <div className="border border-gray-200 rounded-lg overflow-hidden flex items-center justify-between p-4 bg-white">
                                    <div className="flex items-center gap-3 font-medium text-gray-700">
                                        <Download size={20} className="text-blue-600" />
                                        File Uploaded
                                    </div>
                                    <a href={submission.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline whitespace-nowrap">
                                        View File &rarr;
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Col: Grading Panel */}
                <div className="space-y-6">
                    <form onSubmit={handleSave} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-6">
                        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                <FileText size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Evaluation Form</h2>
                        </div>

                        {/* Rubric Viewer */}
                        {typeof rubric === 'object' && Object.keys(rubric).length > 0 && (
                            <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h4 className="font-semibold text-gray-900 text-sm mb-3">Scoring Rubric</h4>
                                <div className="space-y-2 text-sm">
                                    {Object.entries(rubric).map(([key, maxVal]) => (
                                        <div key={key} className="flex justify-between items-center text-gray-700">
                                            <span>{key}</span>
                                            <span className="font-mono bg-white px-2 py-0.5 border border-gray-300 rounded font-medium">/ {String(maxVal)}</span>
                                        </div>
                                    ))}
                                    <div className="pt-2 mt-2 border-t border-gray-300 flex justify-between font-bold text-gray-900">
                                        <span>Total Max Score</span>
                                        <span>{maxScore > 0 ? maxScore : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">Total Score Given</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        max={maxScore > 0 ? maxScore : undefined}
                                        value={score}
                                        onChange={(e) => setScore(e.target.value === '' ? '' : Number(e.target.value))}
                                        required
                                        className="w-full text-lg px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-medium"
                                        placeholder={`e.g. ${maxScore > 0 ? maxScore : 100}`}
                                    />
                                    {maxScore > 0 && <span className="text-gray-500 font-bold whitespace-nowrap text-lg">/ {maxScore} pts</span>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">Feedback (Optional)</label>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                    placeholder="Provide constructive feedback for the team..."
                                />
                            </div>

                            {error && <div className="p-3 bg-slate-50 text-slate-600 text-sm rounded-md border border-slate-100">{error}</div>}
                            {success && <div className="p-3 bg-blue-50 text-blue-600 text-sm rounded-md border border-blue-100 font-medium">{success}</div>}

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
                            >
                                <Save size={20} />
                                {saving ? 'Saving...' : existingScore ? 'Update Evaluation' : 'Submit Evaluation'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
