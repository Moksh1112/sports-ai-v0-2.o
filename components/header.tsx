'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function Header() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">FA</span>
          </div>
          <h1 className="text-xl font-bold text-foreground hidden sm:block">
            Football Analysis
          </h1>
        </Link>

        <div className="flex items-center gap-4">
          {user && (
            <>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">{user.username}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-border"
              >
                Sign Out
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
