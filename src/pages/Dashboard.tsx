import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Calendar, Globe, Plus, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [selectedTab, setSelectedTab] = useState("overview");
  const { toast } = useToast();

  const stats = [
    { title: "Connected Sites", value: "3", change: "+1 this week", icon: Globe },
    { title: "Active Campaigns", value: "12", change: "+2 this month", icon: Zap },
    { title: "Posts Scheduled", value: "47", change: "Next 7 days", icon: Calendar },
    { title: "Success Rate", value: "98.2%", change: "+0.3% this week", icon: BarChart3 },
  ];

  const recentActivity = [
    { site: "TechBlog.com", action: "Published 3 posts", status: "success", time: "2 hours ago" },
    { site: "LifestyleMag.net", action: "Scheduled 5 posts", status: "pending", time: "4 hours ago" },
    { site: "BusinessHub.co", action: "Generated thumbnails", status: "success", time: "6 hours ago" },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-subtle">
      <Sidebar selectedTab={selectedTab} onTabChange={setSelectedTab} />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
              <p className="text-muted-foreground">Monitor your WordPress automation</p>
            </div>
            <Button variant="gradient" size="lg" className="gap-2" asChild>
              <Link to="/campaigns">
                <Plus className="w-5 h-5" />
                New Campaign
              </Link>
            </Button>
          </div>

          {/* Stats Grid */}
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
                    <p className="text-xs text-muted-foreground">{stat.change}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Activity */}
          <Card className="shadow-elegant border-0">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from your campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <div>
                        <p className="font-medium">{activity.site}</p>
                        <p className="text-sm text-muted-foreground">{activity.action}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={activity.status === "success" ? "default" : "secondary"}>
                        {activity.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;