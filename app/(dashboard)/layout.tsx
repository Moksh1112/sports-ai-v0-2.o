'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Video, BarChart, User, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const { logout } = useAuth()

    const navItems = [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart },
        { name: 'Profile', href: '/dashboard/profile', icon: User },
    ]

    const handleLogout = () => {
        logout()
        router.push('/login')
    }

    return (
        <div className="flex min-h-screen bg-gray-950 text-white">

            {/* SIDEBAR */}
            <aside className="w-64 bg-gray-900 border-r border-gray-800 p-6 flex flex-col justify-between">

                <div>
                    <h1 className="text-2xl font-bold mb-10 text-blue-500">
                        ⚽ Football AI
                    </h1>

                    <nav className="space-y-2">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const active = pathname === item.href

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${active
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-300 hover:bg-gray-800'
                                        }`}
                                >
                                    <Icon size={18} />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                {/* LOGOUT */}
                <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                    <LogOut size={16} className="mr-2" />
                    Logout
                </Button>
            </aside>

            {/* MAIN AREA */}
            <div className="flex-1 flex flex-col">

                {/* TOPBAR */}
                <header className="h-16 border-b border-gray-800 flex items-center justify-between px-8 bg-gray-950">
                    <h2 className="text-lg font-semibold capitalize">
                        {pathname.replace('/dashboard', '').replace('/', '') || 'Dashboard'}
                    </h2>

                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                            U
                        </div>
                    </div>
                </header>

                {/* PAGE CONTENT */}
                <main className="p-8 flex-1">
                    {children}
                </main>
            </div>
        </div>
    )
}