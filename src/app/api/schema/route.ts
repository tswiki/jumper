import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  // Require Supabase connection
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json(
      { 
        error: "Database connection not configured",
        hint: "Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables"
      }, 
      { status: 500 }
    )
  }

  try {
    const supabase = await createServerClient()
    
    // Get project information
    const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const projectId = projectUrl?.split('//')[1]?.split('.')[0] || 'unknown'
    
    // Get table schema information
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name')

    if (tablesError) {
      // Fallback: try to detect tables by querying them individually
      const knownTables = ['users', 'revenue', 'events', 'performance_metrics']
      const tableResults = await Promise.allSettled(
        knownTables.map(async (tableName) => {
          const { error } = await supabase.from(tableName).select('*').limit(1)
          return { table_name: tableName, exists: !error }
        })
      )

      const availableTables = tableResults
        .filter(result => result.status === 'fulfilled' && result.value.exists)
        .map(result => ({ table_name: (result as any).value.table_name }))

      if (availableTables.length === 0) {
        return NextResponse.json(
          { 
            error: "No accessible tables found",
            hint: "Please ensure your database has tables and RLS policies allow access"
          }, 
          { status: 404 }
        )
      }

      // Get column information for available tables
      const schema = await Promise.all(
        availableTables.map(async (table) => {
          try {
            const { data: columns, error: columnsError } = await supabase
              .from('information_schema.columns')
              .select('column_name, data_type, is_nullable')
              .eq('table_schema', 'public')
              .eq('table_name', table.table_name)
              .order('ordinal_position')

            if (columnsError || !columns) {
              // Fallback: get first row to determine columns
              const { data: sampleRow } = await supabase
                .from(table.table_name)
                .select('*')
                .limit(1)

              const inferredColumns = sampleRow?.[0] 
                ? Object.keys(sampleRow[0]).map(col => ({
                    column_name: col,
                    data_type: typeof sampleRow[0][col] === 'number' ? 'numeric' : 'text',
                    is_nullable: 'YES'
                  }))
                : []

              return {
                table_name: table.table_name,
                columns: inferredColumns
              }
            }

            return {
              table_name: table.table_name,
              columns: columns
            }
          } catch (error) {
            return {
              table_name: table.table_name,
              columns: []
            }
          }
        })
      )

      return NextResponse.json({
        project_id: projectId,
        project_url: projectUrl,
        schema,
        source: "fallback_detection"
      })
    }

    // Get column information for each table
    const schema = await Promise.all(
      tables.map(async (table) => {
        const { data: columns, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable')
          .eq('table_schema', 'public')
          .eq('table_name', table.table_name)
          .order('ordinal_position')

        return {
          table_name: table.table_name,
          columns: columns || []
        }
      })
    )

    return NextResponse.json({
      project_id: projectId,
      project_url: projectUrl,
      schema: schema.filter(table => table.columns.length > 0),
      source: "information_schema"
    })

  } catch (error: any) {
    console.error('Schema API error:', error)
    
    return NextResponse.json(
      { 
        error: "Failed to fetch database schema",
        details: error.message,
        hint: "Check your database connection and permissions"
      }, 
      { status: 500 }
    )
  }
}