'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft, Video, BarChart3, MessageSquare, Trophy, Clock, Star
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar
} from 'recharts'

interface UserDetail {
  user_id: string
  username: string
  email: string
  full_name: string | null
  created_at: string | null
  performance_level: string
}

interface VideoItem {
  video_id: string
  title: string
  drill_type: string
  status: string
  created_at: string | null
  result_id: string | null
  metrics: any
  feedback_count: number
}

interface TrendItem {
  result_id: string
  title: string
  drill_type: string
  overall_score: number
  average_speed: number
  agility_score: number
  balance_score: number
  coordination_score: number
  created_at: string | null
}

interface FeedbackItem {
  feedback_id: string
  video_id: string | null
  feedback_text: string
  rating: number | null
  coach_name: string
  created_at: string | null
}

export default function PlayerDetailPage() {
  const params = useParams()
  const userId = params.userId as string
  const router = useRouter()
  const { token } = useAuth()

  const [user, setUser] = useState<UserDetail | null>(null)
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [trends, setTrends] = useState<TrendItem[]>([])
  const [avgMetrics, setAvgMetrics] = useState<any>(null)
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'videos' | 'feedback'>('overview')

  // Feedback form
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [selectedVideoId, setSelectedVideoId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (token && userId) fetchUserDetails()
  }, [token, userId])

  const fetchUserDetails = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/coach/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setVideos(data.videos || [])
        setTrends(data.performance_trends || [])
        setAvgMetrics(data.avg_metrics)
        setFeedback(data.feedback || [])
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const submitFeedback = async () => {
    if (!feedbackText.trim()) return
    setSubmitting(true)

    try {
      const body: any = {
        user_id: userId,
        feedback_text: feedbackText,
      }
      if (feedbackRating > 0) body.rating = feedbackRating
      if (selectedVideoId) body.video_id = selectedVideoId

      const res = await fetch('http://localhost:5000/api/coach/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setFeedbackText('')
        setFeedbackRating(0)
        setSelectedVideoId('')
        fetchUserDetails()
      }
    } catch (err) {
      console.error('Feedback error:', err)
    } finally {
      setSubmitting(false)
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

  if (!user) {
    return <div className="text-center py-12 text-gray-400">Player not found.</div>
  }

  // Prepare chart data
  const trendData = trends.map((t, i) => ({
    name: t.title || `Analysis ${i + 1}`,
    score: t.overall_score,
    speed: t.average_speed,
    agility: t.agility_score,
    balance: t.balance_score,
  }))

  const radarData = avgMetrics ? [
    { metric: 'Speed', value: avgMetrics.average_speed },
    { metric: 'Agility', value: avgMetrics.agility_score },
    { metric: 'Balance', value: avgMetrics.balance_score },
    { metric: 'Coordination', value: avgMetrics.coordination_score },
    { metric: 'Stride', value: avgMetrics.stride_length },
  ] : []

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/coach/dashboard/players')}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
      </div>

      {/* Player Info Card */}
      <Card className="p-6 border border-gray-800/60 bg-[#0d1117] rounded-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
            {user.username?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{user.username}</h1>
              <span className={`text-xs font-medium px-3 py-1 rounded-full border ${levelColor(user.performance_level)}`}>
                {user.performance_level}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
              <span>{user.email}</span>
              {user.full_name && <span>• {user.full_name}</span>}
              {user.created_at && <span>• Joined {new Date(user.created_at).toLocaleDateString()}</span>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-gray-800/30 rounded-xl">
              <p className="text-2xl font-bold text-white">{videos.length}</p>
              <p className="text-xs text-gray-400">Videos</p>
            </div>
            <div className="p-3 bg-gray-800/30 rounded-xl">
              <p className="text-2xl font-bold text-emerald-400">{avgMetrics?.overall_score ?? 0}</p>
              <p className="text-xs text-gray-400">Avg Score</p>
            </div>
            <div className="p-3 bg-gray-800/30 rounded-xl">
              <p className="text-2xl font-bold text-amber-400">{avgMetrics?.best_score ?? 0}</p>
              <p className="text-xs text-gray-400">Best</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800/60 pb-px">
        {(['overview', 'videos', 'feedback'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-xl transition-all border-b-2 ${
              activeTab === tab
                ? 'text-emerald-400 border-emerald-400 bg-emerald-500/5'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Metrics Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {avgMetrics && [
              { label: 'Speed', value: avgMetrics.average_speed, color: 'text-blue-400' },
              { label: 'Max Speed', value: avgMetrics.max_speed, color: 'text-cyan-400' },
              { label: 'Agility', value: avgMetrics.agility_score, color: 'text-purple-400' },
              { label: 'Balance', value: avgMetrics.balance_score, color: 'text-emerald-400' },
              { label: 'Coordination', value: avgMetrics.coordination_score, color: 'text-amber-400' },
              { label: 'Stride', value: avgMetrics.stride_length, color: 'text-pink-400' },
            ].map((m, i) => (
              <Card key={i} className="p-4 border border-gray-800/60 bg-[#0d1117] rounded-xl text-center">
                <p className="text-xs text-gray-500 mb-1">{m.label}</p>
                <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Trend */}
            <Card className="p-6 border border-gray-800/60 bg-[#0d1117] rounded-2xl">
              <h3 className="text-lg font-semibold text-white mb-4">Performance Trend</h3>
              {trendData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <XAxis dataKey="name" stroke="#555" fontSize={11} tickLine={false} />
                      <YAxis stroke="#555" fontSize={11} tickLine={false} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                      />
                      <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
                      <Line type="monotone" dataKey="speed" stroke="#3b82f6" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="agility" stroke="#a855f7" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">No data</div>
              )}
            </Card>

            {/* Radar Chart */}
            <Card className="p-6 border border-gray-800/60 bg-[#0d1117] rounded-2xl">
              <h3 className="text-lg font-semibold text-white mb-4">Skills Breakdown</h3>
              {radarData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#333" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                      <Radar
                        name="Skills"
                        dataKey="value"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">No data</div>
              )}
            </Card>
          </div>

          {/* Score distribution by drill */}
          {trendData.length > 0 && (
            <Card className="p-6 border border-gray-800/60 bg-[#0d1117] rounded-2xl">
              <h3 className="text-lg font-semibold text-white mb-4">Score History</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <XAxis dataKey="name" stroke="#555" fontSize={11} tickLine={false} />
                    <YAxis stroke="#555" fontSize={11} tickLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }} />
                    <Bar dataKey="score" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Videos Tab */}
      {activeTab === 'videos' && (
        <div className="space-y-3">
          {videos.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Video size={40} className="mx-auto mb-3 opacity-40" />
              <p>No videos uploaded by this player.</p>
            </div>
          ) : (
            videos.map(v => (
              <Card key={v.video_id} className="p-5 border border-gray-800/60 bg-[#0d1117] rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm font-semibold text-white truncate">{v.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                      v.status === 'analyzed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    }`}>
                      {v.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><BarChart3 size={12} /> {v.drill_type}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {v.created_at ? new Date(v.created_at).toLocaleDateString() : 'N/A'}</span>
                    {v.metrics && <span className="flex items-center gap-1"><Trophy size={12} /> Score: {v.metrics.overall_score}</span>}
                    {v.feedback_count > 0 && <span className="flex items-center gap-1"><MessageSquare size={12} /> {v.feedback_count} feedback</span>}
                  </div>
                </div>
                {v.metrics && (
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-lg">Speed: {v.metrics.average_speed}</span>
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg">Balance: {v.metrics.balance_score}</span>
                    <span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded-lg">Agility: {v.metrics.agility_score}</span>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          {/* New Feedback Form */}
          <Card className="p-6 border border-emerald-500/20 bg-emerald-500/5 rounded-2xl">
            <h3 className="text-lg font-semibold text-emerald-400 mb-4">Write Feedback</h3>

            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Video selector */}
                <select
                  value={selectedVideoId}
                  onChange={(e) => setSelectedVideoId(e.target.value)}
                  className="bg-gray-800/50 border border-gray-700/50 text-gray-300 text-sm rounded-xl px-3 py-2 flex-1"
                >
                  <option value="">General Feedback (no specific video)</option>
                  {videos.map(v => (
                    <option key={v.video_id} value={v.video_id}>{v.title}</option>
                  ))}
                </select>

                {/* Rating */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star === feedbackRating ? 0 : star)}
                      className={`p-1 transition ${feedbackRating >= star ? 'text-amber-400' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                      <Star size={20} fill={feedbackRating >= star ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Write your feedback for this player..."
                rows={4}
                className="w-full bg-gray-800/50 border border-gray-700/50 text-gray-200 rounded-xl px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />

              <Button
                onClick={submitFeedback}
                disabled={submitting || !feedbackText.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
              >
                {submitting ? 'Sending...' : 'Send Feedback'}
              </Button>
            </div>
          </Card>

          {/* Existing Feedback */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Previous Feedback</h3>
            {feedback.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare size={32} className="mx-auto mb-3 opacity-40" />
                <p>No feedback given yet.</p>
              </div>
            ) : (
              feedback.map(fb => (
                <Card key={fb.feedback_id} className="p-5 border border-gray-800/60 bg-[#0d1117] rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-emerald-400">{fb.coach_name}</span>
                      {fb.rating && (
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={12} className={fb.rating && fb.rating >= s ? 'text-amber-400' : 'text-gray-700'} fill={fb.rating && fb.rating >= s ? 'currentColor' : 'none'} />
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {fb.created_at ? new Date(fb.created_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{fb.feedback_text}</p>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
