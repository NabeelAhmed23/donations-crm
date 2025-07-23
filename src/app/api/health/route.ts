import { NextResponse } from 'next/server'
import { checkDatabaseHealth } from '@/lib/db-health'

// This is a public endpoint for monitoring
export const runtime = 'nodejs'

export async function GET() {
  const startTime = Date.now()
  
  try {
    const dbHealth = await checkDatabaseHealth()
    const totalResponseTime = Date.now() - startTime
    
    const response = {
      service: 'Donations Management System',
      version: '1.0.0',
      status: dbHealth.status,
      timestamp: new Date().toISOString(),
      responseTime: totalResponseTime,
      database: {
        status: dbHealth.connection.active ? 'connected' : 'disconnected',
        responseTime: dbHealth.responseTime,
        queries: {
          basic: dbHealth.queries.basic,
          userCount: dbHealth.queries.userCount
        },
        error: dbHealth.connection.error || dbHealth.queries.error
      },
      environment: process.env.NODE_ENV || 'unknown'
    }

    // Return appropriate HTTP status based on health
    const httpStatus = dbHealth.status === 'healthy' ? 200 
                     : dbHealth.status === 'degraded' ? 200 
                     : 503
    
    return NextResponse.json(response, { status: httpStatus })
    
  } catch (error) {
    const errorResponse = {
      service: 'Donations Management System',
      version: '1.0.0',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      database: {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      environment: process.env.NODE_ENV || 'unknown'
    }
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
}