"use client"

import { useEffect, useState } from "react"
import { MetricsCards } from "@/components/metrics-cards"
import { TrendChart } from "@/components/trend-chart"
import { ScatterPlot } from "@/components/scatter-plot"
import { UserInsightsDialog } from "@/components/user-insights-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Brain, AlertCircle, CheckCircle } from "lucide-react"

interface DashboardData {
  metrics: any
  trends: any
  performance: any
  insights: any
  recommendations: any[]
  source: string
  data_freshness: any
}

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [insightsOpen, setInsightsOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('🔄 Fetching dashboard data...')
        const res = await fetch("/api/dashboard")
        const json = await res.json()
        
        if (res.ok) {
          console.log('✅ Dashboard data fetched successfully:', json)
          setData(json)
        } else {
          console.error('❌ Dashboard API error:', json)
          
          // Set a fallback data structure so the UI doesn't break
          setData({
            metrics: {
              totalUsers: 0,
              totalPosts: 0,
              totalEngagements: 0,
              engagementRate: 0,
              avgEngagementPerUser: 0
            },
            trends: [],
            performance: [],
            insights: {},
            recommendations: [{
              type: 'warning',
              title: 'Dashboard Data Error',
              description: json.error || 'Failed to load dashboard data',
              priority: 'high',
              actionable: json.hint || 'Check your database connection and ensure tables exist.'
            }],
            source: 'error',
            data_freshness: {
              users_count: 0,
              engagement_count: 0,
              posts_count: 0
            }
          })
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) return null

  // Get high priority recommendations count
  const highPriorityRecommendations = data.recommendations?.filter(r => r.priority === 'high').length || 0
  const hasRecommendations = data.recommendations?.length > 0

  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
            <p className="text-muted-foreground">
              Real-time insights from your engagement and user data
            </p>
          </div>
          <div className="flex items-center gap-3">
            {data.source === "supabase" && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Live Data
              </Badge>
            )}
            {data.source === "error" && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                <AlertCircle className="h-3 w-3 mr-1" />
                Data Error
              </Badge>
            )}
            {highPriorityRecommendations > 0 && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <AlertCircle className="h-3 w-3 mr-1" />
                {highPriorityRecommendations} Priority Alert{highPriorityRecommendations > 1 ? 's' : ''}
              </Badge>
            )}
            <Button onClick={() => setInsightsOpen(true)} className="gap-2">
              <Brain className="h-4 w-4" />
              View Insights
              {hasRecommendations && (
                <Badge variant="secondary" className="ml-1">
                  {data.recommendations.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Data Freshness Info */}
        {data.data_freshness && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="text-sm">
              <div className="font-medium text-blue-600">{data.data_freshness.users_count}</div>
              <div className="text-xs text-muted-foreground">Users</div>
            </div>
            <div className="text-sm">
              <div className="font-medium text-green-600">{data.data_freshness.engagement_count}</div>
              <div className="text-xs text-muted-foreground">Engagements</div>
            </div>
            <div className="text-sm">
              <div className="font-medium text-purple-600">{data.data_freshness.posts_count}</div>
              <div className="text-xs text-muted-foreground">Posts</div>
            </div>
            <div className="text-sm">
              <div className="font-medium text-orange-600">{data.recommendations?.length || 0}</div>
              <div className="text-xs text-muted-foreground">Insights</div>
            </div>
          </div>
        )}

        <MetricsCards data={data.metrics} />
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4">
            <TrendChart data={data.trends} />
          </div>
          <div className="col-span-3">
            <ScatterPlot data={data.performance} />
          </div>
        </div>
      </div>

      <UserInsightsDialog 
        open={insightsOpen}
        onOpenChange={setInsightsOpen}
        recommendations={data.recommendations || []}
        insights={data.insights || {}}
        metrics={data.metrics || {}}
      />
    </>
  )
}
