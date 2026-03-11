'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'

export default function CreateTeamPage() {
    const [teamName, setTeamName] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/team/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ team_name: teamName })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create team')
            }

            router.push('/dashboard/participant/team')
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <Link href="/dashboard/participant/team" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Team
            </Link>

            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <Plus size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Create a Team</h2>
                </div>

                <form onSubmit={handleCreate} className="space-y-6">
                    <div>
                        <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-2">
                            Team Name
                        </label>
                        <input
                            id="teamName"
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder="E.g., Neural Knights"
                            required
                            maxLength={50}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                        />
                        <p className="mt-2 text-sm text-gray-500">
                            You will automatically become the Team Leader. You can then invite up to 3 more members using a unique invite code.
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-slate-50 text-slate-600 text-sm rounded-md border border-slate-100">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !teamName.trim()}
                        className="w-full bg-blue-600 text-white py-2.5 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        {loading ? 'Creating...' : 'Create Team'}
                    </button>
                </form>
            </div>
        </div>
    )
}
