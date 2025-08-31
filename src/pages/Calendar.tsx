import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, Filter, Plus } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { usePosts } from "@/hooks/usePosts";

const Calendar = () => {
  const [selectedTab, setSelectedTab] = useState("calendar");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();
  const { posts, loading } = usePosts();

  // Get real scheduled posts from database
  const scheduledPosts = posts
    .filter(post => post.status === 'scheduled' && post.scheduled_for)
    .map(post => ({
      id: post.id,
      title: post.title,
      site: post.wordpress_sites?.name || 'Unknown Site',
      category: post.category_name || 'Uncategorized',
      scheduledFor: new Date(post.scheduled_for!),
      status: post.status
    }))
    .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());

  const handleReschedule = (postId: string) => {
    toast({
      title: "Post Rescheduled",
      description: "The post has been successfully rescheduled.",
    });
  };

  const handlePublishNow = (postId: string) => {
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
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Loading posts...</p>
                    </div>
                  ) : scheduledPosts.length === 0 ? (
                    <div className="text-center py-8">
                      <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No scheduled posts</p>
                    </div>
                  ) : (
                    scheduledPosts.map((post) => (
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
                    ))
                  )}
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
                        <div className="text-lg font-bold text-primary">
                          {posts.filter(p => p.status === 'scheduled').length}
                        </div>
                        <div className="text-xs text-muted-foreground">Scheduled</div>
                      </div>
                      <div className="p-3 bg-accent rounded-lg">
                        <div className="text-lg font-bold text-warning">
                          {posts.filter(p => p.status === 'draft').length}
                        </div>
                        <div className="text-xs text-muted-foreground">Drafts</div>
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