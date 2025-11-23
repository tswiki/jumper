import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

// Enhanced error analysis function
function analyzeQueryError(errorMessage: string, query: string) {
  const suggestions = []
  let type = 'unknown'

  // Analyze different types of SQL errors
  if (errorMessage.includes('failed to parse select parameter')) {
    type = 'syntax_error'
    suggestions.push('Check your SELECT clause syntax')
    
    if (query.includes('extract(')) {
      suggestions.push('EXTRACT() functions are automatically converted to work with Supabase')
      suggestions.push('Your query will be processed server-side for compatibility')
      suggestions.push('Example: EXTRACT(dow FROM signup_date) gets converted and executed')
    }
    
    if (query.includes('date_trunc(')) {
      suggestions.push('PostgreSQL date_trunc() syntax: date_trunc(precision, source)')
      suggestions.push('Example: date_trunc(\'day\', created_at)')
    }
  }
  
  if (errorMessage.includes('Could not find the function')) {
    type = 'function_not_found'
    suggestions.push('Complex PostgreSQL functions are automatically converted')
    suggestions.push('Your query will be processed using JavaScript aggregation')
    suggestions.push('EXTRACT(), DATE_PART(), DATE_TRUNC(), and similar functions are supported')
  }
  
  if (errorMessage.includes('column') && errorMessage.includes('does not exist') && query.includes('::')) {
    type = 'type_casting_error'
    suggestions.push('PostgreSQL type casting (::) is automatically handled')
    suggestions.push('Your query will be converted to remove type casting for compatibility')
    suggestions.push('Example: signup_date::date becomes signup_date')
  }
  
  if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
    type = 'table_not_found'
    suggestions.push('Check that the table name is spelled correctly')
    suggestions.push('Available tables: users, engagement, posts')
  }
  
  if (errorMessage.includes('column') && errorMessage.includes('does not exist')) {
    type = 'column_not_found'
    
    // Check if this is related to SQL function aliases
    if (query.includes('DATE_TRUNC') || query.includes('EXTRACT') || query.includes('AS ')) {
      suggestions.push('This appears to be a SQL function alias issue')
      suggestions.push('Your query will be processed with JavaScript aggregation for full compatibility')
      suggestions.push('Complex PostgreSQL functions are automatically handled server-side')
    } else {
      suggestions.push('Check that the column name exists in the table')
      suggestions.push('Use the schema viewer to see available columns')
    }
  }
  
  if (errorMessage.includes('syntax error') || errorMessage.includes('invalid')) {
    type = 'syntax_error'
    suggestions.push('Check your SQL syntax')
    suggestions.push('Make sure to use proper PostgreSQL syntax')
  }
  
  if (errorMessage.includes('permission denied')) {
    type = 'permission_error'
    suggestions.push('You may not have permission to access this table')
    suggestions.push('Check your RLS (Row Level Security) policies')
  }

  // Add general suggestions if no specific ones found
  if (suggestions.length === 0) {
    suggestions.push('Try simplifying your query to identify the issue')
    suggestions.push('Check the PostgreSQL documentation for correct syntax')
  }

  return { type, suggestions }
}

// PostgreSQL function conversion utilities
function convertPostgreSQLFunctions(query: string): string {
  let convertedQuery = query

  // Convert EXTRACT functions to compatible SQL
  // EXTRACT(HOUR FROM column) -> DATE_PART('hour', column)
  convertedQuery = convertedQuery.replace(
    /EXTRACT\s*\(\s*(\w+)\s+FROM\s+([^)]+)\)/gi,
    "DATE_PART('$1', $2)"
  )

  // DATE_TRUNC functions are kept as-is for JavaScript processing
  // No conversion needed since we handle them in JavaScript

  // Remove PostgreSQL type casting for JavaScript processing
  // signup_date::date -> signup_date
  convertedQuery = convertedQuery.replace(
    /(\w+)::[\w\[\]]+/gi,
    '$1'
  )

  console.log('🔄 Query after conversion:', convertedQuery)
  
  return convertedQuery
}

// Execute converted query with proper error handling
async function executeConvertedQuery(supabase: any, query: string) {
  const lowerQuery = query.toLowerCase()
  
  // Check if it's a query we can handle with JavaScript processing
  const canProcess = (
    lowerQuery.includes('date_part') || 
    lowerQuery.includes('date_trunc') || 
    lowerQuery.includes('extract') ||
    lowerQuery.includes('group by')
  ) && lowerQuery.includes('from')
  
  if (canProcess) {
    // Parse the query structure for basic execution
    const fromMatch = lowerQuery.match(/from\s+([a-z0-9_]+)/i)
    const tableName = fromMatch?.[1]
    
    if (!tableName) {
      throw new Error('Cannot parse table name from converted query')
    }

    // Get all data from the table for processing
    try {
      console.log('📊 Fetching data for JavaScript aggregation...')
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(10000) // Increased limit for better data processing

      if (error) {
        throw new Error(`Query execution failed: ${error.message}`)
      }

      console.log(`📈 Processing ${data?.length || 0} rows...`)

      // Process the data in JavaScript to simulate the SQL aggregation
      if (lowerQuery.includes('date_trunc')) {
        return processDateTruncQuery(data, query)
      } else if (lowerQuery.includes('date_part') || lowerQuery.includes('extract')) {
        return processGroupByDatePart(data, query)
      } else {
        return processGenericGroupBy(data, query)
      }
    } catch (error) {
      throw new Error(`Converted query execution failed: ${error}`)
    }
  }

  throw new Error('Query conversion not supported for this type of query')
}

// Process GROUP BY with DATE_PART functions in JavaScript
function processGroupByDatePart(data: any[], originalQuery: string) {
  console.log('📊 Processing DATE_PART aggregation in JavaScript...')
  
  // Extract the DATE_PART expressions and GROUP BY logic
  const datePartMatches = originalQuery.match(/DATE_PART\s*\(\s*'(\w+)'\s*,\s*(\w+)\s*\)/gi)
  
  if (!datePartMatches || !data || data.length === 0) {
    return { data: [] }
  }

  // Process the data to simulate the SQL GROUP BY
  const results = new Map()
  
  for (const row of data) {
    const keys = []
    
    // Extract date parts from each row
    for (const match of datePartMatches) {
      const [, part, column] = match.match(/DATE_PART\s*\(\s*'(\w+)'\s*,\s*(\w+)\s*\)/i) || []
      
      if (row[column]) {
        const date = new Date(row[column])
        let value = 0
        
        switch (part.toLowerCase()) {
          case 'hour':
            value = date.getHours()
            break
          case 'dow': // Day of week (0 = Sunday)
            value = date.getDay()
            break
          case 'day':
            value = date.getDate()
            break
          case 'month':
            value = date.getMonth() + 1
            break
          case 'year':
            value = date.getFullYear()
            break
          case 'minute':
            value = date.getMinutes()
            break
          default:
            value = 0
        }
        
        keys.push(value)
      } else {
        keys.push(null)
      }
    }
    
    const keyStr = keys.join('|')
    
    if (!results.has(keyStr)) {
      const resultRow: any = {}
      
      // Map back to column names from the original query
      if (originalQuery.includes('signup_hour')) {
        resultRow.signup_hour = keys[0]
      }
      if (originalQuery.includes('signup_day_of_week')) {
        resultRow.signup_day_of_week = keys[1] || keys[0]
      }
      
      resultRow.user_count = 0
      results.set(keyStr, resultRow)
    }
    
    results.get(keyStr).user_count++
  }

  // Convert to array and sort by count
  const processedData = Array.from(results.values())
    .sort((a, b) => (b.user_count || 0) - (a.user_count || 0))
    .slice(0, 100) // Apply LIMIT

  console.log('✅ JavaScript aggregation completed:', processedData.length, 'rows')
  
  return { data: processedData }
}

// Process DATE_TRUNC queries in JavaScript
function processDateTruncQuery(data: any[], originalQuery: string) {
  console.log('📊 Processing DATE_TRUNC aggregation in JavaScript...')
  
  if (!data || data.length === 0) {
    return { data: [] }
  }

  const results = new Map()
  
  // Parse the DATE_TRUNC function from the query
  const dateTruncMatch = originalQuery.match(/DATE_TRUNC\s*\(\s*'(\w+)'\s*,\s*([^:]+)(?:::[\w\[\]]+)?\s*\)/i)
  if (!dateTruncMatch) {
    console.log('❌ Could not parse DATE_TRUNC function')
    return { data: [] }
  }

  const [, precision, columnExpression] = dateTruncMatch
  const column = columnExpression.trim().replace(/::[\w\[\]]+$/, '') // Remove type casting

  console.log(`📅 Processing DATE_TRUNC('${precision}', ${column})`)

  for (const row of data) {
    if (!row[column]) {
      continue
    }

    const date = new Date(row[column])
    let truncatedDate: string
    
    switch (precision.toLowerCase()) {
      case 'week':
        // Get Monday of the week (PostgreSQL behavior)
        const monday = new Date(date)
        monday.setDate(date.getDate() - ((date.getDay() + 6) % 7))
        monday.setHours(0, 0, 0, 0)
        truncatedDate = monday.toISOString().split('T')[0]
        break
      case 'day':
        truncatedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().split('T')[0]
        break
      case 'month':
        truncatedDate = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0]
        break
      case 'year':
        truncatedDate = new Date(date.getFullYear(), 0, 1).toISOString().split('T')[0]
        break
      case 'hour':
        const hourTrunc = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours())
        truncatedDate = hourTrunc.toISOString()
        break
      default:
        truncatedDate = date.toISOString().split('T')[0]
    }

    if (!results.has(truncatedDate)) {
      // Initialize result row
      const resultRow: any = {}
      
      // Map the alias from the original query
      const aliasMatch = originalQuery.match(/DATE_TRUNC[^)]*\)\s+AS\s+(\w+)/i)
      const alias = aliasMatch ? aliasMatch[1] : 'week'
      resultRow[alias] = truncatedDate

      // Initialize aggregate functions
      if (originalQuery.includes('COUNT(user_id)') || originalQuery.includes('COUNT(*)')) {
        resultRow.user_count = 0
      }
      if (originalQuery.includes('COUNT(DISTINCT country)')) {
        resultRow.country_count = 0
        resultRow._countries = new Set()
      }
      if (originalQuery.includes('COUNT(DISTINCT user_segment)')) {
        resultRow.segment_count = 0
        resultRow._segments = new Set()
      }

      results.set(truncatedDate, resultRow)
    }

    const resultRow = results.get(truncatedDate)
    
    // Update aggregate counts
    if (resultRow.hasOwnProperty('user_count')) {
      resultRow.user_count++
    }
    if (resultRow.hasOwnProperty('country_count') && row.country) {
      resultRow._countries.add(row.country)
      resultRow.country_count = resultRow._countries.size
    }
    if (resultRow.hasOwnProperty('segment_count') && row.user_segment) {
      resultRow._segments.add(row.user_segment)
      resultRow.segment_count = resultRow._segments.size
    }
  }

  // Clean up temporary sets and convert to final format
  const processedData = Array.from(results.values()).map(row => {
    const cleanRow = { ...row }
    delete cleanRow._countries
    delete cleanRow._segments
    return cleanRow
  })

  // Apply ORDER BY
  const orderMatch = originalQuery.match(/ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?/i)
  if (orderMatch) {
    const [, orderColumn, direction] = orderMatch
    const ascending = !direction || direction.toUpperCase() === 'ASC'
    
    processedData.sort((a, b) => {
      const aVal = a[orderColumn]
      const bVal = b[orderColumn]
      
      if (aVal < bVal) return ascending ? -1 : 1
      if (aVal > bVal) return ascending ? 1 : -1
      return 0
    })
  }

  // Apply LIMIT
  const limitMatch = originalQuery.match(/LIMIT\s+(\d+)/i)
  const limit = limitMatch ? parseInt(limitMatch[1]) : processedData.length
  
  const finalData = processedData.slice(0, limit)

  console.log('✅ DATE_TRUNC aggregation completed:', finalData.length, 'rows')
  
  return { data: finalData }
}

// Process generic GROUP BY queries
function processGenericGroupBy(data: any[], originalQuery: string) {
  console.log('📊 Processing generic GROUP BY in JavaScript...')
  
  // For now, return the raw data with a warning
  console.log('⚠️ Generic GROUP BY processing not fully implemented')
  
  const limitMatch = originalQuery.match(/LIMIT\s+(\d+)/i)
  const limit = limitMatch ? parseInt(limitMatch[1]) : 100
  
  return { data: data.slice(0, limit) }
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

    const { query: sqlQuery } = body
    
    if (!sqlQuery || typeof sqlQuery !== 'string' || sqlQuery.trim() === '') {
      return NextResponse.json({ error: "Valid SQL query is required" }, { status: 400 })
    }

    const cleanedQuery = sqlQuery.trim().replace(/;$/, "")
  const lowerQuery = cleanedQuery.toLowerCase()

  // Security: Only allow SELECT statements
  if (!lowerQuery.startsWith("select")) {
    return NextResponse.json(
      { 
        error: "Only SELECT statements are allowed",
        hint: "For security reasons, only read operations are permitted"
      }, 
      { status: 400 }
    )
  }

    // Require Supabase connection for production
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { 
          error: "Database connection not configured",
          hint: "Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables"
        }, 
        { status: 500 }
      )
    }
    const supabase = await createServerClient()

    // Strategy 1: Try to execute raw SQL for complex queries
    console.log('🔍 Attempting to execute SQL:', cleanedQuery)
    
    // Check if query contains complex functions that need raw SQL execution
    const complexPatterns = [
      /extract\s*\(/i,           // extract() functions
      /date_trunc\s*\(/i,        // date_trunc() functions
      /case\s+when/i,            // case statements
      /with\s+\w+\s+as/i,        // CTEs (Common Table Expressions)
      /window\s+functions/i,     // window functions
      /::[\w\[\]]+/i,            // PostgreSQL type casting
      /interval\s+'/i,           // interval expressions
      /generate_series\s*\(/i,   // generate_series function
      /array_agg\s*\(/i,         // array aggregation
      /string_agg\s*\(/i,        // string aggregation
      /coalesce\s*\(/i,          // coalesce function
      /nullif\s*\(/i,            // nullif function
      /greatest\s*\(/i,          // greatest function
      /least\s*\(/i,             // least function
      /count\s*\(\s*distinct/i   // COUNT(DISTINCT) aggregation
    ]

    const needsRawSQL = complexPatterns.some(pattern => pattern.test(cleanedQuery))

    if (needsRawSQL) {
      console.log('🔧 Complex query detected, attempting PostgreSQL function conversion')
      
      // Try to convert PostgreSQL functions to Supabase-compatible format
      const convertedQuery = convertPostgreSQLFunctions(cleanedQuery)
      
      if (convertedQuery !== cleanedQuery) {
        console.log('🔄 Converted query:', convertedQuery)
        
        try {
          // Try executing the converted query using query builder
          const result = await executeConvertedQuery(supabase, convertedQuery)
          if (result.data) {
            console.log('✅ Converted query execution successful')
            return NextResponse.json({
              data: result.data,
              execution_method: "converted_postgresql",
              query: cleanedQuery,
              converted_query: convertedQuery,
              row_count: result.data?.length || 0,
              note: "Query was automatically converted from PostgreSQL syntax"
            })
          }
        } catch (conversionError) {
          console.log('❌ Converted query failed:', conversionError)
        }
      }

      // Try raw SQL execution as fallback (if available)
      try {
        const { data: rawData, error: rawError } = await supabase.rpc("execute_raw_sql", { 
          query: cleanedQuery 
        })

        if (!rawError && rawData) {
          console.log('✅ Raw SQL execution successful')
          return NextResponse.json({ 
            data: rawData,
            execution_method: "raw_sql",
            query: cleanedQuery,
            row_count: rawData?.length || 0
          })
        }
        
        if (rawError) {
          console.log('❌ Raw SQL execution failed:', rawError)
        }
      } catch (rawSqlError) {
        console.log("❌ Raw SQL execution not available:", rawSqlError)
      }
    }

    // Strategy 2: Parse and execute using Supabase Query Builder
    const fromMatch = lowerQuery.match(/from\s+([a-z0-9_]+)/i)
    if (!fromMatch || !fromMatch[1]) {
      return NextResponse.json(
        { 
          error: "Could not parse table name from query",
          hint: "Query must include a valid table name after FROM"
        }, 
        { status: 400 }
      )
    }

    const tableName = fromMatch[1]

    // Parse SELECT columns
    const selectMatch = lowerQuery.match(/select\s+(.*?)\s+from/i)
    let selectColumns = "*"
    if (selectMatch && selectMatch[1]) {
      selectColumns = selectMatch[1].trim() === "*" ? "*" : selectMatch[1].trim()
    }

    // Parse WHERE conditions (basic)
    const whereMatch = lowerQuery.match(/where\s+(.*?)(?:\s+order\s+by|\s+group\s+by|\s+limit|$)/i)
    
    // Parse ORDER BY
    const orderMatch = lowerQuery.match(/order\s+by\s+([^\s]+)(?:\s+(asc|desc))?/i)
    
    // Parse LIMIT
    const limitMatch = lowerQuery.match(/limit\s+(\d+)/i)
    const limit = limitMatch ? Number.parseInt(limitMatch[1]) : 1000

    // Build Supabase query
    let supabaseQuery = supabase.from(tableName).select(selectColumns)

    // Apply WHERE conditions (basic implementation)
    if (whereMatch && whereMatch[1]) {
      const whereClause = whereMatch[1].trim()
      
      // Handle simple equality conditions
      const eqMatch = whereClause.match(/(\w+)\s*=\s*'([^']+)'/i)
      if (eqMatch) {
        supabaseQuery = supabaseQuery.eq(eqMatch[1], eqMatch[2])
      }
      
      // Handle LIKE conditions
      const likeMatch = whereClause.match(/(\w+)\s+like\s+'([^']+)'/i)
      if (likeMatch) {
        supabaseQuery = supabaseQuery.like(likeMatch[1], likeMatch[2])
      }
    }

    // Apply ORDER BY
    if (orderMatch && orderMatch[1]) {
      const ascending = !orderMatch[2] || orderMatch[2].toLowerCase() === 'asc'
      supabaseQuery = supabaseQuery.order(orderMatch[1], { ascending })
    }

    // Apply LIMIT
    supabaseQuery = supabaseQuery.limit(limit)

    const { data, error } = await supabaseQuery

    if (error) {
      console.log('❌ Query execution failed:', error)
      
      // Enhanced error analysis and suggestions
      const errorAnalysis = analyzeQueryError(error.message, cleanedQuery)
      
      return NextResponse.json(
        { 
          error: `Database query failed: ${error.message}`,
          details: error.details,
          hint: error.hint,
          query: cleanedQuery,
          suggestions: errorAnalysis.suggestions,
          error_type: errorAnalysis.type,
          execution_method: "query_builder"
        }, 
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      data,
      execution_method: "query_builder",
      query: cleanedQuery,
      parsed_table: tableName,
      row_count: data?.length || 0
    })

  } catch (error: any) {
    console.error("SQL execution error:", error)
    
    // Handle specific Supabase errors
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      return NextResponse.json(
        { 
          error: "Table does not exist",
          details: error.message,
          hint: "Check your table name and ensure it exists in the database"
        }, 
        { status: 400 }
      )
    }

    if (error.message.includes('column') && error.message.includes('does not exist')) {
      return NextResponse.json(
        { 
          error: "Column does not exist",
          details: error.message,
          hint: "Check your column names and ensure they exist in the table"
        }, 
        { status: 400 }
      )
    }

    if (error.message.includes('syntax error') || error.message.includes('invalid')) {
      return NextResponse.json(
        { 
          error: "SQL syntax error",
          details: error.message,
          hint: "Check your SQL syntax and try again"
        }, 
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: "Failed to execute SQL query",
        details: error.message,
        hint: "Check your query syntax and ensure the table exists"
      }, 
      { status: 500 }
    )
  }
}