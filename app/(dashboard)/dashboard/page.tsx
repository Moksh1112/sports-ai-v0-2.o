'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { ProtectedRoute } from '@/lib/protected-route'
import { VideoUploadForm } from '@/components/video-upload-form'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Plus,
  ChevronLeft,
  PlayCircle,
  Trash2,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

interface Video {
  video_id: string
  title: string
  drill_type: string
  status: string
  created_at: string
  result_id: string | null
}

export default function DashboardPage() {
  const { isAuthenticated, token } = useAuth()
  const router = useRouter()

  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    if (isAuthenticated && token) {
      fetchVideos(isMounted)
    }
    return () => { isMounted = false }
  }, [isAuthenticated, token])

  const fetchVideos = async (isMounted = true) => {
    try {
      const response = await fetch('/api/videos/user-videos', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error()
      const data = await response.json()
      if (isMounted) {
        setVideos(Array.isArray(data?.videos) ? data.videos : [])
      }
    } catch {
      if (isMounted) setError('Failed to fetch videos. Please try again.')
    } finally {
      if (isMounted) setLoading(false)
    }
  }

  const handleAnalyze = async (videoId: string) => {
    setAnalyzingId(videoId)
    try {
      const response = await fetch(`/api/videos/${videoId}/analyze`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error()
      const data = await response.json()
      router.push(`/results/${data.result_id}`)
    } catch {
      alert('Analysis failed')
    } finally {
      setAnalyzingId(null)
    }
  }

  const handleDelete = async (videoId: string) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return

    setDeletingId(videoId)

    try {
      const response = await fetch(`http://localhost:5000/api/videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Delete failed')
      }

      setVideos((prev) => prev.filter((v) => v.video_id !== videoId))

    } catch (err: any) {
      alert(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const analyzedCount = videos.filter(v => v.status === 'analyzed').length

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0b0f17] text-gray-300 selection:bg-blue-500/30">
        <div className="max-w-5xl mx-auto space-y-8 p-6 md:p-12">

          {/* HEADER */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-white">
                Dashboard
              </h1>
              <p className="text-gray-400 mt-2 text-lg">
                Video analysis and performance tracking.
              </p>
            </div>

            {!showUpload && (
              <Button
                onClick={() => setShowUpload(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-6 rounded-xl shadow-lg shadow-blue-900/30 transition-all active:scale-95 font-semibold"
              >
                <Plus className="mr-2 h-5 w-5" />
                Upload Video
              </Button>
            )}
          </div>

          {/* ERROR */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-400/40 text-red-300">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {showUpload ? (
            <Card className="p-6 md:p-10 border border-gray-700 bg-[#161a22] rounded-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
              <Button
                variant="ghost"
                onClick={() => setShowUpload(false)}
                className="mb-8 -ml-2 text-gray-400 hover:text-white hover:bg-[#1c212b]"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Videos
              </Button>
              <VideoUploadForm onSuccess={() => {
                setShowUpload(false)
                fetchVideos()
              }} />
            </Card>
          ) : (
            <div className="space-y-8">

              {/* STATS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  { label: 'Total Videos', val: videos.length, color: 'text-white', icon: PlayCircle },
                  { label: 'Analyzed', val: analyzedCount, color: 'text-emerald-400', icon: CheckCircle2 },
                  { label: 'Pending', val: videos.length - analyzedCount, color: 'text-amber-400', icon: Clock }
                ].map((stat, i) => (
                  <Card
                    key={i}
                    className="p-6 border border-gray-700 bg-[#161a22] rounded-2xl hover:bg-[#1c212b] shadow-[0_0_0_1px_rgba(255,255,255,0.02)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-sm text-gray-300 font-medium">
                        {stat.label}
                      </p>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <h2 className={`text-5xl font-semibold tracking-tight mt-4 ${stat.color}`}>
                      {loading ? "..." : stat.val}
                    </h2>
                  </Card>
                ))}
              </div>

              {/* LIST */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    Recent Uploads
                    <span className="text-sm bg-[#1c212b] border border-gray-700 px-3 py-1 rounded-full text-gray-300 font-mono">
                      {videos.length}
                    </span>
                  </h2>
                </div>

                <div className="space-y-3">
                  {loading ? (
                    <div className="py-20 text-center border border-gray-700 rounded-2xl bg-[#161a22]">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                      <p className="text-gray-400 font-medium">Fetching your footage...</p>
                    </div>
                  ) : videos.length === 0 ? (
                    <div className="py-20 text-center border border-gray-700 rounded-2xl bg-[#161a22]">
                      <PlayCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-300 text-lg mb-6">No videos found in your library</p>
                      <Button
                        onClick={() => setShowUpload(true)}
                        className="bg-[#1c212b] hover:bg-[#252b36] text-white border border-gray-700"
                      >
                        Upload your first video
                      </Button>
                    </div>
                  ) : (
                    videos.map((video) => (
                      <Card
                        key={video.video_id}
                        className="group p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-gray-700 bg-[#161a22] hover:bg-[#1c212b] hover:border-gray-500 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all rounded-xl"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white truncate group-hover:text-blue-400 transition">
                              {video.title}
                            </h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide border ${video.status.toLowerCase() === 'analyzed'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              }`}>
                              {video.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1.5 text-gray-300">
                              <BarChart3 className="h-4 w-4 text-gray-300" />
                              {video.drill_type}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-gray-500" />
                            <span className="flex items-center gap-1.5 text-gray-400">
                              <Clock className="h-4 w-4 text-gray-300" />
                              {video.created_at ? new Date(video.created_at).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {video.result_id ? (
                            <Button
                              size="sm"
                              className="bg-[#1c212b] hover:bg-[#252b36] text-white border border-gray-600 hover:border-gray-500 rounded-xl px-5 py-5 shadow-sm hover:shadow-md"
                              onClick={() => router.push(`/results/${video.result_id}`)}
                            >
                              View Insights
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleAnalyze(video.video_id)}
                              disabled={analyzingId === video.video_id}
                              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-5 font-semibold"
                            >
                              {analyzingId === video.video_id ? 'Analysing...' : 'Run Analysis'}
                            </Button>
                          )}

                          <Button
                            size="icon"
                            onClick={() => handleDelete(video.video_id)}
                            disabled={deletingId === video.video_id}
                            className="h-10 w-10 bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-400/30 hover:border-red-400/50 rounded-xl"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}