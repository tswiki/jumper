import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

// Data analyst insights generation function
function generateDataInsights(data: any) {
  const recommendations = []
  const { metrics, trends, performance, insights, users, engagement, posts } = data

  // Engagement Rate Analysis
  if (metrics.engagementRate < 5) {
    recommendations.push({
      type: 'warning',
      title: 'Low Engagement Rate',
      description: `Current engagement rate of ${metrics.engagementRate}% is below industry average (5-10%). Consider improving content quality or posting frequency.`,
      priority: 'high',
      actionable: 'Analyze top-performing posts and replicate successful content strategies.'
    })
  } else if (metrics.engagementRate > 15) {
    recommendations.push({
      type: 'success',
      title: 'Excellent Engagement',
      description: `Outstanding engagement rate of ${metrics.engagementRate}%! Your content resonates well with your audience.`,
      priority: 'info',
      actionable: 'Document what makes your content successful and scale these strategies.'
    })
  }

  // User Segment Performance Analysis
  const topPerformingSegment = performance.reduce((top, current) => 
    current.engagementPerUser > (top?.engagementPerUser || 0) ? current : top
  , null)

  if (topPerformingSegment) {
    recommendations.push({
      type: 'insight',
      title: 'High-Value User Segment',
      description: `Users in "${topPerformingSegment.name}" segment show highest engagement (${topPerformingSegment.engagementPerUser} per user).`,
      priority: 'medium',
      actionable: `Focus marketing efforts on acquiring more "${topPerformingSegment.name}" users.`
    })
  }

  // Geographic Performance Analysis
  const topCountries = Object.entries(insights.topEngagementCountry || {})
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 3)

  if (topCountries.length > 0) {
    const [topCountry, engagementCount] = topCountries[0]
    recommendations.push({
      type: 'insight',
      title: 'Geographic Hotspot',
      description: `"${topCountry}" shows highest engagement activity (${engagementCount} total engagements).`,
      priority: 'medium',
      actionable: `Consider localized content or targeted campaigns for ${topCountry}.`
    })
  }

  // Trend Analysis
  if (trends.length >= 7) {
    const recent = trends.slice(-7)
    const earlier = trends.slice(-14, -7)
    
    const recentAvg = recent.reduce((sum, t) => sum + t.engagement, 0) / recent.length
    const earlierAvg = earlier.reduce((sum, t) => sum + t.engagement, 0) / earlier.length
    
    const trendDirection = ((recentAvg - earlierAvg) / earlierAvg) * 100

    if (trendDirection > 20) {
      recommendations.push({
        type: 'success',
        title: 'Growing Engagement Trend',
        description: `Engagement has increased by ${Math.round(trendDirection)}% over the last week.`,
        priority: 'info',
        actionable: 'Continue current content strategy and consider increasing posting frequency.'
      })
    } else if (trendDirection < -20) {
      recommendations.push({
        type: 'warning',
        title: 'Declining Engagement',
        description: `Engagement has decreased by ${Math.round(Math.abs(trendDirection))}% over the last week.`,
        priority: 'high',
        actionable: 'Review recent content changes and re-engage with your audience.'
      })
    }
  }

  // Content Volume vs Engagement Analysis - Enhanced for Author Performance
  if (metrics.totalPosts > 0 && metrics.avgEngagementPerUser > 0) {
    const contentEfficiency = metrics.totalEngagements / metrics.totalPosts
    
    if (contentEfficiency < 2) {
      recommendations.push({
        type: 'warning',
        title: 'Content Volume vs Quality Balance',
        description: `Low engagement per post (${contentEfficiency.toFixed(1)}). High-volume authors may benefit from focusing on quality over quantity.`,
        priority: 'medium',
        actionable: 'Identify top-performing content patterns from high-engagement posts and guide high-volume authors to replicate these strategies.'
      })
    } else if (contentEfficiency > 5) {
      recommendations.push({
        type: 'success',
        title: 'Excellent Content Engagement',
        description: `High engagement per post (${contentEfficiency.toFixed(1)}). Your authors are creating highly engaging content.`,
        priority: 'info',
        actionable: 'Analyze what makes these high-performing posts successful and create guidelines for other authors.'
      })
    }
  }

  // Author Performance Analysis
  if (users.length > 0 && posts.length > 0) {
    const authorsWithPosts = users.filter(user => {
      const userPosts = posts.filter(p => p.author_id === user.user_id || p.user_id === user.user_id).length
      return userPosts > 0
    })
    
    if (authorsWithPosts.length > 0) {
      const avgPostsPerAuthor = posts.length / authorsWithPosts.length
      const highVolumeAuthors = authorsWithPosts.filter(user => {
        const userPosts = posts.filter(p => p.author_id === user.user_id || p.user_id === user.user_id).length
        return userPosts > avgPostsPerAuthor * 2
      })
      
      if (highVolumeAuthors.length > 0) {
        recommendations.push({
          type: 'insight',
          title: 'High-Volume Content Authors',
          description: `${highVolumeAuthors.length} author(s) are producing significantly more content than average (${avgPostsPerAuthor.toFixed(1)} posts/author).`,
          priority: 'medium',
          actionable: `Monitor engagement rates for high-volume authors to ensure quality isn't sacrificed for quantity. Consider featuring their top-performing content.`
        })
      }
    }
  }

  // User Activity Patterns
  if (users.length > 0) {
    const activeUsers = users.filter(u => {
      const userEngagements = engagement && engagement.length > 0 
        ? engagement.filter(e => e.user_id === u.user_id).length
        : 0
      return userEngagements > 0
    }).length
    
    const activityRate = (activeUsers / users.length) * 100
    
    if (activityRate < 30) {
      recommendations.push({
        type: 'warning',
        title: 'Low User Activity Rate',
        description: `Only ${Math.round(activityRate)}% of users are actively engaging. Many users may be inactive.`,
        priority: 'high',
        actionable: 'Implement user re-engagement campaigns or improve onboarding process.'
      })
    }
  }

  // Add specific recommendation for empty engagement data
  if (users.length > 0 && posts.length > 0 && engagement.length === 0) {
    recommendations.push({
      type: 'warning',
      title: 'No Engagement Data Found',
      description: `You have ${users.length} users and ${posts.length} posts, but no engagement records. This suggests engagement tracking may not be properly implemented.`,
      priority: 'high',
      actionable: 'Check your engagement tracking implementation and ensure user interactions are being recorded in the engagement table.'
    })
  }

  return recommendations
}

export async function GET() {
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

  try {
    const supabase = await createServerClient()
    
    console.log('🚀 Fetching real dashboard data from database...')
    
    // First, let's discover what tables actually exist by trying to fetch data
    const tableQueries = [
      { name: 'users', query: supabase.from('users').select('*').limit(1000) },
      { name: 'engagement', query: supabase.from('engagement').select('*').limit(1000) },
      { name: 'posts', query: supabase.from('posts').select('*').limit(1000) }
    ]

    const results = await Promise.allSettled(tableQueries.map(t => t.query))
    
    console.log('📊 Database query results:', results.map((r, i) => ({
      table: tableQueries[i].name,
      status: r.status,
      count: r.status === 'fulfilled' ? r.value.data?.length || 0 : 0,
      error: r.status === 'rejected' ? r.reason : null
    })))

    // Extract successful results and ensure they're arrays
    const users = results[0].status === 'fulfilled' ? (results[0].value.data || []) : []
    const engagement = results[1].status === 'fulfilled' ? (results[1].value.data || []) : []
    const posts = results[2].status === 'fulfilled' ? (results[2].value.data || []) : []

    // Log what we found
    console.log(`📈 Found ${users.length} users, ${engagement.length} engagement records, ${posts.length} posts`)
    
    // If we have no data at all, provide helpful error message
    if (users.length === 0 && engagement.length === 0 && posts.length === 0) {
      return NextResponse.json(
        { 
          error: "No data found in any tables",
          hint: "Check that your database contains data in users, engagement, or posts tables",
          available_tables: results.map((r, i) => ({
            table: tableQueries[i].name,
            accessible: r.status === 'fulfilled',
            error: r.status === 'rejected' ? (r.reason as any)?.message : null
          }))
        }, 
        { status: 404 }
      )
    }

    // If we have some data, continue processing even with empty engagement
    console.log('✅ Processing dashboard data with available information...')


    // Calculate real metrics from actual data
    const totalEngagements = engagement?.length || 0
    const totalPosts = posts?.length || 0
    const totalUsers = users?.length || 0
    
    // Calculate engagement rate
    const engagementRate = totalPosts > 0 ? (totalEngagements / totalPosts * 100) : 0
    
    // Calculate average engagement per user
    const avgEngagementPerUser = totalUsers > 0 ? (totalEngagements / totalUsers) : 0
    
    const metrics = {
      totalUsers,
      totalPosts,
      totalEngagements,
      engagementRate: Math.round(engagementRate * 100) / 100,
      avgEngagementPerUser: Math.round(avgEngagementPerUser * 100) / 100
    }

    console.log('📊 Calculated metrics:', metrics)

    // Generate engagement trend data over time
    const engagementByDate = engagement && engagement.length > 0
      ? engagement.reduce((acc, e) => {
          const date = new Date(e.created_at || e.date || Date.now()).toISOString().split('T')[0]
          acc[date] = (acc[date] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      : {}

    const trends = Object.entries(engagementByDate)
      .map(([date, count]) => ({ date, engagement: count, posts: 0 }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30) // Last 30 days

    // Add posts trend data
    const postsByDate = posts && posts.length > 0
      ? posts.reduce((acc, p) => {
          const date = new Date(p.created_at || p.date || Date.now()).toISOString().split('T')[0]
          acc[date] = (acc[date] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      : {}

    trends.forEach(trend => {
      trend.posts = postsByDate[trend.date] || 0
    })

    // If no trend data from engagement, create trends from posts
    if (trends.length === 0 && posts.length > 0) {
      const postTrends = Object.entries(postsByDate)
        .map(([date, count]) => ({ date, engagement: 0, posts: count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-30)
      
      trends.push(...postTrends)
    }

    // If still no trends, create a basic trend for today
    if (trends.length === 0) {
      const today = new Date().toISOString().split('T')[0]
      trends.push({ date: today, engagement: 0, posts: posts.length })
    }

    console.log('📈 Trend data generated:', trends.length, 'data points')

    // Generate user segment performance data
    const userSegments = users && users.length > 0
      ? users.reduce((acc, user) => {
          const segment = user.user_segment || 'Unknown'
          if (!acc[segment]) {
            acc[segment] = { count: 0, engagement: 0 }
          }
          acc[segment].count += 1
          
          // Count engagements for this user (safely handle empty engagement array)
          const userEngagement = engagement && engagement.length > 0 
            ? engagement.filter(e => e.user_id === user.user_id).length 
            : 0
          acc[segment].engagement += userEngagement
          
          return acc
        }, {} as Record<string, { count: number, engagement: number }>)
      : {}

    const performance = Object.entries(userSegments)
      .map(([segment, data]) => ({
        name: segment,
        users: data.count,
        engagement: data.engagement,
        engagementPerUser: data.count > 0 ? Math.round((data.engagement / data.count) * 100) / 100 : 0
      }))

    console.log('🎯 Performance by segment:', performance)

    // Calculate user insights and patterns
    const insights = {
      topEngagementCountry: users && users.length > 0
        ? users.reduce((acc, user) => {
            const country = user.country || 'Unknown'
            const userEngagement = engagement && engagement.length > 0 
              ? engagement.filter(e => e.user_id === user.user_id).length 
              : 0
            acc[country] = (acc[country] || 0) + userEngagement
            return acc
          }, {} as Record<string, number>)
        : {},
      
      userGrowthTrend: users && users.length > 0
        ? users.reduce((acc, user) => {
            const date = new Date(user.signup_date || Date.now()).toISOString().split('T')[0]
            acc[date] = (acc[date] || 0) + 1
            return acc
          }, {} as Record<string, number>)
        : {},
      
      engagementByUserSegment: userSegments
    }

    console.log('💡 Generated insights:', Object.keys(insights))

    // Generate data analyst recommendations
    const recommendations = generateDataInsights({
      metrics,
      trends,
      performance,
      insights,
      users,
      engagement,
      posts
    })

    console.log('💰 Generated recommendations:', recommendations.length, 'insights')

    return NextResponse.json({
      metrics,
      trends,
      performance,
      insights,
      recommendations,
      source: "supabase",
      timestamp: new Date().toISOString(),
      data_freshness: {
        users_count: users?.length || 0,
        engagement_count: engagement?.length || 0,
        posts_count: posts?.length || 0
      }
    })

  } catch (error: any) {
    console.error('Dashboard API error:', error)
    
    return NextResponse.json(
      { 
        error: "Failed to fetch dashboard data",
        details: error.message,
        hint: "Check your database connection and table schema"
      }, 
      { status: 500 }
    )
  }
}