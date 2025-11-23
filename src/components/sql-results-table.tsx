"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  AlertCircle, 
  CheckCircle, 
  Copy, 
  Download, 
  RefreshCw, 
  Database,
  Lightbulb,
  ExternalLink
} from "lucide-react"
import { useState } from "react"

interface SQLResultsTableProps {
  data?: any[]
  error?: string
  details?: string
  hint?: string
  suggestions?: string[]
  error_type?: string
  query?: string
  execution_method?: string
  converted_query?: string
  row_count?: number
  loading?: boolean
  onRetry?: () => void
  note?: string
}

function getErrorTypeColor(errorType: string) {
  switch (errorType) {
    case 'syntax_error':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'table_not_found':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    case 'column_not_found':
      return 'bg-orange-50 text-orange-700 border-orange-200'
    case 'permission_error':
      return 'bg-purple-50 text-purple-700 border-purple-200'
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

function formatErrorType(errorType: string) {
  switch (errorType) {
    case 'syntax_error':
      return 'Syntax Error'
    case 'table_not_found':
      return 'Table Not Found'
    case 'column_not_found':
      return 'Column Not Found'
    case 'permission_error':
      return 'Permission Error'
    default:
      return 'Database Error'
  }
}

export function SQLResultsTable({
  data,
  error,
  details,
  hint,
  suggestions = [],
  error_type,
  query,
  execution_method,
  converted_query,
  row_count,
  loading,
  onRetry,
  note
}: SQLResultsTableProps) {
  const [copiedQuery, setCopiedQuery] = useState(false)

  const handleCopyQuery = () => {
    if (query) {
      navigator.clipboard.writeText(query)
      setCopiedQuery(true)
      setTimeout(() => setCopiedQuery(false), 2000)
    }
  }

  const exportToCSV = () => {
    if (!data || data.length === 0) return

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'query-results.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Executing query...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Query Execution Failed</CardTitle>
            {error_type && (
              <Badge variant="outline" className={getErrorTypeColor(error_type)}>
                {formatErrorType(error_type)}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error Message */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">Error Details:</div>
              <div className="text-sm font-mono bg-muted p-2 rounded">
                {error}
              </div>
              {details && (
                <div className="text-sm text-muted-foreground mt-2">
                  {details}
                </div>
              )}
            </AlertDescription>
          </Alert>

          {/* Query Display */}
          {query && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">Query:</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCopyQuery}
                  className="h-6 px-2"
                >
                  {copiedQuery ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedQuery ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <div className="text-sm font-mono bg-muted p-3 rounded border">
                {query}
              </div>
            </div>
          )}

          {/* AI Suggestions */}
          {suggestions.length > 0 && (
            <div className="border rounded-lg p-4 bg-blue-50/50">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">AI Suggestions</span>
              </div>
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm text-blue-800">{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hint */}
          {hint && (
            <div className="text-sm text-muted-foreground italic border-l-4 border-blue-200 pl-4">
              💡 {hint}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {onRetry && (
              <Button variant="outline" onClick={onRetry} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => window.open('https://www.postgresql.org/docs/current/sql-select.html', '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              PostgreSQL Docs
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Database className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <CardTitle className="text-muted-foreground mb-2">No Results</CardTitle>
          <CardDescription>
            The query executed successfully but returned no data.
          </CardDescription>
          {execution_method && (
            <Badge variant="outline" className="mt-3">
              Executed via {execution_method.replace('_', ' ')}
            </Badge>
          )}
        </CardContent>
      </Card>
    )
  }

  const columns = Object.keys(data[0])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Query Results
            </CardTitle>
            <CardDescription>
              {row_count || data.length} rows returned
              {execution_method && (
                <span className="ml-2">
                  • Executed via {execution_method.replace('_', ' ')}
                </span>
              )}
              {note && (
                <div className="text-blue-600 mt-1">
                  💡 {note}
                </div>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {query && (
              <Button variant="ghost" size="sm" onClick={handleCopyQuery}>
                {copiedQuery ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedQuery ? 'Copied' : 'Copy Query'}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-96 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  {columns.map((column) => (
                    <TableHead key={column} className="whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {column}
                        <Badge variant="secondary" className="text-xs">
                          {typeof data[0][column] === 'number' ? 'num' : 
                           data[0][column] instanceof Date ? 'date' : 'text'}
                        </Badge>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={index} className={index % 2 === 0 ? 'bg-muted/30' : ''}>
                    <TableCell className="text-center text-xs text-muted-foreground font-mono">
                      {index + 1}
                    </TableCell>
                    {columns.map((column) => (
                      <TableCell key={column} className="max-w-[200px]">
                        <div className="truncate" title={String(row[column])}>
                          {row[column] === null ? (
                            <span className="text-muted-foreground italic">null</span>
                          ) : typeof row[column] === 'boolean' ? (
                            <Badge variant={row[column] ? 'default' : 'secondary'}>
                              {String(row[column])}
                            </Badge>
                          ) : typeof row[column] === 'number' ? (
                            <span className="font-mono">{row[column].toLocaleString()}</span>
                          ) : (
                            String(row[column])
                          )}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        
        {data.length >= 1000 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Large result set detected. Consider adding LIMIT clause for better performance.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}