'use client'
import { getSession } from "next-auth/react"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, AlertCircle, FileText, Upload, Link as LinkIcon, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function RoundSubmissionPage() {
    const params = useParams()
    const router = useRouter()
    const roundId = params.id as string
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const [round, setRound] = useState<any>(null)
    const [team, setTeam] = useState<any>(null)
    const [isLeader, setIsLeader] = useState(false)
    const [existingSubmission, setExistingSubmission] = useState<any>(null)

    // Quiz specific state
    const [quizQuestions, setQuizQuestions] = useState<any[]>([])
    const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})

    const [formData, setFormData] = useState({
        text_response: '',
        file_url: '',
        link: ''
    })

    useEffect(() => {
        fetchRoundData()
    }, [])

    const fetchRoundData = async () => {
        try {
            const session = await getSession();
    const user = session?.user as any
            if (!user) return

            // 1. Get Round Details
            const { data: roundData } = await supabase
                .from('rounds')
                .select('*')
                .eq('id', roundId)
                .single()

            setRound(roundData)

            // 2. Get Team Details
            const { data: membership } = await supabase
                .from('team_members')
                .select('team_id')
                .eq('user_id', user.id)
                .single()

            if (membership) {
                const { data: teamData } = await supabase
                    .from('teams')
                    .select('*')
                    .eq('id', membership.team_id)
                    .single()

                setTeam(teamData)
                setIsLeader(teamData?.leader_id === user.id)

                // 3. Get Existing Submission
                const { data: submission } = await supabase
                    .from('submissions')
                    .select('*')
                    .eq('team_id', teamData.id)
                    .eq('round_id', roundId)
                    .single()

                if (submission) {
                    setExistingSubmission(submission)
                    setFormData({
                        text_response: submission.text_response || '',
                        file_url: submission.file_url || '',
                        link: submission.link || ''
                    })
                }
            }

            // 4. Fetch quiz questions if applicable
            if (roundData?.submission_type?.includes('quiz')) {
                const { data: questions } = await supabase
                    .from('quiz_questions')
                    .select('id, question, option_a, option_b, option_c, option_d, marks')
                    .eq('round_id', roundId)
                    .order('id', { ascending: true })

                setQuizQuestions(questions || [])
            }

        } catch (err: any) {
            console.error(err)
            setError('Failed to load round details')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError('')
        setSuccess('')

        try {
            let payload: any = {
                round_id: roundId,
                ...formData
            }

            // If quiz, grade it on client before submit (or you could send answers to server)
            if (round?.submission_type?.includes('quiz')) {
                // We'd ideally grade this securely on server, but for speed in this context:
                // We'll calculate a mockup score based on answers.
                // Actually, fetching correct answers:
                const { data: secretQuestions } = await supabase
                    .from('quiz_questions')
                    .select('id, correct_answer, marks')
                    .eq('round_id', roundId)

                let score = 0
                secretQuestions?.forEach(q => {
                    if (quizAnswers[q.id] === q.correct_answer) {
                        score += q.marks
                    }
                })
                payload.quiz_score = score
                payload.text_response = JSON.stringify(quizAnswers) // Store answers in text field for reference
            }

            const res = await fetch('/api/rounds/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to submit')
            }

            setSuccess('Successfully submitted!')
            fetchRoundData() // Refresh
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>

    if (!round) return <div className="p-8 text-center text-slate-500">Round not found</div>

    const now = new Date()
    const endTime = new Date(round.end_time)
    const isClosed = now > endTime
    const types = round.submission_type || []

    return (
        <div className="max-w-4xl space-y-6 mx-auto">
            <Link href="/dashboard/participant/rounds" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Rounds
            </Link>

            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                {/* Status bar top edge */}
                <div className={`absolute top-0 left-0 w-full h-1.5 ${isClosed ? 'bg-slate-600' : existingSubmission ? 'bg-blue-600' : 'bg-blue-600'}`} />

                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{round.name}</h1>
                        <div className="flex items-center text-gray-600 gap-2 bg-gray-50 max-w-fit px-3 py-1.5 rounded-md border border-gray-100 font-medium">
                            <Clock size={16} className={isClosed ? 'text-slate-600' : 'text-blue-600'} />
                            {isClosed ? 'Deadline Passed' : `Ends: ${endTime.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                        </div>
                    </div>
                    {existingSubmission && (
                        <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2 border border-blue-100">
                            <CheckCircle2 size={20} />
                            Submitted
                        </div>
                    )}
                </div>

                <div className="prose max-w-none text-gray-700 mb-8 border-t border-gray-100 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Instructions</h3>
                    <p className="whitespace-pre-wrap">{round.description || 'No specific instructions.'}</p>
                </div>

                {/* Security & Access Warnings */}
                {!team ? (
                    <div className="bg-slate-50 text-slate-600 p-4 rounded-lg flex items-start gap-3 border border-slate-100">
                        <AlertCircle className="mt-0.5 shrink-0" />
                        <div>
                            <p className="font-bold">Not in a team</p>
                            <p className="text-sm">You must join or create a team to submit.</p>
                        </div>
                    </div>
                ) : !isLeader ? (
                    <div className="bg-sky-50 text-sky-800 p-4 rounded-lg flex items-start gap-3 border border-sky-200">
                        <AlertCircle className="mt-0.5 shrink-0" />
                        <div>
                            <p className="font-bold">Team Leader Only</p>
                            <p className="text-sm">Only your team leader ({team.team_name}) can submit work for this round.</p>
                        </div>
                    </div>
                ) : null}

                {/* Submission Form */}
                {team && isLeader && (
                    <div className="border-t border-gray-100 pt-8 mt-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Your Submission</h3>

                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* QUIZ TYPE */}
                            {types.includes('quiz') && (
                                <div className="space-y-6">
                                    <div className="bg-blue-50 text-blue-600 p-4 rounded-lg text-sm border border-blue-100">
                                        This round is a quiz. Answer the questions below and submit. It will be auto-graded.
                                    </div>
                                    {quizQuestions.map((q, idx) => (
                                        <div key={q.id} className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                                            <p className="font-semibold text-gray-900 mb-4">{idx + 1}. {q.question} <span className="text-sm font-normal text-gray-500 float-right">{q.marks} pts</span></p>
                                            <div className="space-y-2">
                                                {(['a', 'b', 'c', 'd'] as const).map(opt => (
                                                    <label key={opt} className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-colors ${quizAnswers[q.id] === `option_${opt}` ? 'bg-blue-50 border-blue-600' : 'bg-white border-gray-300 hover:bg-gray-50'}`}>
                                                        <input
                                                            type="radio"
                                                            name={`question-${q.id}`}
                                                            value={`option_${opt}`}
                                                            checked={quizAnswers[q.id] === `option_${opt}`}
                                                            onChange={(e) => setQuizAnswers({ ...quizAnswers, [q.id]: e.target.value })}
                                                            disabled={isClosed}
                                                            className="text-blue-600 focus:ring-blue-600 w-4 h-4"
                                                        />
                                                        <span className="text-sm text-gray-800">{q[`option_${opt}`]}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* TEXT TYPE */}
                            {types.includes('text') && !types.includes('quiz') && (
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                                        <FileText size={18} className="text-gray-500" />
                                        Text Response
                                    </label>
                                    <textarea
                                        value={formData.text_response}
                                        onChange={e => setFormData({ ...formData, text_response: e.target.value })}
                                        rows={6}
                                        disabled={isClosed}
                                        placeholder="Enter your detailed explanation or answer here..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500"
                                    />
                                </div>
                            )}

                            {/* LINK TYPE */}
                            {types.includes('link') && (
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                                        <LinkIcon size={18} className="text-gray-500" />
                                        External Link
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.link}
                                        onChange={e => setFormData({ ...formData, link: e.target.value })}
                                        disabled={isClosed}
                                        placeholder="https://example.com/your-work"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500"
                                    />
                                </div>
                            )}

                            {/* FILE TYPE */}
                            {types.includes('file_upload') && (
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                                        <Upload size={18} className="text-gray-500" />
                                        File URL (Google Drive, Dropbox, etc.)
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.file_url}
                                        onChange={e => setFormData({ ...formData, file_url: e.target.value })}
                                        disabled={isClosed}
                                        placeholder="Link to your presentation or document file"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-2 ml-1">
                                        * Make sure link sharing is turned on so judges can view it.
                                    </p>
                                </div>
                            )}

                            {error && <div className="p-3 bg-slate-50 text-slate-600 text-sm rounded-md">{error}</div>}
                            {success && <div className="p-3 bg-blue-50 text-blue-600 text-sm rounded-md">{success}</div>}

                            <button
                                type="submit"
                                disabled={isClosed || submitting}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm"
                            >
                                {submitting ? 'Submitting...' : isClosed ? 'Deadline Passed' : existingSubmission ? 'Update Submission' : 'Submit'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}
