"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Info, X, Brain, Target, Globe, Users } from "lucide-react"

interface Recommendation {
  type: 'warning' | 'success' | 'insight' | 'info'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low' | 'info'
  actionable: string
}

interface UserInsightsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recommendations: Recommendation[]
  insights: any
  metrics: any
}

function getRecommendationIcon(type: string) {
  switch (type) {
    case 'warning':
      return <AlertCircle className="h-4 w-4 text-amber-500" />
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'insight':
      return <Brain className="h-4 w-4 text-blue-500" />
    default:
      return <Info className="h-4 w-4 text-slate-500" />
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200'
    default:
      return 'bg-blue-100 text-blue-800 border-blue-200'
  }
}

export function UserInsightsDialog({ 
  open, 
  onOpenChange, 
  recommendations, 
  insights, 
  metrics 
}: UserInsightsDialogProps) {
  // Process insights data for display
  const topCountries = insights?.topEngagementCountry ? 
    Object.entries(insights.topEngagementCountry)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5) : []

  const userSegments = insights?.engagementByUserSegment ? 
    Object.entries(insights.engagementByUserSegment)
      .map(([segment, data]: [string, any]) => ({
        segment,
        count: data.count,
        engagement: data.engagement,
        avgEngagement: data.count > 0 ? (data.engagement / data.count).toFixed(2) : '0'
      }))
      .sort((a, b) => parseFloat(b.avgEngagement) - parseFloat(a.avgEngagement)) : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            User Insights & Data Analysis
          </DialogTitle>
          <DialogClose />
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Metrics Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-4 w-4" />
                Key Performance Indicators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{metrics?.totalUsers || 0}</div>
                  <div className="text-xs text-muted-foreground">Total Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{metrics?.totalEngagements || 0}</div>
                  <div className="text-xs text-muted-foreground">Total Engagements</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{metrics?.engagementRate || 0}%</div>
                  <div className="text-xs text-muted-foreground">Engagement Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{metrics?.avgEngagementPerUser || 0}</div>
                  <div className="text-xs text-muted-foreground">Avg. Engagement/User</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Geographic Insights */}
          {topCountries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Globe className="h-4 w-4" />
                  Geographic Performance
                </CardTitle>
                <CardDescription>
                  Top performing countries by engagement activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topCountries.map(([country, engagement], index) => (
                    <div key={country} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">#{index + 1}</span>
                        <span>{country}</span>
                      </div>
                      <Badge variant="outline">{engagement} engagements</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* User Segment Analysis */}
          {userSegments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-4 w-4" />
                  User Segment Performance
                </CardTitle>
                <CardDescription>
                  Engagement patterns across different user segments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userSegments.map((segment) => (
                    <div key={segment.segment} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{segment.segment}</span>
                        <Badge variant="secondary">{segment.count} users</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>Total Engagement: {segment.engagement}</div>
                        <div>Avg per User: {segment.avgEngagement}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="h-4 w-4" />
                AI-Powered Recommendations
              </CardTitle>
              <CardDescription>
                Data-driven insights and actionable recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recommendations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No specific recommendations at this time.</p>
                  <p className="text-sm">Continue monitoring your data for insights.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        {getRecommendationIcon(rec.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{rec.title}</h4>
                            <Badge 
                              variant="outline" 
                              className={getPriorityColor(rec.priority)}
                            >
                              {rec.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {rec.description}
                          </p>
                          <div className="bg-muted/50 rounded-md p-3">
                            <p className="text-sm font-medium mb-1">Recommended Action:</p>
                            <p className="text-sm">{rec.actionable}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={() => {
              // Export or share functionality could go here
              console.log('Exporting insights...')
            }}>
              Export Insights
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}