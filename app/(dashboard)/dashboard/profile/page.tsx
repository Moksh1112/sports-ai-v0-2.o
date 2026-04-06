'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
    const { user, logout, token } = useAuth()
    const router = useRouter()

    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const handleLogout = () => {
        logout()
        router.push('/login')
    }

    const handleChangePassword = async () => {
        setLoading(true)
        setMessage('')
        setError('')

        try {
            const res = await fetch('http://localhost:5000/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed')
            }

            setMessage('Password updated successfully')
            setCurrentPassword('')
            setNewPassword('')
        } catch (err: any) {
            setError(err.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 p-4 md:p-8">

            {/* TITLE */}
            <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
                <h1 className="text-3xl font-bold tracking-tight text-white">
                    Profile Settings
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    Manage your account settings and preferences.
                </p>
            </div>

            {/* USER INFO */}
            <Card className="overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-xl">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">User Information</h2>
                </div>
                <div className="p-6 flex items-center gap-6">
                    {/* Avatar Placeholder */}
                    <div className="h-20 w-20 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-600 dark:text-white flex items-center justify-center text-3xl font-bold shadow-sm shrink-0">
                        {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        <div className="space-y-1.5">
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Username
                            </p>
                            <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
                                {user?.username || 'User'}
                            </p>
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Email Address
                            </p>
                            <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
                                {user?.email || 'user@email.com'}
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* CHANGE PASSWORD */}
            <Card className="overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-xl">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Security</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Update your password to keep your account secure.</p>
                </div>

                <div className="p-6 space-y-5 max-w-md">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Current Password</label>
                        <input
                            type="password"
                            placeholder="Enter current password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">New Password</label>
                        <input
                            type="password"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                    </div>

                    <Button
                        onClick={handleChangePassword}
                        disabled={loading || !currentPassword || !newPassword}
                        className="w-full sm:w-auto mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </Button>

                    {/* SUCCESS BANNER */}
                    {message && (
                        <div className="p-3 rounded-lg bg-green-50 border border-green-200 dark:bg-green-500/10 dark:border-green-500/20 mt-4">
                            <span className="text-green-700 dark:text-green-400 text-sm font-semibold flex items-center gap-2">
                                ✅ {message}
                            </span>
                        </div>
                    )}

                    {/* ERROR BANNER */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20 mt-4">
                            <span className="text-red-700 dark:text-red-400 text-sm font-semibold flex items-center gap-2">
                                ⚠️ {error}
                            </span>
                        </div>
                    )}
                </div>
            </Card>

            {/* LOGOUT / DANGER ZONE */}
            <Card className="border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/10 overflow-hidden rounded-xl">
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-red-700 dark:text-red-500 mb-1">
                        Danger Zone
                    </h2>
                    <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-6">
                        Log out of your current session on this device.
                    </p>

                    <Button
                        onClick={handleLogout}
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700 text-white transition-colors"
                    >
                        Log Out
                    </Button>
                </div>
            </Card>
        </div>
    )
}