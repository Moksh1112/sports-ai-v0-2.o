'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { MessageSquare, Star, Users, Search } from 'lucide-react'

interface UserSummary {
  user_id: string
  username: string
  email: string
  full_name: string | null
  total_videos: number
  avg_score: number
  performance_level: string
}

interface FeedbackItem {
  feedback_id: string
  user_id: string
  video_id: string | null
  feedback_text: string
  rating: number | null
  coach_name: string
  created_at: string | null
}

export default function FeedbackPage() {
  const { token } = useAuth()
  const [users, setUsers] = useState<UserSummary[]>([])
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Form
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (token) fetchUsers()
  }, [token])

  useEffect(() => {
    if (token && selectedUser) fetchFeedback(selectedUser)
  }, [token, selectedUser])

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
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchFeedback = async (userId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/coach/feedback/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setFeedback(data.feedback || [])
      }
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const submitFeedback = async () => {
    if (!selectedUser || !feedbackText.trim()) return
    setSubmitting(true)
    setSuccess(false)

    try {
      const body: any = {
        user_id: selectedUser,
        feedback_text: feedbackText,
      }
      if (feedbackRating > 0) body.rating = feedbackRating

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
        setSuccess(true)
        fetchFeedback(selectedUser)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name?.toLowerCase().includes(search.toLowerCase()) ?? false)
  )

  const selectedUserData = users.find(u => u.user_id === selectedUser)

  const levelColor = (level: string) => {
    switch (level) {
      case 'Pro': return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      case 'Advanced': return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      case 'Intermediate': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Feedback Center</h1>
        <p className="text-gray-400 mt-1">Send feedback and coaching notes to your players.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* User List */}
        <Card className="border border-gray-800/60 bg-[#0d1117] rounded-2xl overflow-hidden lg:col-span-1">
          <div className="p-4 border-b border-gray-800/60">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search players..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-gray-800/50 border-gray-700/50 text-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Users size={24} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No players found.</p>
              </div>
            ) : (
              filteredUsers.map(u => (
                <button
                  key={u.user_id}
                  onClick={() => setSelectedUser(u.user_id)}
                  className={`w-full flex items-center gap-3 p-4 text-left border-b border-gray-800/40 transition ${
                    selectedUser === u.user_id
                      ? 'bg-emerald-500/10 border-l-2 border-l-emerald-500'
                      : 'hover:bg-gray-800/30'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {u.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">{u.username}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${levelColor(u.performance_level)}`}>
                        {u.performance_level}
                      </span>
                      <span className="text-[10px] text-gray-500">Score: {u.avg_score}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Feedback Panel */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedUser ? (
            <Card className="p-12 border border-gray-800/60 bg-[#0d1117] rounded-2xl text-center">
              <MessageSquare size={48} className="mx-auto mb-4 text-gray-700" />
              <p className="text-gray-400 text-lg">Select a player to view and send feedback.</p>
            </Card>
          ) : (
            <>
              {/* Selected User Info */}
              {selectedUserData && (
                <Card className="p-5 border border-gray-800/60 bg-[#0d1117] rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-sm font-bold text-white">
                        {selectedUserData.username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{selectedUserData.username}</p>
                        <p className="text-xs text-gray-400">{selectedUserData.email}</p>
                      </div>
                    </div>
                    <Link href={`/coach/dashboard/players/${selectedUser}`}>
                      <Button size="sm" variant="outline" className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 rounded-xl text-xs">
                        View Profile →
                      </Button>
                    </Link>
                  </div>
                </Card>
              )}

              {/* Write Feedback */}
              <Card className="p-6 border border-emerald-500/20 bg-emerald-500/5 rounded-2xl">
                <h3 className="text-lg font-semibold text-emerald-400 mb-4">Write Feedback</h3>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Rating:</span>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackRating(star === feedbackRating ? 0 : star)}
                        className={`p-0.5 transition ${feedbackRating >= star ? 'text-amber-400' : 'text-gray-600 hover:text-gray-400'}`}
                      >
                        <Star size={18} fill={feedbackRating >= star ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Write your coaching feedback..."
                    rows={4}
                    className="w-full bg-gray-800/50 border border-gray-700/50 text-gray-200 rounded-xl px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={submitFeedback}
                      disabled={submitting || !feedbackText.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                    >
                      {submitting ? 'Sending...' : 'Send Feedback'}
                    </Button>
                    {success && (
                      <span className="text-sm text-emerald-400 animate-pulse">✓ Feedback sent!</span>
                    )}
                  </div>
                </div>
              </Card>

              {/* Feedback History */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Feedback History</h3>
                {feedback.length === 0 ? (
                  <Card className="p-8 border border-gray-800/60 bg-[#0d1117] rounded-2xl text-center text-gray-500">
                    <p>No feedback sent to this player yet.</p>
                  </Card>
                ) : (
                  feedback.map(fb => (
                    <Card key={fb.feedback_id} className="p-5 border border-gray-800/60 bg-[#0d1117] rounded-xl">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-emerald-400">{fb.coach_name}</span>
                          {fb.rating && (
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} size={11} className={fb.rating && fb.rating >= s ? 'text-amber-400' : 'text-gray-700'} fill={fb.rating && fb.rating >= s ? 'currentColor' : 'none'} />
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}
