import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Users, Eye, Clock, Download } from "lucide-react";

const Analytics = () => {
  const [selectedTab, setSelectedTab] = useState("analytics");
  const [timeRange, setTimeRange] = useState("30d");

  const stats = [
    {
      title: "Total Posts Published",
      value: "247",
      change: "+12%",
      trend: "up",
      icon: BarChart3
    },
    {
      title: "Total Page Views",
      value: "156.2K",
      change: "+8.3%",
      trend: "up",
      icon: Eye
    },
    {
      title: "Avg. Reading Time",
      value: "3m 42s",
      change: "+0.2m",
      trend: "up",
      icon: Clock
    },
    {
      title: "Engagement Rate",
      value: "4.2%",
      change: "-0.1%",
      trend: "down",
      icon: Users
    }
  ];

  const topPosts = [
    {
      title: "The Complete Guide to WordPress SEO",
      site: "TechBlog.com",
      views: 15420,
      engagement: "5.8%",
      publishedAt: "2024-01-10"
    },
    {
      title: "10 Morning Habits That Changed My Life",
      site: "LifestyleMag.net",
      views: 12350,
      engagement: "7.2%",
      publishedAt: "2024-01-08"
    },
    {
      title: "Digital Marketing ROI: How to Measure Success",
      site: "BusinessHub.co",
      views: 9870,
      engagement: "4.1%",
      publishedAt: "2024-01-12"
    },
    {
      title: "Best WordPress Themes for 2024",
      site: "TechBlog.com",
      views: 8650,
      engagement: "6.3%",
      publishedAt: "2024-01-15"
    }
  ];

  const sitePerformance = [
    {
      site: "TechBlog.com",
      posts: 89,
      views: "67.2K",
      avgEngagement: "5.4%",
      topCategory: "WordPress"
    },
    {
      site: "LifestyleMag.net",
      posts: 67,
      views: "45.8K",
      avgEngagement: "6.1%",
      topCategory: "Health"
    },
    {
      site: "BusinessHub.co",
      posts: 91,
      views: "43.2K",
      avgEngagement: "4.7%",
      topCategory: "Marketing"
    }
  ];

  return (
    <div className="flex min-h-screen bg-gradient-subtle">
      <Sidebar selectedTab={selectedTab} onTabChange={setSelectedTab} />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
              <p className="text-muted-foreground">Track performance across all your WordPress sites</p>
            </div>
            
            <div className="flex gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="lg" className="gap-2">
                <Download className="w-4 h-4" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="shadow-elegant border-0">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="flex items-center text-xs">
                      <TrendingUp className={`mr-1 h-3 w-3 ${
                        stat.trend === "up" ? "text-success" : "text-destructive"
                      }`} />
                      <span className={stat.trend === "up" ? "text-success" : "text-destructive"}>
                        {stat.change}
                      </span>
                      <span className="text-muted-foreground ml-1">from last period</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Top Performing Posts */}
            <Card className="shadow-elegant border-0">
              <CardHeader>
                <CardTitle>Top Performing Posts</CardTitle>
                <CardDescription>Based on views and engagement in the last {timeRange}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPosts.map((post, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-1">{post.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{post.site}</span>
                          <span>•</span>
                          <span>{post.publishedAt}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{post.views.toLocaleString()} views</div>
                        <div className="text-xs text-success">{post.engagement} engagement</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Site Performance */}
            <Card className="shadow-elegant border-0">
              <CardHeader>
                <CardTitle>Site Performance</CardTitle>
                <CardDescription>Breakdown by connected WordPress sites</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sitePerformance.map((site, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{site.site}</h4>
                        <Badge variant="outline">{site.topCategory}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-semibold text-primary">{site.posts}</div>
                          <div className="text-xs text-muted-foreground">Posts</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-primary">{site.views}</div>
                          <div className="text-xs text-muted-foreground">Views</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-primary">{site.avgEngagement}</div>
                          <div className="text-xs text-muted-foreground">Engagement</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;