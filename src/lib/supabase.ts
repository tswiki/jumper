import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client for API routes with enhanced error handling
export async function createServerClient() {
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required')
  }
  
  if (!supabaseAnonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY environment variable is required')
  }
  
  try {
    const client = createClient(supabaseUrl, supabaseAnonKey)
    
    // Test the connection
    const { error } = await client.from('users').select('id').limit(1)
    if (error && error.message.includes('relation "users" does not exist')) {
      throw new Error('Database tables not found. Please ensure your Supabase database has the required schema.')
    }
    
    return client
  } catch (error: any) {
    console.error('Supabase connection error:', error.message)
    throw new Error(`Failed to connect to Supabase: ${error.message}`)
  }
}

// Database schema validation
export async function validateDatabaseSchema() {
  try {
    const supabase = await createServerClient()
    
    const requiredTables = ['users', 'revenue', 'events', 'performance_metrics']
    const results = await Promise.allSettled([
      supabase.from('users').select('id').limit(1),
      supabase.from('revenue').select('id').limit(1),
      supabase.from('events').select('id').limit(1),
      supabase.from('performance_metrics').select('id').limit(1)
    ])
    
    const missingTables = requiredTables.filter((table, index) => {
      const result = results[index]
      return result.status === 'rejected' || 
             (result.status === 'fulfilled' && result.value.error?.message.includes('does not exist'))
    })
    
    if (missingTables.length > 0) {
      return {
        valid: false,
        missingTables,
        message: `Missing required tables: ${missingTables.join(', ')}`
      }
    }
    
    return { valid: true, message: 'Database schema is valid' }
  } catch (error: any) {
    return {
      valid: false,
      message: `Schema validation failed: ${error.message}`
    }
  }
}