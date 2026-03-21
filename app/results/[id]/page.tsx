'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Header } from '@/components/header'
import { ProtectedRoute } from '@/lib/protected-route'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Metrics {
  average_speed: number
  max_speed: number
  balance_score: number
  stride_length: number
  agility_score: number
  coordination_score: number
  overall_score: number
  frames_processed: number
  confidence: number
}

interface Result {
  result_id: string
  video_id: string
  title: string
  drill_type: string
  metrics: Metrics
  status: string
  processing_time_seconds: number
  created_at: string
}

function MetricCard({ label, value, unit = '%' }: { label: string; value: number; unit?: string }) {
  return (
    <div className="p-4 bg-background rounded-lg border border-border">
      <p className="text-sm text-muted-foreground mb-2">{label}</p>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-foreground">
          {typeof value === 'number' ? value.toFixed(1) : value}
        </span>
        <span className="text-muted-foreground mb-1">{unit}</span>
      </div>
      <div className="mt-3 w-full bg-border rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  )
}

export default function ResultsPage() {
  const params = useParams()
  const resultId = params.id as string
  const { token } = useAuth()
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (token && resultId) {
      fetchResult()
    }
  }, [token, resultId])

  const fetchResult = async () => {
    try {
      const response = await fetch(`/api/videos/results/${resultId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch results')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch results')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link href="/dashboard">
            <Button variant="outline" className="mb-6 border-border">
              Back to Dashboard
            </Button>
          </Link>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : result ? (
            <>
              <Card className="border border-border bg-card p-8 mb-8">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-foreground mb-2">{result.title}</h1>
                  <p className="text-muted-foreground">
                    {new Date(result.created_at).toLocaleDateString()} • {' '}
                    <span className="capitalize font-medium">{result.drill_type}</span>
                  </p>
                </div>

                <div className="mb-8 p-4 bg-background rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground mb-2">Overall Performance</p>
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-4xl font-bold text-primary">
                      {result.metrics.overall_score.toFixed(1)}
                    </span>
                    <span className="text-2xl text-muted-foreground mb-2">/100</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full transition-all"
                      style={{ width: `${result.metrics.overall_score}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <MetricCard label="Average Speed" value={result.metrics.average_speed} />
                  <MetricCard label="Max Speed" value={result.metrics.max_speed} />
                  <MetricCard label="Balance Score" value={result.metrics.balance_score} />
                  <MetricCard label="Stride Length" value={result.metrics.stride_length} />
                  <MetricCard label="Agility Score" value={result.metrics.agility_score} />
                  <MetricCard label="Coordination" value={result.metrics.coordination_score} />
                </div>

                <div className="mt-8 pt-6 border-t border-border">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Frames Processed</p>
                      <p className="text-lg font-semibold text-foreground">{result.metrics.frames_processed}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Confidence</p>
                      <p className="text-lg font-semibold text-foreground">{(result.metrics.confidence * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Processing Time</p>
                      <p className="text-lg font-semibold text-foreground">{result.processing_time_seconds.toFixed(1)}s</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Status</p>
                      <p className="text-lg font-semibold text-foreground capitalize">{result.status}</p>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="text-center">
                <Link href="/dashboard">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Analyze Another Video
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <Card className="border border-border bg-card p-12 text-center">
              <p className="text-muted-foreground">Result not found</p>
            </Card>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}
