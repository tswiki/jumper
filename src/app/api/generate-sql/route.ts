import { NextResponse } from "next/server"
import OpenAI from "openai"
import { createServerClient } from "@/lib/supabase"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Function to fetch real database schema using simplified approach
async function fetchDatabaseSchema() {
  try {
    const supabase = await createServerClient()
    
    // Get project information
    const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const projectId = projectUrl?.split('//')[1]?.split('.')[0] || 'unknown'
    
    // Try to detect tables by querying them directly (more reliable than information_schema)
    const knownTables = ['users', 'revenue', 'events', 'performance_metrics']
    const schema = []
    
    for (const tableName of knownTables) {
      try {
        // Try to get one row to see if table exists and get column info
        const { data: sampleRow, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)

        if (!error && sampleRow !== null) {
          // Table exists, get column information
          const columns = sampleRow.length > 0 
            ? Object.keys(sampleRow[0]).map(col => ({
                column_name: col,
                data_type: typeof sampleRow[0][col] === 'number' ? 'numeric' : 
                           sampleRow[0][col] instanceof Date ? 'timestamp' : 'text',
                is_nullable: 'YES'
              }))
            : [{ column_name: 'id', data_type: 'text', is_nullable: 'NO' }] // Default if empty

          schema.push({
            table_name: tableName,
            columns: columns
          })
        }
      } catch (tableError) {
        console.log(`Table ${tableName} not accessible:`, tableError)
        // Skip this table
      }
    }

    if (schema.length === 0) {
      throw new Error('No accessible tables found in database')
    }

    return { project_id: projectId, schema }

  } catch (error: any) {
    console.error('Schema fetch error:', error)
    // Return a basic fallback schema
    return {
      project_id: 'unknown',
      schema: [{
        table_name: 'users',
        columns: [
          { column_name: 'id', data_type: 'text', is_nullable: 'NO' },
          { column_name: 'name', data_type: 'text', is_nullable: 'YES' },
          { column_name: 'email', data_type: 'text', is_nullable: 'YES' }
        ]
      }]
    }
  }
}

export async function POST(req: Request) {
  try {
    // Parse request body with error handling
    let body
    try {
      body = await req.json()
    } catch (parseError) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { prompt } = body

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return NextResponse.json({ error: "Valid prompt is required" }, { status: 400 })
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          error: "OpenAI API key not configured",
          hint: "Add OPENAI_API_KEY to your environment variables"
        }, 
        { status: 500 }
      )
    }

    // Fetch the real database schema
    const databaseInfo = await fetchDatabaseSchema()
    console.log('📊 Database schema fetched:', JSON.stringify(databaseInfo, null, 2))
    
    if (!databaseInfo.schema || databaseInfo.schema.length === 0) {
      console.log('❌ No database schema available')
      return NextResponse.json(
        { 
          error: "No database schema available",
          hint: "Check your database connection and ensure tables exist"
        }, 
        { status: 503 }
      )
    }
    
    // Build schema description for AI
    const schemaDescription = databaseInfo.schema.map(table => {
      const columns = table.columns.map(col => 
        `${col.column_name} (${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''})`
      ).join(', ')
      return `- ${table.table_name}: ${columns}`
    }).join('\n')
    
    console.log('📝 Schema description for AI:\n', schemaDescription)

    const systemPrompt = `You are a SQL expert. Generate clean, efficient SQL queries based on user prompts.

Database Schema (Project: ${databaseInfo.project_id}):
${schemaDescription}

CRITICAL RULES:
1. ALWAYS generate a valid SQL SELECT query, never explanations or comments
2. If the requested data doesn't exist in the schema, create a query using the closest available data
3. Use proper PostgreSQL syntax
4. Include appropriate LIMIT clauses for large datasets (default 100)
5. Use meaningful column aliases when needed
6. Ensure queries are safe and don't modify data (SELECT only)
7. ONLY use column names that exist in the schema above
8. If no relevant data exists, generate a simple SELECT query showing available data

IMPORTANT: Your response must ONLY contain the SQL query, starting with SELECT. No explanations, no comments, just the query.

User Request: ${prompt}`

    console.log('💭 User prompt:', prompt)
    console.log('🤖 System prompt sent to OpenAI:\n', systemPrompt)

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.1, // Low temperature for consistent SQL generation
    })

    console.log('🔮 OpenAI response:', JSON.stringify(completion, null, 2))

    const generatedSql = completion.choices[0]?.message?.content?.trim()

    if (!generatedSql) {
      console.log('❌ No SQL generated from OpenAI')
      throw new Error("Failed to generate SQL from OpenAI")
    }

    console.log('✨ Generated SQL:', generatedSql)

    // Basic validation to ensure it's a SELECT query
    if (!generatedSql.toLowerCase().trim().startsWith('select')) {
      console.log('🚫 Generated query is not a SELECT statement:', generatedSql)
      
      // Create a fallback query based on available schema
      const fallbackSql = `SELECT * FROM ${databaseInfo.schema[0]?.table_name || 'users'} LIMIT 10`
      console.log('🔄 Using fallback query:', fallbackSql)
      
      const fallbackResponse = {
        sql: fallbackSql,
        prompt: prompt,
        model: "gpt-4",
        schema_used: databaseInfo.project_id,
        note: "Generated fallback query - AI response was not a valid SELECT statement",
        original_ai_response: generatedSql
      }

      console.log('✅ Fallback response:', JSON.stringify(fallbackResponse, null, 2))
      return NextResponse.json(fallbackResponse)
    }

    const response = {
      sql: generatedSql,
      prompt: prompt,
      model: "gpt-4",
      schema_used: databaseInfo.project_id,
      note: "Generated using OpenAI GPT-4 with real database schema"
    }

    console.log('✅ Successful response:', JSON.stringify(response, null, 2))

    return NextResponse.json(response)

  } catch (error: any) {
    console.error("🔥 SQL generation error:", error.message)
    console.error("🔍 Full error details:", error)
    
    // Handle specific OpenAI errors
    if (error.code === 'insufficient_quota') {
      return NextResponse.json(
        { 
          error: "OpenAI quota exceeded",
          hint: "Please check your OpenAI billing and usage limits"
        }, 
        { status: 429 }
      )
    }

    if (error.code === 'invalid_api_key') {
      return NextResponse.json(
        { 
          error: "Invalid OpenAI API key",
          hint: "Please check your OPENAI_API_KEY environment variable"
        }, 
        { status: 401 }
      )
    }

    // Handle network/connection errors
    if (error.message.includes('network') || error.message.includes('timeout')) {
      return NextResponse.json(
        { 
          error: "Network error",
          hint: "Check your internet connection and try again"
        }, 
        { status: 503 }
      )
    }

    return NextResponse.json(
      { 
        error: "Failed to generate SQL",
        details: error.message 
      }, 
      { status: 500 }
    )
  }
}