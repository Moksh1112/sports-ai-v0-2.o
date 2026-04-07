'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Search, Users, TrendingUp, TrendingDown, Minus, Filter, ChevronRight
} from 'lucide-react'

interface UserSummary {
  user_id: string
  username: string
  email: string
  full_name: string | null
  total_videos: number
  avg_score: number
  best_score: number
  performance_level: string
  is_inactive: boolean
  trend: string
  last_active: string | null
  created_at: string | null
}

export default function PlayersPage() {
  const { token } = useAuth()
  const [users, setUsers] = useState<UserSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [drillFilter, setDrillFilter] = useState('')
  const [compareIds, setCompareIds] = useState<string[]>([])

  useEffect(() => {
    if (token) fetchUsers()
  }, [token, search, levelFilter, drillFilter])

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (levelFilter) params.set('performance_level', levelFilter)
      if (drillFilter) params.set('drill_type', drillFilter)

      const res = await fetch(`http://localhost:5000/api/coach/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleCompare = (userId: string) => {
    setCompareIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const trendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp size={14} className="text-emerald-400" />
    if (trend === 'declining') return <TrendingDown size={14} className="text-red-400" />
    return <Minus size={14} className="text-gray-500" />
  }

  const trendText = (trend: string) => {
    if (trend === 'improving') return 'Improving'
    if (trend === 'declining') return 'Declining'
    return 'Stable'
  }

  const levelColor = (level: string) => {
    switch (level) {
      case 'Pro': return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      case 'Advanced': return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      case 'Intermediate': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
    }
  }

  const scoreColor = (score: number) => {
    if (score >= 85) return 'text-amber-400'
    if (score >= 70) return 'text-blue-400'
    if (score >= 50) return 'text-emerald-400'
    return 'text-gray-400'
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Players</h1>
          <p className="text-gray-400 mt-1">Manage and analyze all registered players.</p>
        </div>
        {compareIds.length >= 2 && (
          <Link href={`/coach/dashboard/compare?ids=${compareIds.join(',')}`}>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
              Compare {compareIds.length} Players
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card className="p-5 border border-gray-800/60 bg-[#0d1117] rounded-2xl">
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search by name, email, or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-gray-800/50 border-gray-700/50 text-gray-200 rounded-xl w-full"
            />
          </div>

          {/* Level Filter */}
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-500" />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="bg-gray-800/50 border border-gray-700/50 text-gray-300 text-sm rounded-xl px-3 py-2"
            >
              <option value="">All Levels</option>
              <option value="Pro">Pro</option>
              <option value="Advanced">Advanced</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Beginner">Beginner</option>
            </select>
          </div>

          {/* Drill Filter */}
          <select
            value={drillFilter}
            onChange={(e) => setDrillFilter(e.target.value)}
            className="bg-gray-800/50 border border-gray-700/50 text-gray-300 text-sm rounded-xl px-3 py-2"
          >
            <option value="">All Drills</option>
            <option value="sprint">Sprint</option>
            <option value="agility">Agility</option>
            <option value="jump">Jump</option>
            <option value="balance">Balance</option>
            <option value="coordination">Coordination</option>
          </select>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="border border-gray-800/60 bg-[#0d1117] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Users size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No players found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800/60 bg-gray-800/20">
                  <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      className="rounded border-gray-600 bg-gray-800"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCompareIds(users.map(u => u.user_id))
                        } else {
                          setCompareIds([])
                        }
                      }}
                    />
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                  <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Videos</th>
                  <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Score</th>
                  <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Best</th>
                  <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                  <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                  <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {users.map(user => (
                  <tr
                    key={user.user_id}
                    className="hover:bg-gray-800/20 transition group"
                  >
                    <td className="px-5 py-4">
                      <input
                        type="checkbox"
                        checked={compareIds.includes(user.user_id)}
                        onChange={() => toggleCompare(user.user_id)}
                        className="rounded border-gray-600 bg-gray-800"
                      />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {user.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-200">{user.username}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-300">{user.total_videos}</td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-bold ${scoreColor(user.avg_score)}`}>{user.avg_score}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-bold ${scoreColor(user.best_score)}`}>{user.best_score}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${levelColor(user.performance_level)}`}>
                        {user.performance_level}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {trendIcon(user.trend)}
                        <span className="text-xs text-gray-400">{trendText(user.trend)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {user.is_inactive ? (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full border text-red-400 bg-red-500/10 border-red-500/20">
                          Inactive
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full border text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <Link href={`/coach/dashboard/players/${user.user_id}`}>
                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition">
                          <ChevronRight size={16} />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="text-sm text-gray-500 text-center">
        Showing {users.length} player{users.length !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
