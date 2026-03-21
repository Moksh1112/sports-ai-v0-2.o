import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.API_URL || 'http://localhost:5000'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()

    const response = await fetch(`${API_URL}/api/videos/upload`, {
      method: 'POST',
      headers: {
        'Authorization': token,
      },
      body: formData,
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(result, { status: response.status })
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('[v0] Upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
