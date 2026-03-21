import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    console.log("Fetching result from backend:", id)

    // Forward to Flask backend
    const backendUrl = `http://localhost:5000/api/videos/results/${id}`
    const authHeader = request.headers.get('authorization')

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader || '',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`Backend error ${response.status}:`, await response.text())
      return NextResponse.json(
        { error: 'Result not found or server error' },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log("Backend response:", data)

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      }
    })

  } catch (error) {
    console.error("Proxy error:", error)
    return NextResponse.json(
      { error: 'Failed to fetch result from backend' },
      { status: 500 }
    )
  }
}

