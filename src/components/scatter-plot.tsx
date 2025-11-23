"use client"

import { Scatter, ScatterChart, CartesianGrid, XAxis, YAxis, ZAxis, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { Users, BarChart3 } from "lucide-react"

const chartConfig = {
  engagement: {
    label: "Engagement Score",
    color: "var(--chart-3)",
  },
}

interface ScatterPlotProps {
  data?: Array<{
    name: string
    users: number
    engagement: number
    engagementPerUser: number
  }>
}

export function ScatterPlot({ data = [] }: ScatterPlotProps) {
  // Transform performance data for scatter plot
  const scatterData = data.map((segment, index) => ({
    name: segment.name,
    x: segment.users, // Posts volume (x-axis)
    y: segment.engagement, // Engagement score (y-axis)
    z: segment.engagementPerUser * 20, // Size of bubble (engagement per user)
    color: `hsl(var(--chart-${(index % 5) + 1}))`,
    rawData: segment
  }))

  const maxUsers = Math.max(...scatterData.map(d => d.x), 1)
  const maxEngagement = Math.max(...scatterData.map(d => d.y), 1)
  const totalSegments = data.length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              User Segments vs Engagement
            </CardTitle>
            <CardDescription>
              User volume vs engagement activity by segment (bubble size = engagement per user)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              {totalSegments} segments
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No performance data available</p>
              <p className="text-xs">User segment data will appear when users are categorized</p>
            </div>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[350px] w-full">
            <ScatterChart
              margin={{
                top: 20,
                left: 20,
                right: 20,
                bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Users" 
                tickLine={false}
                axisLine={false}
                fontSize={11}
                domain={[0, maxUsers * 1.1]}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Engagement" 
                tickLine={false}
                axisLine={false}
                fontSize={11}
                domain={[0, maxEngagement * 1.1]}
              />
              <ZAxis 
                type="number" 
                dataKey="z" 
                range={[50, 400]} 
                name="Engagement per User"
              />
              <ChartTooltip 
                cursor={{ strokeDasharray: "3 3" }} 
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    const data = payload[0].payload.rawData
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <div className="font-medium text-sm mb-2">{data.name} Segment</div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between gap-4">
                            <span>Users:</span>
                            <span className="font-mono">{data.users}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span>Total Engagement:</span>
                            <span className="font-mono">{data.engagement}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span>Avg per User:</span>
                            <span className="font-mono">{data.engagementPerUser}</span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Scatter name="User Segments" data={scatterData} fill="var(--color-engagement)">
                {scatterData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Scatter>
            </ScatterChart>
          </ChartContainer>
        )}
        
        {data.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-xs text-muted-foreground mb-3">Top Performing Segments:</div>
            <div className="grid grid-cols-1 gap-2">
              {data
                .sort((a, b) => b.engagementPerUser - a.engagementPerUser)
                .slice(0, 3)
                .map((segment, index) => (
                  <div key={segment.name} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: `hsl(var(--chart-${(index % 5) + 1}))` }}
                      />
                      <span className="text-sm font-medium">{segment.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {segment.engagementPerUser} eng/user
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
