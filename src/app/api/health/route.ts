import { NextResponse } from 'next/server'
import { checkDatabaseHealth } from '@/lib/db-health'

export async function GET() {
  try {
    const dbHealth = await checkDatabaseHealth()
    
    if (dbHealth.status === 'healthy') {
      return NextResponse.json({ 
        status: 'ok', 
        database: 'connected',
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({ 
        status: 'error', 
        database: 'disconnected',
        error: dbHealth.error,
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }
  } catch (error) {
    return NextResponse.json({ 
      status: 'error', 
      database: 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}