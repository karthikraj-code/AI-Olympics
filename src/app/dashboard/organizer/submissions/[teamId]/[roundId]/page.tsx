import { createAdminClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ArrowLeft, FileText, Download, AlertCircle, CheckCircle2, ExternalLink, Image as ImageIcon, Trophy, User, Clock, MessageSquare } from 'lucide-react'

export default async function OrganizerSubmissionDetail({
    params,
}: {
    params: { teamId: string; roundId: string }
}) {
    const { teamId, roundId } = await params
    const supabase = await createAdminClient()

    // 1. Get Team & Round details
    const [
        { data: team },
        { data: round },
        { data: submission },
        { data: score }
    ] = await Promise.all([
        supabase.from('teams').select('*').eq('id', teamId).single(),
        supabase.from('rounds').select('*').eq('id', roundId).single(),
        supabase.from('submissions').select('*').eq('team_id', teamId).eq('round_id', roundId).single(),
        supabase.from('scores').select('*, users(name)').eq('team_id', teamId).eq('round_id', roundId).single()
    ])

    if (!team || !round || !submission) {
        return (
            <div className="max-w-4xl mx-auto space-y-6 p-8">
                <Link href="/dashboard/organizer/submissions" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Submissions
                </Link>
                <div className="p-12 text-center bg-white rounded-xl border border-gray-200 shadow-sm">
                    <AlertCircle size={48} className="mx-auto text-amber-500 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900">Submission data missing</h3>
                    <p className="text-gray-500 mt-2">The team might not have submitted anything for this round yet, or there was an error fetching the data.</p>
                </div>
            </div>
        )
    }

    // 2. Fetch Topics if applicable
    let teamTopics: any[] = []
    if (round?.submission_type?.includes('tlearn_topics')) {
        const { data: topicsData } = await supabase
            .from('topic_selections')
            .select('topic_id, topics(name, category)')
            .eq('round_id', roundId)
            .eq('team_id', teamId)
        if (topicsData) teamTopics = topicsData
    }

    const isQuiz = round.submission_type?.includes('quiz')
    const rubric = round.rubric || {}
    const maxScore = Object.values(rubric).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0)

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            <Link href="/dashboard/organizer/submissions" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to All Submissions
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Col: Submission Viewer (Mirrored from Judge UI) */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="bg-slate-900 px-8 py-6 flex justify-between items-start">
                            <div>
                                <h2 className="text-3xl font-black text-white mb-1">{team.team_name}</h2>
                                <p className="text-blue-400 font-bold uppercase tracking-wider text-xs">
                                    Round {round.round_number}: {round.name}
                                </p>
                            </div>
                            <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/20">
                                <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest block mb-0.5 text-center">Submitted At</span>
                                <span className="text-white font-bold text-xs">
                                    {new Date(submission.submitted_at).toLocaleString()}
                                </span>
                            </div>
                        </div>
                        
                        <div className="p-8 space-y-8">
                            {/* Standard Text Response */}
                            {submission.text_response && !isQuiz && 
                                !round.submission_type?.includes('tlearn_topics') && 
                                !round.submission_type?.includes('bias_investigation') && 
                                !round.submission_type?.includes('worst_ui') && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <FileText size={16} /> Text Response
                                    </h4>
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-gray-800 whitespace-pre-wrap font-medium leading-relaxed">
                                        {submission.text_response}
                                    </div>
                                </div>
                            )}

                            {/* Quiz View */}
                            {isQuiz && (
                                <div className="space-y-4">
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-3">
                                        <AlertCircle className="text-blue-600" />
                                        <p className="text-sm font-bold text-blue-900 uppercase tracking-tight">Auto-Graded Quiz Logs</p>
                                    </div>
                                    <pre className="bg-slate-900 p-6 rounded-2xl text-blue-300 text-xs border border-slate-800 overflow-x-auto font-mono shadow-inner">
                                        {submission.text_response}
                                    </pre>
                                </div>
                            )}

                            {/* T-Learn Topics */}
                            {teamTopics.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <CheckCircle2 size={16} className="text-emerald-500" /> Selected Topics
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {teamTopics.map((ts, idx) => (
                                            <div key={idx} className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col">
                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 opacity-60">
                                                    {ts.topics?.category === 'cse' ? 'CSE Domain' : 'Other Domain'}
                                                </span>
                                                <span className="font-black text-emerald-900">{ts.topics?.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Main Submission Link */}
                            {submission.link && (
                                <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 group hover:border-blue-500 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <ExternalLink size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Main Submission</p>
                                            <p className="font-black text-gray-900">
                                                {round.submission_type?.includes('tlearn_topics')
                                                    ? 'Google Slides Presentation'
                                                    : round.submission_type?.includes('debate_topics')
                                                        ? 'ChatGPT Chat Link'
                                                        : round.submission_type?.includes('worst_ui')
                                                            ? 'Application Live Link'
                                                            : 'External Project Link'}
                                            </p>
                                        </div>
                                    </div>
                                    <a 
                                        href={submission.link.startsWith('http') ? submission.link : `https://${submission.link}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="w-full sm:w-auto px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-sm hover:bg-blue-600 transition-all text-center"
                                    >
                                        View Resource
                                    </a>
                                </div>
                            )}

                            {/* T-Learn Specific Links */}
                            {round.submission_type?.includes('tlearn_topics') && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {submission.text_response && (
                                        <a 
                                            href={submission.text_response.startsWith('http') ? submission.text_response : `https://${submission.text_response}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="p-4 bg-purple-50 border border-purple-100 rounded-2xl hover:bg-purple-100 transition-colors block group"
                                        >
                                            <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest block mb-1">ChatGPT Interaction 1</span>
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-gray-900 group-hover:text-purple-700">Open Chat Link</span>
                                                <ExternalLink size={14} className="text-purple-400" />
                                            </div>
                                        </a>
                                    )}
                                    {submission.chatgpt_link_2 && (
                                        <a 
                                            href={submission.chatgpt_link_2.startsWith('http') ? submission.chatgpt_link_2 : `https://${submission.chatgpt_link_2}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="p-4 bg-purple-50 border border-purple-100 rounded-2xl hover:bg-purple-100 transition-colors block group"
                                        >
                                            <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest block mb-1">ChatGPT Interaction 2</span>
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-gray-900 group-hover:text-purple-700">Open Chat Link</span>
                                                <ExternalLink size={14} className="text-purple-400" />
                                            </div>
                                        </a>
                                    )}
                                </div>
                            )}

                            {/* File Preview (Images) */}
                            {submission.file_url && round.submission_type?.includes('bias_investigation') && (
                                <div className="space-y-4">
                                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <ImageIcon size={16} /> AI Generated Visualization
                                    </h4>
                                    <div className="border-2 border-slate-100 rounded-2xl overflow-hidden bg-slate-50 group relative">
                                        <img 
                                            src={submission.file_url} 
                                            alt="AI Generated" 
                                            className="w-full h-auto object-contain max-h-[600px] mx-auto"
                                        />
                                        <a href={submission.file_url} target="_blank" rel="noopener noreferrer" className="absolute top-4 right-4 bg-white/90 backdrop-blur shadow-xl px-4 py-2 rounded-xl text-xs font-black text-slate-900 hover:bg-white transition-all scale-0 group-hover:scale-100">
                                            VIEW FULL SIZE &rarr;
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Worst UI Theme */}
                            {round.submission_type?.includes('worst_ui') && submission.text_response && (
                                <div className="bg-red-50 p-8 rounded-2xl border-2 border-red-100 border-dashed text-center">
                                    <span className="text-[10px] font-black text-red-600 uppercase tracking-widest block mb-2 underline decoration-red-200 decoration-2 underline-offset-4">Chosen Chaos Theme</span>
                                    <p className="text-2xl font-black text-red-900 italic">"{submission.text_response}"</p>
                                </div>
                            )}

                            {/* Bias Investigation Analysis */}
                            {round.submission_type?.includes('bias_investigation') && submission.text_response && (
                                <div className="space-y-4">
                                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <MessageSquare size={16} /> Bias Analysis
                                    </h4>
                                    <div className="p-8 bg-blue-50/50 rounded-2xl border border-blue-100 text-gray-800 whitespace-pre-wrap leading-relaxed font-medium">
                                        {submission.text_response}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Col: Evaluation Panel */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm sticky top-6 overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 -z-0 opacity-50" />
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                    <Trophy size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900">Evaluation Records</h2>
                            </div>

                            {!score ? (
                                <div className="p-10 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                    <Clock size={40} className="mx-auto text-slate-300 mb-4" />
                                    <p className="text-lg font-black text-slate-500 uppercase tracking-tight">Pending Review</p>
                                    <p className="text-xs font-bold text-slate-400 mt-1">This submission has not been graded by a judge yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {/* Score Card */}
                                    <div className="bg-gradient-to-br from-blue-600 to-sky-500 p-8 rounded-2xl text-white shadow-xl shadow-blue-100">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100 opacity-80">Accumulated Score</span>
                                            <div className="px-2 py-1 bg-white/20 rounded text-[10px] font-bold">VERIFIED</div>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-6xl font-black">{score.score}</span>
                                            <span className="text-2xl font-bold opacity-60">/ {maxScore || 15}</span>
                                        </div>
                                    </div>

                                    {/* Breakdown */}
                                    {score.criteria_scores && (
                                        <div className="space-y-5">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Marks Breakdown</h4>
                                            <div className="space-y-4">
                                                {Object.entries(score.criteria_scores).map(([k, v]) => {
                                                    const mx = Number(rubric[k]) || 5
                                                    return (
                                                        <div key={k} className="group">
                                                            <div className="flex justify-between items-center mb-1.5">
                                                                <span className="text-sm font-bold text-gray-700">{k}</span>
                                                                <span className="text-sm font-black text-blue-600">{v as any} <span className="text-gray-300 font-normal">/ {mx}</span></span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                                <div 
                                                                    className="h-full bg-blue-600 rounded-full transition-all duration-1000 group-hover:bg-blue-400" 
                                                                    style={{ width: `${(Number(v)/mx)*100}%` }} 
                                                                />
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Feedback */}
                                    {score.feedback && (
                                        <div className="space-y-3 pt-4 border-t border-slate-100">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Judge Feedback</h4>
                                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-gray-700 italic font-medium text-sm leading-relaxed">
                                                "{score.feedback}"
                                            </div>
                                        </div>
                                    )}

                                    {/* Metadata */}
                                    <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Evaluated By</p>
                                                <p className="text-sm font-black text-gray-800">{score.users?.name || 'Round Judge'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
