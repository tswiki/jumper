import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, MessageSquare, FileText, TrendingUp, Heart } from "lucide-react"

interface MetricsCardsProps {
  data: {
    totalUsers: number
    totalPosts: number
    totalEngagements: number
    engagementRate: number
    avgEngagementPerUser: number
  }
}

export function MetricsCards({ data }: MetricsCardsProps) {
  if (!data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              <div className="h-4 w-4 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const metrics = [
    {
      title: "Total Users",
      value: data.totalUsers?.toLocaleString() || "0",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Total Posts", 
      value: data.totalPosts?.toLocaleString() || "0",
      icon: FileText,
      color: "text-purple-600"
    },
    {
      title: "Total Engagements",
      value: data.totalEngagements?.toLocaleString() || "0", 
      icon: Heart,
      color: "text-green-600"
    },
    {
      title: "Engagement Rate",
      value: `${data.engagementRate || 0}%`,
      icon: TrendingUp,
      color: "text-orange-600"
    },
    {
      title: "Avg. Engagement/User",
      value: data.avgEngagementPerUser?.toFixed(1) || "0.0",
      icon: MessageSquare,
      color: "text-pink-600"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {metrics.map((metric) => {
        const Icon = metric.icon
        return (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <Icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metric.color}`}>
                {metric.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From your database
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
