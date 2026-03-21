import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.API_URL || 'http://localhost:5000'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        return NextResponse.json(result, { status: response.status })
      }

      return NextResponse.json(result, { status: 201 })
    } catch (fetchError: unknown) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError)
      
      if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed')) {
        return NextResponse.json(
          { 
            error: 'Backend server is not running. Please ensure the Flask API is started with: uv run run.py'
          },
          { status: 503 }
        )
      }
      throw fetchError
    }
  } catch (error) {
    console.error('[v0] Register API error:', error)
    return NextResponse.json(
      { error: 'Failed to process registration' },
      { status: 500 }
    )
  }
}
