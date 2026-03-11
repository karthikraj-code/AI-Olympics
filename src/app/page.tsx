import Link from 'next/link';
import { ArrowRight, Trophy, Users, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-background">
      <div className="max-w-4xl w-full space-y-12">
        <div className="space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-blue-600 mt-8">
            AI Olympics
          </h1>
          <p className="text-xl md:text-2xl text-black max-w-2xl mx-auto">
            A competitive arena for the brightest minds to tackle the ultimate AI challenges.
            Join a team, submit your solutions, and climb the leaderboard.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/login" className="bg-blue-600 text-white px-8 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
            Login <ArrowRight size={20} />
          </Link>
          <Link href="/register" className="bg-white text-blue-600 border border-blue-600 px-8 py-3 rounded-md font-medium hover:bg-blue-50 transition-colors shadow-sm">
            Register for Hackathon
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <Users className="text-blue-600 w-8 h-8 mb-4" />
            <h3 className="font-semibold text-lg mb-2">Team Up</h3>
            <p className="text-sm text-gray-600">Form teams of 2-4 members and collaborate on 7 exciting AI challenges.</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <Trophy className="text-blue-600 w-8 h-8 mb-4" />
            <h3 className="font-semibold text-lg mb-2">Submit & Win</h3>
            <p className="text-sm text-gray-600">Tackle preprocessing, AI bias, debates, and pitching to top the leaderboard.</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <ShieldCheck className="text-sky-600 w-8 h-8 mb-4" />
            <h3 className="font-semibold text-lg mb-2">Fair Evaluation</h3>
            <p className="text-sm text-gray-600">Submissions are individually graded by assigned judges using detailed rubrics.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
