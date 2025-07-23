import { NextResponse } from 'next/server'

// Simple status endpoint for load balancers and monitoring tools
export const runtime = 'nodejs'

export async function GET() {
  const response = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'donations-api',
    version: '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'unknown'
  }
  
  return NextResponse.json(response, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}

// Support HEAD requests for simple alive checks
export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}