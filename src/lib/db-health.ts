import { prisma } from './prisma'

export interface DatabaseHealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded'
  responseTime: number
  connection: {
    active: boolean
    poolSize?: number
    error?: string
  }
  queries: {
    basic: boolean
    userCount?: number
    error?: string
  }
  timestamp: string
}

export async function checkDatabaseHealth(): Promise<DatabaseHealthCheck> {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()
  
  const result: DatabaseHealthCheck = {
    status: 'unhealthy',
    responseTime: 0,
    connection: { active: false },
    queries: { basic: false },
    timestamp
  }

  try {
    // Test basic connection
    await prisma.$queryRaw`SELECT 1 as test`
    result.connection.active = true
    result.queries.basic = true

    // Test actual table query (non-sensitive)
    try {
      const userCount = await prisma.user.count()
      result.queries.userCount = userCount
      result.status = 'healthy'
    } catch (queryError) {
      result.status = 'degraded'
      result.queries.error = queryError instanceof Error ? queryError.message : 'Query failed'
    }

  } catch (error) {
    result.connection.error = error instanceof Error ? error.message : 'Connection failed'
    result.queries.error = 'Could not execute queries'
  }

  result.responseTime = Date.now() - startTime
  return result
}

export async function checkDatabaseConnection(): Promise<{ connected: boolean; error?: string; responseTime: number }> {
  const startTime = Date.now()
  
  try {
    await prisma.$queryRaw`SELECT 1`
    return { 
      connected: true, 
      responseTime: Date.now() - startTime 
    }
  } catch (error) {
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime
    }
  }
}

export async function getDatabaseStats() {
  try {
    const [userCount, donationCount, paymentCount] = await Promise.all([
      prisma.user.count(),
      prisma.donation.count(),
      prisma.payment.count()
    ])

    return {
      users: userCount,
      donations: donationCount,
      payments: paymentCount,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    throw new Error(`Failed to get database stats: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function gracefulPrismaDisconnect() {
  try {
    await prisma.$disconnect()
  } catch (error) {
    console.error('Error disconnecting from database:', error)
  }
}