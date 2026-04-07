'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Trophy, Medal, Crown, ChevronRight } from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  user_id: string
  username: string
  full_name: string | null
  total_analyses: number
  avg_score: number
  best_score: number
  performance_level: string
}

export default function LeaderboardPage() {
  const { token } = useAuth()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) fetchLeaderboard()
  }, [token])

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/coach/leaderboard', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setLeaderboard(data.leaderboard || [])
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const levelColor = (level: string) => {
    switch (level) {
      case 'Pro': return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      case 'Advanced': return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      case 'Intermediate': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
    }
  }

  const rankBadge = (rank: number) => {
    if (rank === 1) return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
        <Crown size={18} className="text-white" />
      </div>
    )
    if (rank === 2) return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow-lg shadow-gray-500/20">
        <Medal size={18} className="text-white" />
      </div>
    )
    if (rank === 3) return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg shadow-amber-700/20">
        <Medal size={18} className="text-white" />
      </div>
    )
    return (
      <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 font-bold text-sm">
        {rank}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      <div className="text-center">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center justify-center gap-3">
          <Trophy size={28} className="text-amber-400" />
          Player Leaderboard
        </h1>
        <p className="text-gray-400 mt-2">Ranked by average overall performance score.</p>
      </div>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
          {/* 2nd */}
          <div className="flex flex-col items-center pt-8">
            <Card className="p-5 border border-gray-300/20 bg-[#0d1117] rounded-2xl text-center w-full hover:border-gray-300/40 transition">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center mx-auto mb-3 text-white font-bold text-lg shadow-lg">
                {leaderboard[1].username.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm font-semibold text-gray-200 truncate">{leaderboard[1].username}</p>
              <p className="text-3xl font-bold text-gray-300 mt-2">{leaderboard[1].avg_score}</p>
              <p className="text-xs text-gray-500 mt-1">🥈 2nd Place</p>
            </Card>
          </div>

          {/* 1st */}
          <div className="flex flex-col items-center">
            <Card className="p-6 border-2 border-amber-500/30 bg-amber-500/5 rounded-2xl text-center w-full shadow-lg shadow-amber-500/10 hover:border-amber-500/50 transition">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-3 text-white font-bold text-xl shadow-lg shadow-amber-500/30">
                {leaderboard[0].username.charAt(0).toUpperCase()}
              </div>
              <Crown size={20} className="text-amber-400 mx-auto mb-1" />
              <p className="text-sm font-semibold text-white truncate">{leaderboard[0].username}</p>
              <p className="text-4xl font-bold text-amber-400 mt-2">{leaderboard[0].avg_score}</p>
              <p className="text-xs text-amber-400/70 mt-1">🥇 1st Place</p>
            </Card>
          </div>

          {/* 3rd */}
          <div className="flex flex-col items-center pt-12">
            <Card className="p-5 border border-amber-700/20 bg-[#0d1117] rounded-2xl text-center w-full hover:border-amber-700/40 transition">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center mx-auto mb-3 text-white font-bold text-lg shadow-lg">
                {leaderboard[2].username.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm font-semibold text-gray-200 truncate">{leaderboard[2].username}</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">{leaderboard[2].avg_score}</p>
              <p className="text-xs text-gray-500 mt-1">🥉 3rd Place</p>
            </Card>
          </div>
        </div>
      )}

      {/* Full Table */}
      <Card className="border border-gray-800/60 bg-[#0d1117] rounded-2xl overflow-hidden">
        {leaderboard.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Trophy size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No rankings yet</p>
            <p className="text-sm mt-1">Players need to analyze videos to appear here.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800/60 bg-gray-800/20">
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Rank</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Analyses</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Score</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Best</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40">
              {leaderboard.map(entry => (
                <tr
                  key={entry.user_id}
                  className={`hover:bg-gray-800/20 transition group ${
                    entry.rank <= 3 ? 'bg-amber-500/3' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    {rankBadge(entry.rank)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        entry.rank === 1 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                        entry.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                        entry.rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-800' :
                        'bg-gradient-to-br from-blue-500 to-blue-600'
                      }`}>
                        {entry.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-200">{entry.username}</p>
                        {entry.full_name && <p className="text-xs text-gray-500">{entry.full_name}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">{entry.total_analyses}</td>
                  <td className="px-6 py-4">
                    <span className={`text-lg font-bold ${
                      entry.avg_score >= 85 ? 'text-amber-400' :
                      entry.avg_score >= 70 ? 'text-blue-400' :
                      entry.avg_score >= 50 ? 'text-emerald-400' : 'text-gray-400'
                    }`}>
                      {entry.avg_score}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-300">{entry.best_score}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${levelColor(entry.performance_level)}`}>
                      {entry.performance_level}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/coach/dashboard/players/${entry.user_id}`}>
                      <Button size="sm" variant="ghost" className="text-gray-400 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition">
                        <ChevronRight size={16} />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
