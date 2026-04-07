'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  const { isAuthenticated, isCoach } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      if (isCoach) {
        router.push('/coach/dashboard')
      } else {
        router.push('/dashboard')
      }
    }
  }, [isAuthenticated, isCoach])
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">FA</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Football Analysis</h1>
          </div>
          <nav className="flex gap-4">
            <Link href="/login">
              <Button variant="outline" className="border-border">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Sign Up
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-3xl">
          <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance">
            Analyze Football Performance with AI
          </h2>
          <p className="text-xl text-muted-foreground mb-8 text-balance">
            Upload football performance videos and get detailed AI-powered analysis of speed, balance, agility, and coordination metrics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Get Started Free
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-border">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-card border-y border-border py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-foreground mb-12 text-center">Features</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'AI-Powered Analysis',
                description: 'Advanced computer vision and machine learning to analyze athletic performance in detail.',
              },
              {
                title: 'Multiple Drill Types',
                description: 'Support for sprints, agility drills, jumps, balance tests, and coordination exercises.',
              },
              {
                title: 'Detailed Metrics',
                description: 'Get comprehensive reports with speed, balance, stride length, agility, and coordination scores.',
              },
            ].map((feature, index) => (
              <div key={index} className="p-6 rounded-lg border border-border bg-background">
                <h4 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h4>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h3 className="text-3xl font-bold text-foreground mb-6">Ready to get started?</h3>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Create your account and upload your first video to analyze performance metrics.
        </p>
        <Link href="/register">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Start Analyzing Today
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <p>&copy; 2024 Football Analysis. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
