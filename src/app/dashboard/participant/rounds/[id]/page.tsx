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

    // T-Learn specific state
    const [tlearnTopics, setTlearnTopics] = useState<any[]>([])
    const [selectedCseTopic, setSelectedCseTopic] = useState('')
    const [selectedOtherTopic, setSelectedOtherTopic] = useState('')
    const [teamTopics, setTeamTopics] = useState<any[]>([])
    // Debate specific state
    const [debateTopics, setDebateTopics] = useState<any[]>([])
    const [selectedDebateTopic, setSelectedDebateTopic] = useState('')
    const [teamDebateTopic, setTeamDebateTopic] = useState<any>(null)
    // Bias investigation specific state
    const [biasTopics, setBiasTopics] = useState<any[]>([])
    const [selectedBiasTopic, setSelectedBiasTopic] = useState('')
    const [teamBiasTopic, setTeamBiasTopic] = useState<any>(null)
    const [quizQuestions, setQuizQuestions] = useState<any[]>([])
    const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})

    const [formData, setFormData] = useState({
        text_response: '',
        file_url: '',
        link: '',
        github_url: '',
        chatgpt_link_2: ''
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
                        link: submission.link || '',
                        github_url: submission.github_url || '',
                        chatgpt_link_2: submission.chatgpt_link_2 || ''
                    })
                }
            }

            // 4. Fetch quiz questions if applicable
            if (roundData?.submission_type?.includes('quiz')) {
                const { data: questions } = await supabase
                    .from('quiz_questions')
                    .select('id, question, option_a, option_b, option_c, option_d, marks')
                    .eq('round_id', roundId)

                const sortedQuestions = (questions || []).sort((a, b) => {
                    const matchA = a.question.match(/^(\d+)\./);
                    const matchB = b.question.match(/^(\d+)\./);
                    const numA = matchA ? parseInt(matchA[1]) : 999999;
                    const numB = matchB ? parseInt(matchB[1]) : 999999;
                    if (numA !== numB) return numA - numB;
                    return a.question.localeCompare(b.question);
                });

                setQuizQuestions(sortedQuestions)
            }

            // 5. Fetch T-Learn Topics if applicable
            if (roundData?.submission_type?.includes('tlearn_topics')) {
                // Fetch all topics and the current counts
                const { data: topicsData } = await supabase
                    .from('topics')
                    .select('id, category, name, max_teams')
                    .eq('round_id', roundId)

                // Fetch how many teams selected each topic to see if it's full
                const { data: countsData } = await supabase
                    .from('topic_selections')
                    .select('topic_id')
                    .eq('round_id', roundId)

                if (topicsData && countsData) {
                    const countMap: Record<string, number> = {}
                    countsData.forEach(c => {
                        countMap[c.topic_id] = (countMap[c.topic_id] || 0) + 1
                    })

                    const enrichedTopics = topicsData.map(t => ({
                        ...t,
                        current_teams: countMap[t.id] || 0,
                        is_full: (countMap[t.id] || 0) >= t.max_teams
                    }))
                    setTlearnTopics(enrichedTopics)
                }

                // If user is in a team, fetch the team's selected topics
                if (team) {
                    const { data: teamSelectionData } = await supabase
                        .from('topic_selections')
                        .select('topic_id, topics(name, category)')
                        .eq('round_id', roundId)
                        .eq('team_id', team.id)

                    if (teamSelectionData && teamSelectionData.length > 0) {
                        setTeamTopics(teamSelectionData)
                    }
                }
            }

            // 6. Fetch Debate Topics if applicable
            if (roundData?.submission_type?.includes('debate_topics')) {
                const { data: topicsData } = await supabase
                    .from('topics')
                    .select('id, name, max_teams')
                    .eq('round_id', roundId)
                    .eq('category', 'debate')

                const { data: countsData } = await supabase
                    .from('topic_selections')
                    .select('topic_id')
                    .eq('round_id', roundId)

                if (topicsData && countsData) {
                    const countMap: Record<string, number> = {}
                    countsData.forEach(c => {
                        countMap[c.topic_id] = (countMap[c.topic_id] || 0) + 1
                    })

                    const enrichedTopics = topicsData.map(t => ({
                        ...t,
                        current_teams: countMap[t.id] || 0,
                        is_full: (countMap[t.id] || 0) >= t.max_teams
                    }))
                    setDebateTopics(enrichedTopics)
                }

                if (team) {
                    const { data: debateSelection } = await supabase
                        .from('topic_selections')
                        .select('topic_id, topics(name)')
                        .eq('round_id', roundId)
                        .eq('team_id', team.id)
                        .single()

                    if (debateSelection) {
                        setTeamDebateTopic(debateSelection)
                    }
                }
            }

            // 7. Fetch Bias Investigation Topics if applicable
            if (roundData?.submission_type?.includes('bias_investigation')) {
                const { data: topicsData } = await supabase
                    .from('topics')
                    .select('id, name, max_teams')
                    .eq('round_id', roundId)
                    .eq('category', 'bias')

                const { data: countsData } = await supabase
                    .from('topic_selections')
                    .select('topic_id')
                    .eq('round_id', roundId)

                if (topicsData && countsData) {
                    const countMap: Record<string, number> = {}
                    countsData.forEach(c => {
                        countMap[c.topic_id] = (countMap[c.topic_id] || 0) + 1
                    })

                    const enrichedTopics = topicsData.map(t => ({
                        ...t,
                        current_teams: countMap[t.id] || 0,
                        is_full: (countMap[t.id] || 0) >= t.max_teams
                    }))
                    setBiasTopics(enrichedTopics)
                }

                if (team) {
                    const { data: biasSelection } = await supabase
                        .from('topic_selections')
                        .select('topic_id, topics(name)')
                        .eq('round_id', roundId)
                        .eq('team_id', team.id)
                        .single()

                    if (biasSelection) {
                        setTeamBiasTopic(biasSelection)
                    }
                }
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
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {round.round_number && <span className="text-blue-600 mr-3">Round {round.round_number}:</span>}
                            {round.name}
                        </h1>
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
                                            <p className="font-semibold text-gray-900 mb-4">{idx + 1}. {q.question.replace(/^\d+\.\s*/, '')} <span className="text-sm font-normal text-gray-500 float-right">{q.marks} pts</span></p>
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

                            {/* T-LEARN TOPICS */}
                            {types.includes('tlearn_topics') && (
                                <div className="space-y-6">
                                    <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm border border-blue-100 mb-4">
                                        <p className="font-semibold mb-1">Topic Selection Guidelines:</p>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li>Choose ONE CSE topic and ONE Other Domain topic.</li>
                                            <li>Topics have a strict capacity of a maximum of 3 teams.</li>
                                            <li>Only the Team Leader can lock the topics. Once locked, it cannot be changed.</li>
                                        </ul>
                                    </div>

                                    {teamTopics.length > 0 ? (
                                        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-lg border border-emerald-200">
                                            <h4 className="font-bold flex items-center gap-2 mb-3">
                                                <CheckCircle2 size={18} />
                                                Your Team's Locked Topics
                                            </h4>
                                            <ul className="space-y-2">
                                                {teamTopics.map((ts, idx) => (
                                                    <li key={idx} className="bg-white px-4 py-2 rounded border border-emerald-100 shadow-sm flex flex-col">
                                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{ts.topics?.category === 'cse' ? 'CSE Domain' : 'Other Domain'}</span>
                                                        <span className="text-gray-900 font-medium">{ts.topics?.name}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ) : (
                                        isLeader ? (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-900 mb-2">Select CSE Topic</label>
                                                    <select
                                                        value={selectedCseTopic}
                                                        onChange={e => setSelectedCseTopic(e.target.value)}
                                                        disabled={isClosed}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all bg-white"
                                                    >
                                                        <option value="">-- Choose a CSE Topic --</option>
                                                        {tlearnTopics.filter(t => t.category === 'cse').map(t => (
                                                            <option key={t.id} value={t.id} disabled={t.is_full}>
                                                                {t.name} {t.is_full ? '(FULL - 3/3 Teams)' : `(${t.current_teams}/3 Teams)`}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-900 mb-2">Select Other Domain Topic</label>
                                                    <select
                                                        value={selectedOtherTopic}
                                                        onChange={e => setSelectedOtherTopic(e.target.value)}
                                                        disabled={isClosed}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all bg-white"
                                                    >
                                                        <option value="">-- Choose an Other Domain Topic --</option>
                                                        {tlearnTopics.filter(t => t.category === 'other').map(t => (
                                                            <option key={t.id} value={t.id} disabled={t.is_full}>
                                                                {t.name} {t.is_full ? '(FULL - 3/3 Teams)' : `(${t.current_teams}/3 Teams)`}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                
                                                <button
                                                    type="button"
                                                    disabled={isClosed || submitting || !selectedCseTopic || !selectedOtherTopic}
                                                    onClick={async () => {
                                                        setSubmitting(true)
                                                        setError('')
                                                        try {
                                                            const res = await fetch('/api/rounds/topics/select', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({
                                                                    round_id: roundId,
                                                                    team_id: team.id,
                                                                    cse_topic_id: selectedCseTopic,
                                                                    other_topic_id: selectedOtherTopic
                                                                })
                                                            })
                                                            const data = await res.json()
                                                            if (!res.ok) throw new Error(data.error)
                                                            setSuccess('Topics successfully locked!')
                                                            fetchRoundData()
                                                        } catch (err: any) {
                                                            setError(err.message)
                                                        } finally {
                                                            setSubmitting(false)
                                                        }
                                                    }}
                                                    className="w-full bg-slate-800 text-white py-3 rounded-lg font-medium hover:bg-slate-900 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm"
                                                >
                                                    {submitting ? 'Locking...' : 'Lock Topics'}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-gray-50 border border-gray-200 rounded text-gray-600 text-sm italic">
                                                Your team leader has not yet locked in the topics for this round.
                                            </div>
                                        )
                                    )}
                                </div>
                            )}

                            {/* T-LEARN SPECIFIC LINKS */}
                            {types.includes('tlearn_topics') && (
                                <div className="space-y-6 pt-4 border-t border-gray-100 mt-4">
                                    <h4 className="font-bold text-gray-900 mb-4">Final Submission Links</h4>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                                            <LinkIcon size={18} className="text-gray-500" />
                                            Google Slides PPT Link
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.link || ''}
                                            required
                                            onChange={e => setFormData({ ...formData, link: e.target.value })}
                                            disabled={isClosed}
                                            placeholder="https://docs.google.com/presentation/d/..."
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                                            <LinkIcon size={18} className="text-gray-500" />
                                            ChatGPT shared chat link for evaluations (Link 1)
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.text_response || ''}
                                            required
                                            onChange={e => setFormData({ ...formData, text_response: e.target.value })}
                                            disabled={isClosed}
                                            placeholder="https://chatgpt.com/share/..."
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                                            <LinkIcon size={18} className="text-gray-500" />
                                            ChatGPT shared chat link for evaluations (Link 2)
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.chatgpt_link_2 || ''}
                                            required
                                            onChange={e => setFormData({ ...formData, chatgpt_link_2: e.target.value })}
                                            disabled={isClosed}
                                            placeholder="https://chatgpt.com/share/..."
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* DEBATE TOPICS */}
                            {types.includes('debate_topics') && (
                                <div className="space-y-6">
                                    <div className="bg-amber-50 text-amber-800 p-4 rounded-lg text-sm border border-amber-100">
                                        <p className="font-semibold mb-1">Debate Round Guidelines:</p>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li>Select ONE debate topic below. Maximum 4 teams per topic.</li>
                                            <li>Use the AI system prompt provided by the organizer to debate against AI.</li>
                                            <li>Submit your shared ChatGPT conversation link as your final submission.</li>
                                            <li>Only the Team Leader can lock the topic and submit.</li>
                                        </ul>
                                    </div>

                                    {/* System Prompt Panel */}
                                    {round.system_prompt && (
                                    <div className="border border-amber-200 rounded-lg overflow-hidden">
                                        <div className="bg-amber-600 px-4 py-3 flex items-center justify-between">
                                            <span className="text-white font-semibold text-sm flex items-center gap-2">
                                                <FileText size={16} />
                                                AI System Prompt (paste this into ChatGPT)
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(round.system_prompt || '')
                                                    alert('System prompt copied to clipboard!')
                                                }}
                                                className="text-xs bg-white text-amber-700 font-semibold px-3 py-1 rounded hover:bg-amber-50 transition-colors flex items-center gap-1"
                                            >
                                                📋 Copy Prompt
                                            </button>
                                        </div>
                                        <pre className="p-4 bg-amber-50 text-amber-900 text-xs whitespace-pre-wrap font-mono leading-relaxed max-h-64 overflow-y-auto">
                                            {round.system_prompt}
                                        </pre>
                                    </div>
                                    )}

                                    {teamDebateTopic ? (
                                        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-lg border border-emerald-200">
                                            <h4 className="font-bold flex items-center gap-2 mb-2">
                                                <CheckCircle2 size={18} />
                                                Locked Debate Topic
                                            </h4>
                                            <p className="font-medium bg-white px-4 py-2 rounded border border-emerald-100">
                                                {teamDebateTopic.topics?.name}
                                            </p>
                                        </div>
                                    ) : (
                                        isLeader ? (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-900 mb-2">Select Your Debate Topic</label>
                                                    <select
                                                        value={selectedDebateTopic}
                                                        onChange={e => setSelectedDebateTopic(e.target.value)}
                                                        disabled={isClosed}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all bg-white"
                                                    >
                                                        <option value="">-- Choose a Debate Topic --</option>
                                                        {debateTopics.map(t => (
                                                            <option key={t.id} value={t.id} disabled={t.is_full}>
                                                                {t.name} {t.is_full ? '(FULL - 4/4 Teams)' : `(${t.current_teams}/4 Teams)`}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <button
                                                    type="button"
                                                    disabled={isClosed || submitting || !selectedDebateTopic}
                                                    onClick={async () => {
                                                        setSubmitting(true)
                                                        setError('')
                                                        try {
                                                            const res = await fetch('/api/rounds/topics/select', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({
                                                                    round_id: roundId,
                                                                    team_id: team.id,
                                                                    cse_topic_id: selectedDebateTopic,
                                                                    other_topic_id: selectedDebateTopic,
                                                                    single_topic: true
                                                                })
                                                            })
                                                            const data = await res.json()
                                                            if (!res.ok) throw new Error(data.error)
                                                            setSuccess('Topic locked!')
                                                            fetchRoundData()
                                                        } catch (err: any) {
                                                            setError(err.message)
                                                        } finally {
                                                            setSubmitting(false)
                                                        }
                                                    }}
                                                    className="w-full bg-amber-600 text-white py-3 rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm"
                                                >
                                                    {submitting ? 'Locking...' : 'Lock Topic'}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-gray-50 border border-gray-200 rounded text-gray-600 text-sm italic">
                                                Your team leader has not yet locked in a debate topic.
                                            </div>
                                        )
                                    )}

                                    {/* ChatGPT Link */}
                                    <div className="pt-4 border-t border-gray-100">
                                        <h4 className="font-bold text-gray-900 mb-4">Debate Submission</h4>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                                            <LinkIcon size={18} className="text-gray-500" />
                                            ChatGPT Shared Chat Link (your debate transcript)
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.link || ''}
                                            required
                                            onChange={e => setFormData({ ...formData, link: e.target.value })}
                                            disabled={isClosed}
                                            placeholder="https://chatgpt.com/share/..."
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-2 ml-1">* Make sure your ChatGPT chat is set to shared/public before submitting the link.</p>
                                    </div>
                                </div>
                            )}

                            {/* BIAS INVESTIGATION */}
                            {types.includes('bias_investigation') && (
                                <div className="space-y-6">
                                    <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm border border-blue-100">
                                        <p className="font-semibold mb-1">AI Bias Investigation Guidelines:</p>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li>Select ONE investigative prompt below. Maximum 3 teams per prompt.</li>
                                            <li>Generate an image/output using an AI tool based on the prompt.</li>
                                            <li>Submit the URL of the generated image and analyze potential biases.</li>
                                            <li>Only the Team Leader can lock the prompt and submit.</li>
                                        </ul>
                                    </div>

                                    {teamBiasTopic ? (
                                        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-lg border border-emerald-200">
                                            <h4 className="font-bold flex items-center gap-2 mb-2">
                                                <CheckCircle2 size={18} />
                                                Locked Investigative Prompt
                                            </h4>
                                            <p className="font-medium bg-white px-4 py-2 rounded border border-emerald-100">
                                                {teamBiasTopic.topics?.name}
                                            </p>
                                        </div>
                                    ) : (
                                        isLeader ? (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-900 mb-2">Select Your Prompt</label>
                                                    <select
                                                        value={selectedBiasTopic}
                                                        onChange={e => setSelectedBiasTopic(e.target.value)}
                                                        disabled={isClosed}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
                                                    >
                                                        <option value="">-- Choose a Prompt --</option>
                                                        {biasTopics.map(t => (
                                                            <option key={t.id} value={t.id} disabled={t.is_full}>
                                                                {t.name.substring(0, 100)}... {t.is_full ? '(FULL)' : `(${t.current_teams}/3 Teams)`}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <button
                                                    type="button"
                                                    disabled={isClosed || submitting || !selectedBiasTopic}
                                                    onClick={async () => {
                                                        setSubmitting(true)
                                                        setError('')
                                                        try {
                                                            const res = await fetch('/api/rounds/topics/select', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({
                                                                    round_id: roundId,
                                                                    team_id: team.id,
                                                                    cse_topic_id: selectedBiasTopic,
                                                                    other_topic_id: selectedBiasTopic,
                                                                    single_topic: true
                                                                })
                                                            })
                                                            const data = await res.json()
                                                            if (!res.ok) throw new Error(data.error)
                                                            setSuccess('Prompt locked!')
                                                            fetchRoundData()
                                                        } catch (err: any) {
                                                            setError(err.message)
                                                        } finally {
                                                            setSubmitting(false)
                                                        }
                                                    }}
                                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm"
                                                >
                                                    {submitting ? 'Locking...' : 'Lock Prompt'}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-gray-50 border border-gray-200 rounded text-gray-600 text-sm italic">
                                                Your team leader has not yet locked in a prompt.
                                            </div>
                                        )
                                    )}

                                    {/* Bias Submission */}
                                    <div className="pt-4 border-t border-gray-100 space-y-4">
                                        <h4 className="font-bold text-gray-900">Investigation Submission</h4>
                                        
                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                                                <Upload size={18} className="text-gray-500" />
                                                AI Generated Image URL
                                            </label>
                                            <input
                                                type="url"
                                                value={formData.file_url || ''}
                                                required
                                                onChange={e => setFormData({ ...formData, file_url: e.target.value })}
                                                disabled={isClosed}
                                                placeholder="https://..."
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-gray-50"
                                            />
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                                                <FileText size={18} className="text-gray-500" />
                                                Bias Analysis Points
                                            </label>
                                            <textarea
                                                value={formData.text_response || ''}
                                                required
                                                onChange={e => setFormData({ ...formData, text_response: e.target.value })}
                                                rows={5}
                                                disabled={isClosed}
                                                placeholder="Identify and explain the biases present in the AI output..."
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-gray-50"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* WORST UI CHALLENGE */}
                            {types.includes('worst_ui') && (
                                <div className="space-y-6">
                                    <div className="bg-red-50 text-red-800 p-4 rounded-lg text-sm border border-red-100">
                                        <p className="font-semibold mb-1">Worst UI Challenge Guidelines:</p>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li>Create a deliberately confusing or frustrating interface.</li>
                                            <li>Submit your chosen theme, a live link to the app, a demo video/link, and the source code repository.</li>
                                            <li>Only the Team Leader can submit the final links.</li>
                                        </ul>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="font-bold text-gray-900">Submission Details</h4>
                                        
                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                                                <FileText size={18} className="text-gray-500" />
                                                Theme Chosen
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.text_response || ''}
                                                required
                                                onChange={e => setFormData({ ...formData, text_response: e.target.value })}
                                                disabled={isClosed}
                                                placeholder="e.g., A confusing flight booking system"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all disabled:bg-gray-50"
                                            />
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                                                <LinkIcon size={18} className="text-gray-500" />
                                                Application Live Link
                                            </label>
                                            <input
                                                type="url"
                                                value={formData.link || ''}
                                                required
                                                onChange={e => setFormData({ ...formData, link: e.target.value })}
                                                disabled={isClosed}
                                                placeholder="https://your-app.com"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all disabled:bg-gray-50"
                                            />
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                                                <LinkIcon size={18} className="text-gray-500" />
                                                Demo Link (Video/Drive)
                                            </label>
                                            <input
                                                type="url"
                                                value={formData.file_url || ''}
                                                required
                                                onChange={e => setFormData({ ...formData, file_url: e.target.value })}
                                                disabled={isClosed}
                                                placeholder="https://drive.google.com/..."
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all disabled:bg-gray-50"
                                            />
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                                                <LinkIcon size={18} className="text-gray-500" />
                                                GitHub Repository Link
                                            </label>
                                            <input
                                                type="url"
                                                value={formData.github_url || ''}
                                                required
                                                onChange={e => setFormData({ ...formData, github_url: e.target.value })}
                                                disabled={isClosed}
                                                placeholder="https://github.com/..."
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all disabled:bg-gray-50"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TEXT TYPE */}
                            {types.includes('text') && !types.includes('quiz') && !types.includes('tlearn_topics') && !types.includes('debate_topics') && !types.includes('bias_investigation') && !types.includes('worst_ui') && (
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
                            {types.includes('link') && !types.includes('tlearn_topics') && (
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
                            {types.includes('file_upload') && !types.includes('tlearn_topics') && (
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
