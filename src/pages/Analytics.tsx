import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Users, Eye, Clock, Download } from "lucide-react";
import { usePosts } from "@/hooks/usePosts";
import { useWordPressSites } from "@/hooks/useWordPressSites";

const Analytics = () => {
  const [selectedTab, setSelectedTab] = useState("analytics");
  const [timeRange, setTimeRange] = useState("30d");
  
  const { posts } = usePosts();
  const { sites } = useWordPressSites();
  
  // Calculate real stats from data
  const publishedPosts = posts.filter(p => p.status === 'published');
  const scheduledPosts = posts.filter(p => p.status === 'scheduled');
  
  const stats = [
    {
      title: "Total Posts Published",
      value: publishedPosts.length.toString(),
      change: "Real data",
      trend: "up" as const,
      icon: BarChart3
    },
    {
      title: "Connected Sites",
      value: sites.length.toString(),
      change: "Active sites",
      trend: "up" as const,
      icon: Eye
    },
    {
      title: "Scheduled Posts",
      value: scheduledPosts.length.toString(),
      change: "Upcoming",
      trend: "up" as const,
      icon: Clock
    },
    {
      title: "Draft Posts",
      value: posts.filter(p => p.status === 'draft').length.toString(),
      change: "In progress",
      trend: "up" as const,
      icon: Users
    }
  ];

  // Get recent posts for top performing section
  const recentPublished = publishedPosts
    .slice(0, 4)
    .map(post => ({
      title: post.title,
      site: post.wordpress_sites?.name || 'Unknown Site',
      publishedAt: new Date(post.published_at || post.created_at).toLocaleDateString(),
      category: post.category_name || 'Uncategorized'
    }));

  // Group posts by site
  const siteGroups = sites.map(site => {
    const sitePosts = posts.filter(p => p.wordpress_sites?.url === site.url);
    return {
      site: site.name,
      posts: sitePosts.length,
      published: sitePosts.filter(p => p.status === 'published').length,
      scheduled: sitePosts.filter(p => p.status === 'scheduled').length,
      drafts: sitePosts.filter(p => p.status === 'draft').length
    };
  });

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
                      <TrendingUp className={`mr-1 h-3 w-3 text-muted-foreground`} />
                      <span className="text-muted-foreground">
                        {stat.change}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Posts */}
            <Card className="shadow-elegant border-0">
              <CardHeader>
                <CardTitle>Recent Published Posts</CardTitle>
                <CardDescription>Your latest published content</CardDescription>
              </CardHeader>
              <CardContent>
                {recentPublished.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No published posts yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentPublished.map((post, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm mb-1">{post.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{post.site}</span>
                            <span>•</span>
                            <span>{post.publishedAt}</span>
                          </div>
                        </div>
                        <Badge variant="outline">{post.category}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Site Performance */}
            <Card className="shadow-elegant border-0">
              <CardHeader>
                <CardTitle>Site Breakdown</CardTitle>
                <CardDescription>Content distribution by site</CardDescription>
              </CardHeader>
              <CardContent>
                {siteGroups.length === 0 ? (
                  <div className="text-center py-8">
                    <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No sites connected yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {siteGroups.map((site, index) => (
                      <div key={index} className="p-4 border border-border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{site.site}</h4>
                          <Badge variant="outline">Total: {site.posts}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-lg font-semibold text-primary">{site.published}</div>
                            <div className="text-xs text-muted-foreground">Published</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-warning">{site.scheduled}</div>
                            <div className="text-xs text-muted-foreground">Scheduled</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-muted-foreground">{site.drafts}</div>
                            <div className="text-xs text-muted-foreground">Drafts</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;