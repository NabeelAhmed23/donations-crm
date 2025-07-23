# Deployment Guide - Vercel + Supabase

## Supabase Database Setup

### 1. Get Your Supabase Connection Strings

From your Supabase dashboard, go to **Settings > Database** and get:

1. **Connection Pooling URL** (for `DATABASE_URL`)
   - Use the "Transaction" mode URL
   - Format: `postgresql://postgres.xxx:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`

2. **Direct Connection URL** (for `DIRECT_URL`)
   - Use the direct connection URL
   - Format: `postgresql://postgres.xxx:[password]@aws-0-us-east-1.compute.amazonaws.com:5432/postgres`

### 2. Vercel Environment Variables

Set these in your Vercel dashboard under **Settings > Environment Variables**:

```bash
# Database URLs
DATABASE_URL="postgresql://postgres.xxx:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:[password]@aws-0-us-east-1.compute.amazonaws.com:5432/postgres"

# Authentication
NEXTAUTH_URL="https://your-vercel-app.vercel.app"
NEXTAUTH_SECRET="your-secure-nextauth-secret-32-chars-min"
AUTH_SECRET="your-secure-auth-secret-32-chars-min"
JWT_SECRET="your-secure-jwt-secret-32-chars-min"

# Email (Optional - for forgot password)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### 3. Deploy Commands

```bash
# Option 1: Use the deployment script
./deploy.sh

# Option 2: Manual steps
npx prisma generate
npx prisma db push
npm run build
vercel --prod
```

### 4. Health Check Endpoints

After deployment, use these endpoints to monitor your application:

```bash
# Basic health check (JSON)
https://your-app.vercel.app/api/health

# Simple status (for load balancers)
https://your-app.vercel.app/api/health/status

# Database-specific health
https://your-app.vercel.app/api/health/database

# Detailed system information
https://your-app.vercel.app/api/health/detailed

# HTML dashboard (for browsers)
https://your-app.vercel.app/api/health/html
https://your-app.vercel.app/health
```

### 5. Troubleshooting

If you're still getting Prisma errors:

1. **Check Connection**: Ensure your DATABASE_URL is correct
2. **Schema Sync**: Run `npx prisma db push` to sync your schema
3. **Regenerate Client**: Run `npx prisma generate` 
4. **Redeploy**: Deploy again to Vercel after schema changes
5. **Monitor Health**: Use `/api/health/detailed` for diagnostic information

## Common Issues

### Connection Pool Exhaustion
- Use the pooled connection URL for DATABASE_URL
- Use direct connection URL for DIRECT_URL
- This allows Prisma to use connection pooling for regular queries and direct connections for migrations

### Cold Start Issues
- The optimized Prisma client configuration reduces cold start times
- Connection pooling helps maintain connections across function invocations

### Schema Changes
- Always run `npx prisma db push` after schema changes
- Redeploy to Vercel after database schema updates

## Monitoring & Health Checks

The application includes comprehensive health monitoring:

- **Real-time Dashboard**: `/health` - Visual health monitoring dashboard
- **API Endpoints**: Multiple health check endpoints for different monitoring needs
- **Auto-refresh**: Health dashboard auto-refreshes every 30 seconds
- **Error Reporting**: Detailed error information when issues occur

### Health Check Response Format

```json
{
  "service": {
    "name": "Donations Management System",
    "version": "1.0.0",
    "status": "healthy",
    "uptime": 3600,
    "environment": "production"
  },
  "timing": {
    "timestamp": "2024-01-01T12:00:00.000Z",
    "responseTime": 45,
    "databaseResponseTime": 23
  },
  "database": {
    "connection": { "active": true },
    "queries": { "basic": true, "userCount": 150 },
    "stats": { "users": 150, "donations": 25, "payments": 300 }
  },
  "summary": {
    "overall": "healthy",
    "checks": { "database": "pass", "queries": "pass" }
  }
}
```