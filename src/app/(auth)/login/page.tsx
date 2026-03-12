'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Trophy } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const supabase = createClient()

    const handleGoogleLogin = async () => {
        setLoading(true)
        setError('')
        
        // Use a cleaner relative URL resolution that plays nicely with Vercel's Edge network
        const origin = typeof window !== 'undefined' ? window.location.origin : ''
        
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
            })
            if (error) throw error
        } catch (err: any) {
            setError(err.message)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <Trophy className="mx-auto h-12 w-12 text-blue-600" />
                <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                    Sign in to AI Olympics
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                    Or{' '}
                    <Link href="/" className="font-medium text-blue-600 hover:text-blue-500">
                        return back home
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">

                    <div className="space-y-6">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 flex items-center gap-3"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                <path d="M1 1h22v22H1z" fill="none" />
                            </svg>
                            {loading ? 'Routing to Google...' : 'Sign in with Google'}
                        </button>
                    </div>

                    {error && (
                        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded text-sm text-slate-800">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
