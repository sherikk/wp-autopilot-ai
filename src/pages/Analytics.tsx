import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  Clock, 
  Download,
  MousePointer,
  Share2,
  MessageCircle,
  Target,
  Activity
} from "lucide-react";
import { usePosts } from "@/hooks/usePosts";
import { useWordPressSites } from "@/hooks/useWordPressSites";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useAnalytics } from "@/hooks/useAnalytics";
import { 
  PerformanceTrendChart, 
  CampaignPerformanceChart, 
  EngagementBreakdownChart 
} from "@/components/AnalyticsCharts";

const Analytics = () => {
  const [selectedTab, setSelectedTab] = useState("analytics");
  const [timeRange, setTimeRange] = useState("30d");
  const [activeTab, setActiveTab] = useState("overview");
  
  const { posts } = usePosts();
  const { sites } = useWordPressSites();
  const { campaigns } = useCampaigns();
  const { postAnalytics, campaignAnalytics, overview, loading, refreshAnalytics } = useAnalytics();

  useEffect(() => {
    refreshAnalytics(timeRange);
  }, [timeRange]);
  
  // Calculate stats from analytics data and posts
  const publishedPosts = posts.filter(p => p.status === 'published');
  const scheduledPosts = posts.filter(p => p.status === 'scheduled');
  
  const stats = [
    {
      title: "Total Views",
      value: overview?.totalViews?.toLocaleString() || "0",
      change: `${overview?.totalPosts || 0} posts`,
      trend: "up" as const,
      icon: Eye
    },
    {
      title: "Total Engagement",
      value: overview?.totalEngagement?.toLocaleString() || "0",
      change: "Clicks + Shares + Comments",
      trend: "up" as const,
      icon: Activity
    },
    {
      title: "Avg. Time on Page",
      value: overview ? `${Math.round(overview.avgTimeOnPage / 60)}m ${Math.round(overview.avgTimeOnPage % 60)}s` : "0s",
      change: `${overview?.bounceRate?.toFixed(1) || 0}% bounce rate`,
      trend: "up" as const,
      icon: Clock
    },
    {
      title: "Connected Sites",
      value: sites.length.toString(),
      change: `${publishedPosts.length} published`,
      trend: "up" as const,
      icon: Target
    }
  ];

  // Prepare chart data
  const campaignChartData = campaigns.map(campaign => {
    const campaignPosts = posts.filter(p => p.campaign_id === campaign.id);
    return {
      name: campaign.name.length > 15 ? campaign.name.substring(0, 15) + '...' : campaign.name,
      published: campaignPosts.filter(p => p.status === 'published').length,
      scheduled: campaignPosts.filter(p => p.status === 'scheduled').length,
      drafts: campaignPosts.filter(p => p.status === 'draft').length
    };
  });

  const engagementData = overview ? [
    { name: "Clicks", value: postAnalytics.reduce((sum, pa) => sum + pa.clicks, 0), color: "hsl(var(--primary))" },
    { name: "Shares", value: postAnalytics.reduce((sum, pa) => sum + pa.shares, 0), color: "hsl(var(--primary-glow))" },
    { name: "Comments", value: postAnalytics.reduce((sum, pa) => sum + pa.comments, 0), color: "hsl(var(--success))" }
  ] : [];

  // Get site analytics breakdown
  const siteAnalytics = sites.map(site => {
    const sitePostIds = posts.filter(p => p.site_id === site.id).map(p => p.id);
    const sitePostAnalytics = postAnalytics.filter(pa => sitePostIds.includes(pa.post_id));
    
    return {
      site: site.name,
      posts: posts.filter(p => p.site_id === site.id).length,
      views: sitePostAnalytics.reduce((sum, pa) => sum + pa.views, 0),
      engagement: sitePostAnalytics.reduce((sum, pa) => sum + pa.clicks + pa.shares + pa.comments, 0),
      avgTimeOnPage: sitePostAnalytics.length > 0 
        ? sitePostAnalytics.reduce((sum, pa) => sum + pa.time_on_page, 0) / sitePostAnalytics.length 
        : 0
    };
  });

  const handleExport = () => {
    const exportData = {
      overview,
      siteAnalytics,
      topPosts: overview?.topPosts || [],
      dateRange: timeRange,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
              <Button variant="outline" size="lg" className="gap-2" onClick={handleExport}>
                <Download className="w-4 h-4" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="shadow-elegant border-0">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-20" />
                  </CardContent>
                </Card>
              ))
            ) : (
              stats.map((stat, index) => {
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
                        <TrendingUp className={`mr-1 h-3 w-3 text-muted-foreground`} />
                        <span className="text-muted-foreground">
                          {stat.change}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="sites">Sites</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {loading ? (
                <div className="grid lg:grid-cols-2 gap-8">
                  <Skeleton className="h-96" />
                  <Skeleton className="h-96" />
                </div>
              ) : (
                <div className="grid lg:grid-cols-2 gap-8">
                  {overview?.performanceTrend && (
                    <PerformanceTrendChart data={overview.performanceTrend} />
                  )}
                  {engagementData.length > 0 && (
                    <EngagementBreakdownChart data={engagementData} />
                  )}
                </div>
              )}
              
              {/* Top Performing Posts */}
              <Card className="shadow-elegant border-0">
                <CardHeader>
                  <CardTitle>Top Performing Posts</CardTitle>
                  <CardDescription>Posts with highest views and engagement</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : overview?.topPosts?.length === 0 ? (
                    <div className="text-center py-8">
                      <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No analytics data available yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {overview?.topPosts?.map((post, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm mb-1">{post.title}</h4>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {post.views.toLocaleString()} views
                              </span>
                              <span className="flex items-center gap-1">
                                <Activity className="w-3 h-3" />
                                {post.engagement} engagement
                              </span>
                              <span>{post.site}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              {overview?.performanceTrend && (
                <PerformanceTrendChart data={overview.performanceTrend} />
              )}
            </TabsContent>

            <TabsContent value="campaigns" className="space-y-6">
              {campaignChartData.length > 0 && (
                <CampaignPerformanceChart data={campaignChartData} />
              )}
            </TabsContent>

            <TabsContent value="sites" className="space-y-6">
              <Card className="shadow-elegant border-0">
                <CardHeader>
                  <CardTitle>Site Analytics</CardTitle>
                  <CardDescription>Performance breakdown by connected site</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : siteAnalytics.length === 0 ? (
                    <div className="text-center py-8">
                      <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No sites connected yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {siteAnalytics.map((site, index) => (
                        <div key={index} className="p-4 border border-border rounded-lg">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium">{site.site}</h4>
                            <Badge variant="outline">
                              {site.posts} {site.posts === 1 ? 'post' : 'posts'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <Eye className="w-4 h-4 text-primary" />
                                <span className="text-lg font-semibold">{site.views.toLocaleString()}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">Views</div>
                            </div>
                            <div>
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <Activity className="w-4 h-4 text-success" />
                                <span className="text-lg font-semibold">{site.engagement}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">Engagement</div>
                            </div>
                            <div>
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <Clock className="w-4 h-4 text-warning" />
                                <span className="text-lg font-semibold">
                                  {Math.round(site.avgTimeOnPage / 60)}m
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">Avg. Time</div>
                            </div>
                            <div>
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <TrendingUp className="w-4 h-4 text-primary-glow" />
                                <span className="text-lg font-semibold">
                                  {site.engagement > 0 && site.views > 0 
                                    ? ((site.engagement / site.views) * 100).toFixed(1)
                                    : 0}%
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">Engagement Rate</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Analytics;