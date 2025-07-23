import { NextResponse } from 'next/server'
import { checkDatabaseConnection, getDatabaseStats } from '@/lib/db-health'

// Database-specific health check endpoint
export const runtime = 'nodejs'

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Check basic connection
    const connectionCheck = await checkDatabaseConnection()
    
    let stats = null
    let statsError = null
    
    // If connected, try to get stats
    if (connectionCheck.connected) {
      try {
        stats = await getDatabaseStats()
      } catch (error) {
        statsError = error instanceof Error ? error.message : 'Failed to get stats'
      }
    }
    
    const response = {
      database: {
        connected: connectionCheck.connected,
        responseTime: connectionCheck.responseTime,
        error: connectionCheck.error,
        stats: stats,
        statsError: statsError
      },
      timestamp: new Date().toISOString(),
      totalResponseTime: Date.now() - startTime
    }
    
    const httpStatus = connectionCheck.connected ? 200 : 503
    return NextResponse.json(response, { status: httpStatus })
    
  } catch (error) {
    return NextResponse.json({
      database: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString(),
      totalResponseTime: Date.now() - startTime
    }, { status: 500 })
  }
}