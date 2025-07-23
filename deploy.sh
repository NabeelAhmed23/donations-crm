#!/bin/bash

echo "🚀 Deploying Donations App to Vercel with Supabase"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    echo "Please add your Supabase connection string to Vercel environment variables"
    exit 1
fi

echo "📦 Generating Prisma client..."
npx prisma generate

echo "🗄️ Pushing database schema to Supabase..."
npx prisma db push

echo "🌱 Running database seed (optional)..."
npm run db:seed || echo "⚠️ Seed failed or no seed file found"

echo "🔨 Building application..."
npm run build

echo "🚀 Deploying to Vercel..." 
vercel --prod

echo "✅ Deployment complete!"
echo "🔍 Check your deployment at: https://your-app.vercel.app"
echo "🩺 Health check: https://your-app.vercel.app/api/health"