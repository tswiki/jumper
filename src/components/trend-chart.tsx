"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { Calendar, TrendingUp } from "lucide-react"

const chartConfig = {
  engagement: {
    label: "Engagements",
    color: "var(--chart-1)",
  },
  posts: {
    label: "Posts",
    color: "var(--chart-2)",
  },
}

interface TrendChartProps {
  data?: Array<{
    date: string
    engagement: number
    posts: number
  }>
}

export function TrendChart({ data = [] }: TrendChartProps) {
  // Format data for chart display
  const chartData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }))

  const totalEngagements = data.reduce((sum, item) => sum + item.engagement, 0)
  const totalPosts = data.reduce((sum, item) => sum + item.posts, 0)
  const avgDailyEngagement = data.length > 0 ? Math.round(totalEngagements / data.length) : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Engagement & Content Trends
            </CardTitle>
            <CardDescription>
              Daily engagement activity and posting volume over time
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              {data.length} days
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Avg: {avgDailyEngagement}/day
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">
            <div className="text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No trend data available</p>
              <p className="text-xs">Data will appear as engagement activity is recorded</p>
            </div>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[350px] w-full">
            <AreaChart
              data={chartData}
              margin={{
                top: 12,
                left: 12,
                right: 12,
                bottom: 0,
              }}
            >
              <CartesianGrid vertical={false} strokeOpacity={0.3} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={11}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8} 
                fontSize={11}
                width={35}
              />
              <ChartTooltip 
                cursor={false} 
                content={<ChartTooltipContent 
                  indicator="dot"
                  formatter={(value, name) => [
                    `${value} ${name.toLowerCase()}`,
                    name === 'engagement' ? 'Engagements' : 'Posts'
                  ]}
                />} 
              />
              <Area
                dataKey="posts"
                type="monotone"
                fill="var(--color-posts)"
                fillOpacity={0.2}
                stroke="var(--color-posts)"
                strokeWidth={2}
              />
              <Area
                dataKey="engagement"
                type="monotone"
                fill="var(--color-engagement)"
                fillOpacity={0.4}
                stroke="var(--color-engagement)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
        
        {data.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-chart-1">{totalEngagements}</div>
              <div className="text-xs text-muted-foreground">Total Engagements</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-chart-2">{totalPosts}</div>
              <div className="text-xs text-muted-foreground">Total Posts</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
