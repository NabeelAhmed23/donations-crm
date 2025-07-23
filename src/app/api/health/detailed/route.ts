import { NextResponse } from 'next/server'
import { checkDatabaseHealth, getDatabaseStats } from '@/lib/db-health'

// Detailed health check with comprehensive system information
export const runtime = 'nodejs'

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Get database health
    const dbHealth = await checkDatabaseHealth()
    
    // Get additional stats if database is healthy
    let additionalStats = null
    try {
      if (dbHealth.status === 'healthy') {
        additionalStats = await getDatabaseStats()
      }
    } catch (error) {
      // Stats failure doesn't affect overall health
      console.warn('Failed to get additional stats:', error)
    }
    
    const response = {
      service: {
        name: 'Donations Management System',
        version: '1.0.0',
        status: dbHealth.status,
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'unknown'
      },
      timing: {
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        databaseResponseTime: dbHealth.responseTime
      },
      database: {
        connection: {
          active: dbHealth.connection.active,
          poolSize: dbHealth.connection.poolSize,
          error: dbHealth.connection.error
        },
        queries: {
          basic: dbHealth.queries.basic,
          userCount: dbHealth.queries.userCount,
          error: dbHealth.queries.error
        },
        stats: additionalStats
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024)
        }
      },
      summary: {
        overall: dbHealth.status,
        checks: {
          database: dbHealth.connection.active ? 'pass' : 'fail',
          queries: dbHealth.queries.basic ? 'pass' : 'fail'
        }
      }
    }
    
    const httpStatus = dbHealth.status === 'healthy' ? 200 
                     : dbHealth.status === 'degraded' ? 200 
                     : 503
    
    return NextResponse.json(response, { 
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    })
    
  } catch (error) {
    const errorResponse = {
      service: {
        name: 'Donations Management System',
        version: '1.0.0',
        status: 'unhealthy',
        environment: process.env.NODE_ENV || 'unknown'
      },
      timing: {
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime
      },
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: 'HealthCheckError'
      },
      summary: {
        overall: 'unhealthy',
        checks: {
          database: 'fail',
          queries: 'fail'
        }
      }
    }
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
}