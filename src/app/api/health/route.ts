import { createServerClient, validateDatabaseSchema } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      database: "unknown",
      openai: "unknown"
    },
    environment: {
      supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
      openai_key: !!process.env.OPENAI_API_KEY
    }
  }

  // Check Supabase connection
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = await createServerClient()
      const schemaValidation = await validateDatabaseSchema()
      
      if (schemaValidation.valid) {
        health.services.database = "healthy"
      } else {
        health.services.database = "degraded"
        health.status = "degraded"
      }
    } else {
      health.services.database = "not_configured"
      health.status = "degraded"
    }
  } catch (error: any) {
    health.services.database = "unhealthy"
    health.status = "unhealthy"
  }

  // Check OpenAI API key
  if (process.env.OPENAI_API_KEY) {
    health.services.openai = "configured"
  } else {
    health.services.openai = "not_configured"
    if (health.status === "healthy") {
      health.status = "degraded"
    }
  }

  const statusCode = health.status === "healthy" ? 200 : 
                     health.status === "degraded" ? 200 : 503

  return NextResponse.json(health, { status: statusCode })
}