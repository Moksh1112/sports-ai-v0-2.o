'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card } from '@/components/ui/card'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'

interface ChartData {
    name: string
    score: number
}

export default function AnalyticsPage() {
    const { token } = useAuth()
    const [data, setData] = useState<ChartData[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (token) {
            fetchAnalytics()
        }
    }, [token])

    const fetchAnalytics = async () => {
        try {
            const res = await fetch('/api/videos/user-videos', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!res.ok) {
                throw new Error('Failed to fetch videos')
            }

            const videos = await res.json()

            const formatted: ChartData[] = (videos.videos || []).map(
                (v: any, index: number) => ({
                    name: v.title || `Video ${index + 1}`,
                    score: v.metrics?.overall_score || 0, // TEMP (replace later)
                })
            )

            setData(formatted)
        } catch (err) {
            console.error('Analytics error:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-8">

            {/* TITLE */}
            <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
                <h1 className="text-3xl font-bold tracking-tight text-white">
                    Analytics
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    Performance insights and metrics for your generated videos.
                </p>
            </div>

            {/* STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-xl transition-all hover:shadow-md">
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Total Videos
                    </p>
                    <h2 className="text-4xl font-bold text-slate-900 dark:text-white mt-3">
                        {data.length}
                    </h2>
                </Card>

                <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-xl transition-all hover:shadow-md">
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Avg Score
                    </p>
                    <h2 className="text-4xl font-bold text-blue-600 dark:text-blue-400 mt-3">
                        {data.length
                            ? Math.round(
                                data.reduce((a, b) => a + b.score, 0) / data.length
                            )
                            : 0}
                    </h2>
                </Card>

                <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-xl transition-all hover:shadow-md">
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Best Score
                    </p>
                    <h2 className="text-4xl font-bold text-green-600 dark:text-green-400 mt-3">
                        {data.length
                            ? Math.max(...data.map((d) => d.score))
                            : 0}
                    </h2>
                </Card>
            </div>

            {/* CHART */}
            <Card className="overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-xl">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Performance Chart
                    </h2>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="h-80 flex items-center justify-center">
                            <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">
                                Loading analytics data...
                            </p>
                        </div>
                    ) : data.length === 0 ? (
                        <div className="h-80 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                            <p className="text-slate-500 dark:text-slate-400 font-medium">
                                No video data available yet.
                            </p>
                        </div>
                    ) : (
                        <div className="h-80 w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <XAxis
                                        dataKey="name"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'var(--tw-colors-slate-800)', opacity: 0.1 }}
                                        contentStyle={{
                                            backgroundColor: '#1e293b',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: '#f8fafc',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                        itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
                                    />
                                    <Bar
                                        dataKey="score"
                                        fill="#3b82f6"
                                        radius={[6, 6, 0, 0]}
                                        maxBarSize={60}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
}