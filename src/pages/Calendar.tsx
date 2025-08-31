import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, Filter, Plus } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";

const Calendar = () => {
  const [selectedTab, setSelectedTab] = useState("calendar");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();

  const scheduledPosts = [
    {
      id: 1,
      title: "10 Best Tech Gadgets of 2024",
      site: "TechBlog.com",
      category: "Reviews",
      scheduledFor: new Date(2024, 11, 25, 10, 0),
      status: "scheduled"
    },
    {
      id: 2,
      title: "Healthy Morning Routines",
      site: "LifestyleMag.net", 
      category: "Health",
      scheduledFor: new Date(2024, 11, 25, 14, 30),
      status: "scheduled"
    },
    {
      id: 3,
      title: "Marketing Trends for Small Business",
      site: "BusinessHub.co",
      category: "Marketing",
      scheduledFor: new Date(2024, 11, 26, 9, 0),
      status: "draft"
    }
  ];

  const handleReschedule = (postId: number) => {
    toast({
      title: "Post Rescheduled",
      description: "The post has been successfully rescheduled.",
    });
  };

  const handlePublishNow = (postId: number) => {
    toast({
      title: "Publishing Post",
      description: "The post is being published now...",
    });
  };

  return (
    <div className="flex min-h-screen bg-gradient-subtle">
      <Sidebar selectedTab={selectedTab} onTabChange={setSelectedTab} />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Content Calendar</h1>
              <p className="text-muted-foreground">Schedule and manage your content publishing timeline</p>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" size="lg" className="gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
              <Button variant="gradient" size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                Schedule Post
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="shadow-elegant border-0 mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    Upcoming Posts
                  </CardTitle>
                  <CardDescription>Posts scheduled for the next 7 days</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {scheduledPosts.map((post) => (
                    <div key={post.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="space-y-2">
                        <h3 className="font-medium">{post.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{post.site}</span>
                          <Badge variant="outline" className="text-xs">{post.category}</Badge>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.scheduledFor.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={post.status === "scheduled" ? "default" : "secondary"}>
                          {post.status}
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleReschedule(post.id)}
                        >
                          Reschedule
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handlePublishNow(post.id)}
                        >
                          Publish Now
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="shadow-elegant border-0">
                <CardHeader>
                  <CardTitle>Calendar</CardTitle>
                  <CardDescription>Select a date to view scheduled posts</CardDescription>
                </CardHeader>
                <CardContent>
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                  />
                  
                  <div className="mt-6 space-y-3">
                    <h4 className="font-medium">Quick Stats</h4>
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="p-3 bg-accent rounded-lg">
                        <div className="text-lg font-bold text-primary">12</div>
                        <div className="text-xs text-muted-foreground">This Week</div>
                      </div>
                      <div className="p-3 bg-accent rounded-lg">
                        <div className="text-lg font-bold text-warning">5</div>
                        <div className="text-xs text-muted-foreground">Overdue</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Calendar;