import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, FileText, Globe, MoreVertical, Pause, Play, Plus, Zap } from "lucide-react";

const Campaigns = () => {
  const [selectedTab, setSelectedTab] = useState("campaigns");
  const [campaigns] = useState([
    {
      id: 1,
      name: "Tech Reviews Campaign",
      site: "TechBlog.com",
      status: "active",
      totalPosts: 50,
      completed: 23,
      scheduled: 15,
      nextPost: "In 2 hours",
      categories: ["Reviews", "Gadgets", "Software"]
    },
    {
      id: 2, 
      name: "Lifestyle Content Series",
      site: "LifestyleMag.net",
      status: "paused",
      totalPosts: 30,
      completed: 12,
      scheduled: 8,
      nextPost: "Paused",
      categories: ["Health", "Fashion", "Travel"]
    },
    {
      id: 3,
      name: "Business Tips Weekly", 
      site: "BusinessHub.co",
      status: "draft",
      totalPosts: 25,
      completed: 0,
      scheduled: 0,
      nextPost: "Not scheduled",
      categories: ["Marketing", "Finance", "Leadership"]
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "paused": return "secondary"; 
      case "draft": return "outline";
      default: return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return Play;
      case "paused": return Pause;
      case "draft": return FileText;
      default: return FileText;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-subtle">
      <Sidebar selectedTab={selectedTab} onTabChange={setSelectedTab} />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Campaigns</h1>
              <p className="text-muted-foreground">Manage your content automation campaigns</p>
            </div>
            
            <Button variant="gradient" size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              Create Campaign
            </Button>
          </div>

          <div className="grid gap-6">
            {campaigns.map((campaign) => {
              const StatusIcon = getStatusIcon(campaign.status);
              const progress = (campaign.completed / campaign.totalPosts) * 100;
              
              return (
                <Card key={campaign.id} className="shadow-elegant border-0">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{campaign.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Globe className="w-4 h-4" />
                          {campaign.site}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge 
                        variant={getStatusColor(campaign.status)}
                        className="gap-1"
                      >
                        <StatusIcon className="w-3 h-3" />
                        {campaign.status}
                      </Badge>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{campaign.completed} / {campaign.totalPosts} posts</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold text-primary">{campaign.completed}</div>
                        <div className="text-xs text-muted-foreground">Completed</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-warning">{campaign.scheduled}</div>
                        <div className="text-xs text-muted-foreground">Scheduled</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-success">
                          {campaign.totalPosts - campaign.completed - campaign.scheduled}
                        </div>
                        <div className="text-xs text-muted-foreground">Remaining</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        Next post: {campaign.nextPost}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {campaign.categories.slice(0, 3).map((category) => (
                          <Badge key={category} variant="outline" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                        {campaign.categories.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{campaign.categories.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Campaigns;