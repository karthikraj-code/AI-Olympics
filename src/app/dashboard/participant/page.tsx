import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from '@/utils/supabase/server'

export default async function ParticipantDashboard() {
    const supabase = await createClient()
    const session = await getServerSession(authOptions);
    const user = session?.user as any

    const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single()

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to AI Olympics, {userData?.name}!</h2>
                <p className="text-gray-600">
                    Get ready for 2 days of intense AI challenges. Form your team and prepare your submissions.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-sky-600"></span>
                        Next Steps
                    </h3>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3 text-sm text-gray-700">
                            <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
                            <span>Create or join a team (Min 2, Max 4 members).</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-gray-700">
                            <div className="w-6 h-6 rounded-full bg-gray-50 text-gray-500 flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
                            <span>Wait for rounds to open.</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-gray-700">
                            <div className="w-6 h-6 rounded-full bg-gray-50 text-gray-500 flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
                            <span>Have your team leader submit your work before the deadline.</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
