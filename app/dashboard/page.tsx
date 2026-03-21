'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Header } from '@/components/header'
import { ProtectedRoute } from '@/lib/protected-route'
import { VideoUploadForm } from '@/components/video-upload-form'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

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

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchVideos()
    }
  }, [isAuthenticated, token])

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/videos/user-videos', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch videos')
      }

      const data = await response.json()
      setVideos(data.videos || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch videos')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadSuccess = (videoId: string) => {
    setShowUpload(false)
    // Refresh videos list
    fetchVideos()
  }

  const handleAnalyze = async (videoId: string) => {
    try {
      const response = await fetch(`/api/videos/${videoId}/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const data = await response.json()
      // Redirect to results page
      router.push(`/results/${data.result_id}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Analysis failed')
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {showUpload ? (
            <div className="max-w-2xl">
              <Button
                onClick={() => setShowUpload(false)}
                variant="outline"
                className="mb-6"
              >
                Back to Dashboard
              </Button>
              <VideoUploadForm onSuccess={handleUploadSuccess} />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Your Videos</h1>
                  <p className="text-muted-foreground mt-2">Upload and analyze football performance videos</p>
                </div>
                <Button
                  onClick={() => setShowUpload(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Upload Video
                </Button>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : videos.length === 0 ? (
                <Card className="border border-border bg-card p-12 text-center">
                  <p className="text-muted-foreground mb-4">No videos uploaded yet</p>
                  <Button
                    onClick={() => setShowUpload(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Upload Your First Video
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {videos.map((video) => (
                    <Card key={video.video_id} className="border border-border bg-card p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground">{video.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Drill Type: <span className="capitalize font-medium">{video.drill_type}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Uploaded: {new Date(video.created_at).toLocaleDateString()}
                          </p>
                          <div className="mt-2">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${video.status === 'analyzed'
                                ? 'bg-green-100/20 text-green-700 dark:text-green-400'
                                : video.status === 'processing'
                                  ? 'bg-blue-100/20 text-blue-700 dark:text-blue-400'
                                  : 'bg-yellow-100/20 text-yellow-700 dark:text-yellow-400'
                              }`}>
                              {video.status.charAt(0).toUpperCase() + video.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {video.result_id ? (
                            <Link href={`/results/${video.result_id}`}>
                              <Button variant="outline" className="border-border">
                                View Results
                              </Button>
                            </Link>
                          ) : (
                            <Button
                              onClick={() => handleAnalyze(video.video_id)}
                              className="bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                              Analyze
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}
