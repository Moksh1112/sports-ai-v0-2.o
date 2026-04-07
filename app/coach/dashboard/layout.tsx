'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Users,
  BarChart3,
  MessageSquare,
  Trophy,
  LayoutDashboard,
  LogOut,
  Shield
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { useEffect } from 'react'

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, isAuthenticated, isCoach, user, loading } = useAuth()

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isCoach)) {
      router.push('/login')
    }
  }, [isAuthenticated, isCoach, loading, router])

  const navItems = [
    { name: 'Overview', href: '/coach/dashboard', icon: LayoutDashboard },
    { name: 'Players', href: '/coach/dashboard/players', icon: Users },
    { name: 'Analytics', href: '/coach/dashboard/analytics', icon: BarChart3 },
    { name: 'Feedback', href: '/coach/dashboard/feedback', icon: MessageSquare },
    { name: 'Leaderboard', href: '/coach/dashboard/leaderboard', icon: Trophy },
  ]

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b0f17]">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (!isAuthenticated || !isCoach) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-[#0b0f17] text-white">

      {/* SIDEBAR */}
      <aside className="w-72 bg-[#0d1117] border-r border-gray-800/60 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Coach Panel</h1>
              <p className="text-xs text-gray-500">Football Analysis</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  active
                    ? 'bg-emerald-500/15 text-emerald-400 shadow-sm'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                }`}
              >
                <Icon size={18} className={active ? 'text-emerald-400' : 'text-gray-500 group-hover:text-gray-300'} />
                <span className="font-medium text-sm">{item.name}</span>
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User info + Logout */}
        <div className="p-4 border-t border-gray-800/60">
          <div className="flex items-center gap-3 px-4 py-3 mb-3 rounded-xl bg-gray-800/30">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-sm font-bold text-white">
              {user?.username?.charAt(0).toUpperCase() || 'C'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">{user?.username}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-gray-700/50 text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 rounded-xl"
          >
            <LogOut size={16} className="mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* TOPBAR */}
        <header className="h-16 border-b border-gray-800/60 flex items-center justify-between px-8 bg-[#0b0f17]/80 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-gray-200">
            {navItems.find(n => n.href === pathname)?.name || 'Coach Dashboard'}
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
              Coach Mode
            </span>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
