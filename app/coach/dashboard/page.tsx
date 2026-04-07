'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card } from '@/components/ui/card'
import {
  Users, Video, BarChart3, Trophy, TrendingUp, TrendingDown, Minus, Activity
} from 'lucide-react'
import Link from 'next/link'

interface Analytics {
  total_users: number
  total_videos: number
  total_analyzed: number
  platform_avg_score: number
  platform_best_score: number
  drill_stats: { drill_type: string; count: number; avg_score: number }[]
  level_distribution: Record<string, number>
  recent_videos_7d: number
  recent_analyses_7d: number
}

interface UserSummary {
  user_id: string
  username: string
  full_name: string | null
  total_videos: number
  avg_score: number
  performance_level: string
  is_inactive: boolean
  trend: string
}

export default function CoachOverviewPage() {
  const { token } = useAuth()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [users, setUsers] = useState<UserSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      Promise.all([fetchAnalytics(), fetchUsers()])
        .finally(() => setLoading(false))
    }
  }, [token])

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/coach/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data)
      }
    } catch (err) {
      console.error('Analytics fetch error:', err)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/coach/users', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (err) {
      console.error('Users fetch error:', err)
    }
  }

  const trendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp size={14} className="text-emerald-400" />
    if (trend === 'declining') return <TrendingDown size={14} className="text-red-400" />
    return <Minus size={14} className="text-gray-500" />
  }

  const levelColor = (level: string) => {
    switch (level) {
      case 'Pro': return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      case 'Advanced': return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      case 'Intermediate': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  const alertUsers = users.filter(u => u.is_inactive || u.trend === 'declining' || u.avg_score > 0 && u.avg_score < 50)
  const improvingUsers = users.filter(u => u.trend === 'improving')

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Coach Dashboard</h1>
        <p className="text-gray-400 mt-1">Overview of your platform&apos;s performance and players.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total Players', value: analytics?.total_users ?? 0, icon: Users, color: 'text-blue-400', iconBg: 'bg-blue-500/10' },
          { label: 'Total Videos', value: analytics?.total_videos ?? 0, icon: Video, color: 'text-emerald-400', iconBg: 'bg-emerald-500/10' },
          { label: 'Avg Score', value: analytics?.platform_avg_score ?? 0, icon: BarChart3, color: 'text-amber-400', iconBg: 'bg-amber-500/10' },
          { label: 'Best Score', value: analytics?.platform_best_score ?? 0, icon: Trophy, color: 'text-purple-400', iconBg: 'bg-purple-500/10' },
        ].map((stat, i) => (
          <Card
            key={i}
            className="p-6 border border-gray-800/60 bg-[#0d1117] rounded-2xl hover:bg-[#111720] transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 font-medium">{stat.label}</p>
                <h3 className={`text-4xl font-bold mt-2 tracking-tight ${stat.color}`}>
                  {stat.value}
                </h3>
              </div>
              <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                <stat.icon size={20} className={stat.color} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Activity Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-6 border border-gray-800/60 bg-[#0d1117] rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Activity size={18} className="text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Recent Activity (7 days)</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-800/30 rounded-xl">
              <p className="text-sm text-gray-400">New Videos</p>
              <p className="text-2xl font-bold text-white mt-1">{analytics?.recent_videos_7d ?? 0}</p>
            </div>
            <div className="p-4 bg-gray-800/30 rounded-xl">
              <p className="text-sm text-gray-400">Analyses Run</p>
              <p className="text-2xl font-bold text-white mt-1">{analytics?.recent_analyses_7d ?? 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-gray-800/60 bg-[#0d1117] rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-4">Performance Levels</h3>
          <div className="space-y-3">
            {analytics?.level_distribution && Object.entries(analytics.level_distribution)
              .filter(([key]) => key !== 'No Data')
              .map(([level, count]) => {
                const total = analytics?.total_users || 1
                const pct = Math.round((count / total) * 100)
                return (
                  <div key={level} className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${levelColor(level)} w-28 text-center`}>{level}</span>
                    <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          level === 'Pro' ? 'bg-amber-400' :
                          level === 'Advanced' ? 'bg-blue-400' :
                          level === 'Intermediate' ? 'bg-emerald-400' : 'bg-gray-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-400 w-12 text-right">{count}</span>
                  </div>
                )
              })}
          </div>
        </Card>
      </div>

      {/* Alerts & Flags */}
      {alertUsers.length > 0 && (
        <Card className="p-6 border border-amber-500/20 bg-amber-500/5 rounded-2xl">
          <h3 className="text-lg font-semibold text-amber-400 mb-4">⚠️ Alerts & Flags</h3>
          <div className="space-y-2">
            {alertUsers.slice(0, 5).map(u => (
              <Link
                key={u.user_id}
                href={`/coach/dashboard/players/${u.user_id}`}
                className="flex items-center justify-between p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl hover:bg-amber-500/10 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-sm font-bold">
                    {u.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">{u.username}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {u.is_inactive && <span className="text-xs text-red-400">Inactive (14+ days)</span>}
                      {u.trend === 'declining' && <span className="text-xs text-red-400">Performance declining</span>}
                      {u.avg_score > 0 && u.avg_score < 50 && <span className="text-xs text-amber-400">Low score ({u.avg_score})</span>}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-500">View →</span>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Improving Users */}
      {improvingUsers.length > 0 && (
        <Card className="p-6 border border-emerald-500/20 bg-emerald-500/5 rounded-2xl">
          <h3 className="text-lg font-semibold text-emerald-400 mb-4">🚀 Improving Players</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {improvingUsers.slice(0, 6).map(u => (
              <Link
                key={u.user_id}
                href={`/coach/dashboard/players/${u.user_id}`}
                className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl hover:bg-emerald-500/10 transition"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold">
                  {u.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{u.username}</p>
                  <p className="text-xs text-emerald-400">Score: {u.avg_score}</p>
                </div>
                <TrendingUp size={14} className="text-emerald-400" />
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Top Players Quick View */}
      <Card className="p-6 border border-gray-800/60 bg-[#0d1117] rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Top Players</h3>
          <Link href="/coach/dashboard/players" className="text-sm text-emerald-400 hover:text-emerald-300 transition">
            View All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-800/60">
                <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Videos</th>
                <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Score</th>
                <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                <th className="pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40">
              {users.slice(0, 5).map(u => (
                <tr key={u.user_id} className="hover:bg-gray-800/20 transition cursor-pointer" onClick={() => window.location.href = `/coach/dashboard/players/${u.user_id}`}>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
                        {u.username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-200">{u.username}</p>
                        <p className="text-xs text-gray-500">{u.full_name || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-sm text-gray-300">{u.total_videos}</td>
                  <td className="py-3 text-sm font-semibold text-gray-200">{u.avg_score}</td>
                  <td className="py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full border ${levelColor(u.performance_level)}`}>
                      {u.performance_level}
                    </span>
                  </td>
                  <td className="py-3">{trendIcon(u.trend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Users size={40} className="mx-auto mb-3 opacity-40" />
            <p>No players registered yet.</p>
          </div>
        )}
      </Card>
    </div>
  )
}
