// ✅ ANALYZE ROUTE
// Handles POST /api/videos/:id/analyze

import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.API_URL || 'http://localhost:5000'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params

    const token = request.headers.get('Authorization')

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log("Analyzing video:", videoId)

    const response = await fetch(`${API_URL}/api/videos/${videoId}/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json().catch(() => ({
      error: 'Invalid backend response'
    }))

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Analyze API error:', error)

    return NextResponse.json(
      { error: 'Analyze failed' },
      { status: 500 }
    )
  }
}