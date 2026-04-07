'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Trophy, BarChart3 } from 'lucide-react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer
} from 'recharts'

interface CompareUser {
  rank: number
  user_id: string
  username: string
  full_name: string | null
  total_videos: number
  avg_metrics: {
    overall_score: number
    average_speed: number
    agility_score: number
    balance_score: number
    coordination_score: number
    stride_length: number
    best_score: number
  }
  performance_level: string
}

const COLORS = ['#10b981', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444']

function CompareContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { token } = useAuth()
  const [comparison, setComparison] = useState<CompareUser[]>([])
  const [loading, setLoading] = useState(true)

  const ids = searchParams.get('ids')?.split(',') || []

  useEffect(() => {
    if (token && ids.length >= 2) fetchComparison()
  }, [token])

  const fetchComparison = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/coach/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_ids: ids }),
      })
      if (res.ok) {
        const data = await res.json()
        setComparison(data.comparison || [])
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  // Prepare radar data
  const metrics = ['Speed', 'Agility', 'Balance', 'Coordination', 'Stride']
  const radarData = metrics.map((metric, i) => {
    const point: any = { metric }
    comparison.forEach(user => {
      const keys = ['average_speed', 'agility_score', 'balance_score', 'coordination_score', 'stride_length']
      point[user.username] = user.avg_metrics[keys[i] as keyof typeof user.avg_metrics] || 0
    })
    return point
  })

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/coach/dashboard/players')} className="text-gray-400 hover:text-white">
          <ArrowLeft size={16} className="mr-2" />
          Back to Players
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <BarChart3 size={28} className="text-emerald-400" />
          Player Comparison
        </h1>
        <p className="text-gray-400 mt-1">Side-by-side performance comparison.</p>
      </div>

      {/* Radar Chart */}
      {comparison.length > 0 && (
        <Card className="p-6 border border-gray-800/60 bg-[#0d1117] rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-4">Skills Comparison</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                {comparison.map((user, i) => (
                  <Radar
                    key={user.user_id}
                    name={user.username}
                    dataKey={user.username}
                    stroke={COLORS[i % COLORS.length]}
                    fill={COLORS[i % COLORS.length]}
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            {comparison.map((user, i) => (
              <div key={user.user_id} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-sm text-gray-300">{user.username}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Comparison Table */}
      <Card className="border border-gray-800/60 bg-[#0d1117] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800/60 bg-gray-800/20">
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
              {comparison.map((user, i) => (
                <th key={user.user_id} className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider" style={{ color: COLORS[i % COLORS.length] }}>
                  {user.username}
                  <span className="block text-[10px] text-gray-500 font-normal mt-0.5">Rank #{user.rank}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/40">
            {[
              { label: 'Overall Score', key: 'overall_score' },
              { label: 'Avg Speed', key: 'average_speed' },
              { label: 'Agility', key: 'agility_score' },
              { label: 'Balance', key: 'balance_score' },
              { label: 'Coordination', key: 'coordination_score' },
              { label: 'Stride Length', key: 'stride_length' },
              { label: 'Best Score', key: 'best_score' },
            ].map(({ label, key }) => {
              const values = comparison.map(u => (u.avg_metrics as any)[key] || 0)
              const maxVal = Math.max(...values)

              return (
                <tr key={key} className="hover:bg-gray-800/20 transition">
                  <td className="px-6 py-4 text-sm font-medium text-gray-300">{label}</td>
                  {comparison.map((user, i) => {
                    const val = (user.avg_metrics as any)[key] || 0
                    const isBest = val === maxVal && val > 0
                    return (
                      <td key={user.user_id} className="px-6 py-4 text-center">
                        <span className={`text-lg font-bold ${isBest ? 'text-emerald-400' : 'text-gray-300'}`}>
                          {val}
                        </span>
                        {isBest && val > 0 && (
                          <Trophy size={12} className="inline-block ml-1 text-amber-400" />
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
            <tr className="bg-gray-800/20">
              <td className="px-6 py-4 text-sm font-medium text-gray-300">Level</td>
              {comparison.map(user => (
                <td key={user.user_id} className="px-6 py-4 text-center">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${levelColor(user.performance_level)}`}>
                    {user.performance_level}
                  </span>
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-6 py-4 text-sm font-medium text-gray-300">Total Videos</td>
              {comparison.map(user => (
                <td key={user.user_id} className="px-6 py-4 text-center text-sm text-gray-400">
                  {user.total_videos}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    }>
      <CompareContent />
    </Suspense>
  )
}
