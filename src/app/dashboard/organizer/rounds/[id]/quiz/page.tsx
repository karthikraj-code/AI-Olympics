'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function ManageQuizPage() {
    const params = useParams()
    const router = useRouter()
    const roundId = params.id as string
    const supabase = createClient()

    const [questions, setQuestions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        question: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: 'option_a',
        explanation: '',
        marks: 1
    })

    useEffect(() => {
        fetchQuestions()
    }, [])

    const fetchQuestions = async () => {
        try {
            const { data, error } = await supabase
                .from('quiz_questions')
                .select('*')
                .eq('round_id', roundId)

            if (error) throw error

            const sortedData = (data || []).sort((a, b) => {
                const matchA = a.question.match(/^(\d+)\./);
                const matchB = b.question.match(/^(\d+)\./);
                const numA = matchA ? parseInt(matchA[1]) : 999999;
                const numB = matchB ? parseInt(matchB[1]) : 999999;
                if (numA !== numB) return numA - numB;
                return a.question.localeCompare(b.question);
            });

            setQuestions(sortedData)
        } catch (err: any) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError('')

        try {
            const res = await fetch('/api/rounds/quiz/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    round_id: roundId,
                    ...formData
                })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to add question')
            }

            setFormData({
                question: '',
                option_a: '',
                option_b: '',
                option_c: '',
                option_d: '',
                correct_answer: 'option_a',
                explanation: '',
                marks: 1
            })
            fetchQuestions()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading questions...</div>

    return (
        <div className="max-w-4xl space-y-6">
            <Link href="/dashboard/organizer/rounds" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Rounds
            </Link>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Manage Quiz</h2>
                <p className="text-gray-600">Total Questions: {questions.length}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Add Question Form */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Plus size={20} className="text-slate-600" />
                        Add New Question
                    </h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                            <textarea
                                value={formData.question}
                                onChange={e => setFormData({ ...formData, question: e.target.value })}
                                required rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                            />
                        </div>

                        <div className="space-y-3">
                            {(['a', 'b', 'c', 'd'] as const).map((opt) => (
                                <div key={opt}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Option {opt.toUpperCase()}</label>
                                    <input
                                        type="text"
                                        value={formData[`option_${opt}`]}
                                        onChange={e => setFormData({ ...formData, [`option_${opt}`]: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer</label>
                                <select
                                    value={formData.correct_answer}
                                    onChange={e => setFormData({ ...formData, correct_answer: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                                >
                                    <option value="option_a">Option A</option>
                                    <option value="option_b">Option B</option>
                                    <option value="option_c">Option C</option>
                                    <option value="option_d">Option D</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                                <input
                                    type="number" min="1"
                                    value={formData.marks}
                                    onChange={e => setFormData({ ...formData, marks: parseInt(e.target.value) || 1 })}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Explanation (Optional)</label>
                            <textarea
                                value={formData.explanation}
                                onChange={e => setFormData({ ...formData, explanation: e.target.value })}
                                rows={2}
                                placeholder="Explain why the answer is correct..."
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                            />
                        </div>

                        {error && <div className="p-3 bg-slate-50 text-slate-600 text-sm rounded">{error}</div>}

                        <button
                            type="submit" disabled={saving}
                            className="w-full bg-slate-600 text-white py-2.5 rounded font-medium hover:bg-slate-700 transition-colors shadow-sm disabled:opacity-50"
                        >
                            {saving ? 'Adding...' : 'Add Question'}
                        </button>
                    </form>
                </div>

                {/* Questions List */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900">Current Questions</h3>
                    {questions.map((q, idx) => (
                        <div key={q.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm text-sm">
                            <div className="flex justify-between items-start mb-3">
                                <p className="font-semibold text-gray-900"><span className="text-gray-500 mr-2">{idx + 1}.</span>{q.question.replace(/^\d+\.\s*/, '')}</p>
                                <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs shrink-0">{q.marks} pts</span>
                            </div>
                            <ul className="space-y-1 pl-6">
                                {(['a', 'b', 'c', 'd'] as const).map(opt => {
                                    const isCorrect = q.correct_answer === `option_${opt}`
                                    return (
                                        <li key={opt} className={`${isCorrect ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
                                            {opt.toUpperCase()}: {q[`option_${opt}`]}
                                            {isCorrect && ' ✓'}
                                        </li>
                                    )
                                })}
                            </ul>
                            {q.explanation && (
                                <div className="mt-4 pt-3 border-t border-gray-100 text-gray-700 bg-gray-50 p-3 rounded-lg">
                                    <span className="font-semibold text-gray-900 block mb-1">Explanation:</span>
                                    {q.explanation}
                                </div>
                            )}
                        </div>
                    ))}
                    {questions.length === 0 && (
                        <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            No questions added yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
