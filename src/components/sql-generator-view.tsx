"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Sparkles, Copy, Check, Play, Database, AlertCircle, Wifi } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SQLResultsTable } from "@/components/sql-results-table"

interface DatabaseSchema {
  project_id: string
  project_url: string
  schema: Array<{
    table_name: string
    columns: Array<{
      column_name: string
      data_type: string
      is_nullable: string
    }>
  }>
  source: string
}

export function SqlGeneratorView() {
  const [prompt, setPrompt] = useState("")
  const [sql, setSql] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [result, setResult] = useState<any[] | null>(null)
  const [copied, setCopied] = useState(false)
  const [isEditingSql, setIsEditingSql] = useState(false)
  const [activeTab, setActiveTab] = useState("code")
  const [schema, setSchema] = useState<DatabaseSchema | null>(null)
  const [schemaError, setSchemaError] = useState<string | null>(null)
  const [executionError, setExecutionError] = useState<any>(null)
  const [executionInfo, setExecutionInfo] = useState<any>(null)

  // Fetch database schema on component mount
  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const response = await fetch('/api/schema')
        const data = await response.json()
        
        if (response.ok) {
          setSchema(data)
          setSchemaError(null)
        } else {
          setSchemaError(data.error || 'Failed to fetch database schema')
        }
      } catch (error) {
        setSchemaError('Failed to connect to database')
      }
    }

    fetchSchema()
  }, [])

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    try {
      const res = await fetch("/api/generate-sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (data.sql) {
        setSql(data.sql)
        setResult(null) // Clear previous results when new SQL is generated
        setIsEditingSql(false)
      }
    } catch (error) {
      console.error("Failed to generate SQL:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExecute = async () => {
    if (!sql.trim()) return

    setIsExecuting(true)
    setExecutionError(null)
    setResult(null)
    
    try {
      const res = await fetch("/api/execute-sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: sql }),
      })
      const data = await res.json()
      
      if (res.ok && data.data) {
        setResult(data.data)
        setExecutionError(null)
        setExecutionInfo({
          execution_method: data.execution_method,
          converted_query: data.converted_query,
          note: data.note
        })
        setActiveTab("results")
      } else {
        setExecutionError({
          error: data.error || 'Query execution failed',
          details: data.details,
          hint: data.hint,
          suggestions: data.suggestions || [],
          error_type: data.error_type,
          query: data.query,
          execution_method: data.execution_method
        })
        setResult(null)
        setActiveTab("results")
      }
    } catch (error) {
      setExecutionError({
        error: "Failed to execute SQL query",
        details: "Network or connection error occurred",
        suggestions: ["Check your internet connection", "Try again in a moment"]
      })
      setResult(null)
      setActiveTab("results")
      console.error("Failed to execute SQL:", error)
    } finally {
      setIsExecuting(false)
    }
  }

  const handleCopy = () => {
    if (!sql) return
    navigator.clipboard.writeText(sql)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-12rem)]">
      {/* Left Panel: Input & Context */}
      <div className="lg:col-span-4 flex flex-col gap-6 h-full">
        <Card className="flex flex-col h-1/2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Query Generator
            </CardTitle>
            <CardDescription>Describe what data you need in plain English.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            <Textarea
              className="flex-1 resize-none text-base p-4"
              placeholder="e.g. Show me all active users who signed up last month..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-muted"
                onClick={() => setPrompt("List all users sorted by creation date")}
              >
                All Users
              </Badge>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-muted"
                onClick={() => setPrompt("Total revenue by source for 2024")}
              >
                Revenue
              </Badge>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-muted"
                onClick={() => setPrompt("Count of active users by role")}
              >
                User Roles
              </Badge>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleGenerate} disabled={!prompt.trim() || isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate SQL"
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database Schema
              {schema && (
                <Badge variant="outline" className="text-xs">
                  <Wifi className="h-3 w-3 mr-1" />
                  {schema.project_id}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto text-sm text-muted-foreground">
            {schemaError ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {schemaError}
                </AlertDescription>
              </Alert>
            ) : schema ? (
              <div className="space-y-4">
                <div className="pb-2 border-b">
                  <p className="text-xs text-muted-foreground">
                    Project: <span className="font-mono">{schema.project_id}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tables: {schema.schema.length} • Source: {schema.source}
                  </p>
                </div>
                
                {schema.schema.map((table) => (
                  <div key={table.table_name}>
                    <p className="font-semibold text-foreground mb-1">{table.table_name}</p>
                    <p className="text-xs">
                      {table.columns.map(col => col.column_name).join(', ')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {table.columns.length} columns
                    </p>
                  </div>
                ))}
                
                {schema.schema.length === 0 && (
                  <div className="text-center py-4">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No tables found in database</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                <p className="text-xs">Loading database schema...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Panel: SQL & Results */}
      <Card className="lg:col-span-8 flex flex-col h-full overflow-hidden bg-muted/30">
        <CardHeader className="border-b bg-background py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[200px]">
                <TabsList className="grid w-full grid-cols-2 h-8">
                  <TabsTrigger value="code" className="text-xs">
                    SQL Editor
                  </TabsTrigger>
                  <TabsTrigger value="results" disabled={!result && !executionError} className="text-xs">
                    {executionError ? 'Error' : 'Results'}
                    {executionError && (
                      <Badge variant="destructive" className="ml-1 text-xs">
                        !
                      </Badge>
                    )}
                    {result && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {result.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!sql}>
                {copied ? <Check className="h-4 w-4 text-green-500 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                Copy
              </Button>
              <Button size="sm" onClick={handleExecute} disabled={!sql || isExecuting}>
                {isExecuting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                Run Query
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 flex flex-col overflow-hidden relative">
          {/* SQL Editor Area */}
          <div className={`flex-1 flex flex-col ${result ? "h-1/3 border-b" : "h-full"}`}>
            <div className="relative h-full group">
              <Textarea
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                className="h-full w-full resize-none rounded-none border-0 p-4 font-mono text-sm bg-slate-950 text-slate-50 focus-visible:ring-0"
                placeholder="Generated SQL will appear here..."
                spellCheck={false}
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Badge variant="secondary" className="text-xs bg-slate-800 text-slate-400 pointer-events-none">
                  Editable
                </Badge>
              </div>
            </div>
          </div>

          {/* Enhanced Results Area */}
          {(result || executionError) && (
            <div className="flex-1 bg-background overflow-auto p-4 animate-in slide-in-from-bottom-2">
              <SQLResultsTable 
                data={result}
                error={executionError?.error}
                details={executionError?.details}
                hint={executionError?.hint}
                suggestions={executionError?.suggestions}
                error_type={executionError?.error_type}
                query={sql}
                execution_method={executionInfo?.execution_method || executionError?.execution_method}
                converted_query={executionInfo?.converted_query || executionError?.converted_query}
                row_count={result?.length}
                loading={isExecuting}
                onRetry={handleExecute}
                note={executionInfo?.note || executionError?.note}
              />
            </div>
          )}

          {!result && !sql && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground pointer-events-none">
              <Sparkles className="h-12 w-12 mb-4 opacity-20" />
              <p>Enter a prompt to generate SQL</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
