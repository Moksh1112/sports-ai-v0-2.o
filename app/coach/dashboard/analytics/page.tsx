'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card } from '@/components/ui/card'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { Users, Video, BarChart3, Trophy, Activity } from 'lucide-react'

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

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#6b7280', '#8b5cf6']

export default function CoachAnalyticsPage() {
  const { token } = useAuth()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) fetchAnalytics()
  }, [token])

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/coach/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setAnalytics(await res.json())
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  const drillChartData = analytics?.drill_stats?.map(d => ({
    name: d.drill_type.charAt(0).toUpperCase() + d.drill_type.slice(1),
    avgScore: d.avg_score,
    count: d.count,
  })) || []

  const levelData = analytics?.level_distribution
    ? Object.entries(analytics.level_distribution)
        .filter(([key]) => key !== 'No Data')
        .map(([name, value]) => ({ name, value }))
    : []

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Platform Analytics</h1>
        <p className="text-gray-400 mt-1">Comprehensive performance data across all players.</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Players', value: analytics?.total_users ?? 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Total Videos', value: analytics?.total_videos ?? 0, icon: Video, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Analyzed', value: analytics?.total_analyzed ?? 0, icon: Activity, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
          { label: 'Platform Avg', value: analytics?.platform_avg_score ?? 0, icon: BarChart3, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Best Score', value: analytics?.platform_best_score ?? 0, icon: Trophy, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map((s, i) => (
          <Card key={i} className="p-5 border border-gray-800/60 bg-[#0d1117] rounded-2xl">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.bg}`}>
                <s.icon size={18} className={s.color} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Drill Type Performance */}
        <Card className="p-6 border border-gray-800/60 bg-[#0d1117] rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-1">Avg Score by Drill Type</h3>
          <p className="text-sm text-gray-500 mb-4">Comparing average performance across drill categories.</p>
          {drillChartData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={drillChartData}>
                  <XAxis dataKey="name" stroke="#555" fontSize={12} tickLine={false} />
                  <YAxis stroke="#555" fontSize={12} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }} />
                  <Bar dataKey="avgScore" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={50} name="Avg Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-500">No data</div>
          )}
        </Card>

        {/* Level Distribution Pie */}
        <Card className="p-6 border border-gray-800/60 bg-[#0d1117] rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-1">Player Level Distribution</h3>
          <p className="text-sm text-gray-500 mb-4">Breakdown of players by performance tier.</p>
          {levelData.length > 0 ? (
            <div className="h-72 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={levelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {levelData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-500">No data</div>
          )}
        </Card>
      </div>

      {/* Drill Counts */}
      <Card className="p-6 border border-gray-800/60 bg-[#0d1117] rounded-2xl">
        <h3 className="text-lg font-semibold text-white mb-1">Drill Type Usage</h3>
        <p className="text-sm text-gray-500 mb-4">Number of analyses run per drill type.</p>
        {drillChartData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={drillChartData}>
                <XAxis dataKey="name" stroke="#555" fontSize={12} tickLine={false} />
                <YAxis stroke="#555" fontSize={12} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={50} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">No data</div>
        )}
      </Card>

      {/* Detailed Drill Stats Table */}
      {analytics?.drill_stats && analytics.drill_stats.length > 0 && (
        <Card className="border border-gray-800/60 bg-[#0d1117] rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-800/60">
            <h3 className="text-lg font-semibold text-white">Drill Statistics</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800/60 bg-gray-800/20">
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Drill Type</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Total Analyses</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Avg Score</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40">
              {analytics.drill_stats.map((d, i) => (
                <tr key={i} className="hover:bg-gray-800/20 transition">
                  <td className="px-6 py-4 text-sm font-medium text-gray-200 capitalize">{d.drill_type}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{d.count}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-emerald-400">{d.avg_score}</td>
                  <td className="px-6 py-4">
                    <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${d.avg_score}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
