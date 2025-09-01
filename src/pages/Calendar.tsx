import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, Filter, Plus, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { PostEditor } from "@/components/PostEditor";
import { useToast } from "@/hooks/use-toast";
import { usePosts } from "@/hooks/usePosts";
import { useCampaignSchedule } from "@/hooks/useCampaignSchedule";
import { format } from "date-fns";

const Calendar = () => {
  const [selectedTab, setSelectedTab] = useState("calendar");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isPostEditorOpen, setIsPostEditorOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const { toast } = useToast();
  const { posts, loading, createPost } = usePosts();
  const { schedules, loading: schedulesLoading } = useCampaignSchedule();

  // Get real scheduled posts from database
  const scheduledPosts = posts
    .filter(post => post.status === 'scheduled' && post.scheduled_for)
    .map(post => ({
      id: post.id,
      title: post.title,
      site: post.wordpress_sites?.name || 'Unknown Site',
      category: post.category_name || 'Uncategorized',
      scheduledFor: new Date(post.scheduled_for!),
      status: post.status,
      type: 'post' as const
    }))
    .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());

  // Get campaign scheduled items with AI-generated titles
  const campaignScheduledItems = schedules
    .filter(schedule => schedule.status === 'planned')
    .map((schedule, index) => {
      const campaignName = schedule.campaigns?.name || 'Campaign';
      const aiTitle = schedule.title || `Post ${index + 1}`;
      const dateStr = format(new Date(schedule.scheduled_for), "MMM dd");
      
      return {
        id: schedule.id,
        title: `${campaignName}: ${aiTitle}`,
        site: 'Campaign Generated',
        category: 'Campaign',
        scheduledFor: new Date(schedule.scheduled_for),
        status: 'planned' as const,
        type: 'campaign' as const,
        campaignId: schedule.campaign_id
      };
    })
    .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());

  // Combine both types of scheduled content
  const allScheduledItems = [...scheduledPosts, ...campaignScheduledItems]
    .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());

  // Pagination logic
  const totalPages = Math.ceil(allScheduledItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = allScheduledItems.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const { publishPost } = usePosts();

  const handleReschedule = (postId: string) => {
    // TODO: Implement reschedule functionality
    toast({
      title: "Feature Coming Soon",
      description: "Post rescheduling will be available in a future update.",
      variant: "default"
    });
  };

  const handlePublishNow = async (postId: string) => {
    try {
      await publishPost(postId);
      toast({
        title: "Publishing Post",
        description: "The post is being published now...",
      });
    } catch (error: any) {
      toast({
        title: "Publish Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleCreatePost = async (postData: any) => {
    try {
      await createPost(postData);
      toast({
        title: "Post Created",
        description: "Your post has been saved successfully.",
      });
      setIsPostEditorOpen(false);
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive"
      });
    }
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
              <Button 
                variant="gradient" 
                size="lg" 
                className="gap-2"
                onClick={() => setIsPostEditorOpen(true)}
              >
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
                  {loading || schedulesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Loading scheduled content...</p>
                    </div>
                  ) : allScheduledItems.length === 0 ? (
                    <div className="text-center py-8">
                      <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No scheduled content</p>
                      <p className="text-xs text-muted-foreground mt-2">Create campaigns with schedules to see upcoming posts</p>
                    </div>
                  ) : (
                    <>
                      {paginatedItems.map((item) => (
                        <div key={`${item.type}-${item.id}`} className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{item.title}</h3>
                              {item.type === 'campaign' && (
                                <Badge variant="outline" className="text-xs bg-gradient-primary text-white border-0">
                                  <Zap className="w-3 h-3 mr-1" />
                                  AI Generated
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{item.site}</span>
                              <Badge variant="outline" className="text-xs">{item.category}</Badge>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(item.scheduledFor, "MMM dd, yyyy 'at' HH:mm")}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              item.status === "scheduled" ? "default" : 
                              item.status === "planned" ? "secondary" : 
                              "outline"
                            }>
                              {item.status}
                            </Badge>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleReschedule(item.id)}
                            >
                              Reschedule
                            </Button>
                            {item.type === 'post' && (
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => handlePublishNow(item.id)}
                              >
                                Publish Now
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="text-sm text-muted-foreground">
                            Showing {startIndex + 1}-{Math.min(endIndex, allScheduledItems.length)} of {allScheduledItems.length} posts
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handlePrevPage}
                              disabled={currentPage === 1}
                              className="gap-1"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              Previous
                            </Button>
                            <span className="text-sm font-medium px-3">
                              Page {currentPage} of {totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleNextPage}
                              disabled={currentPage === totalPages}
                              className="gap-1"
                            >
                              Next
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
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
                          {posts.filter(p => p.status === 'scheduled').length + schedules.filter(s => s.status === 'planned').length}
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

      <PostEditor
        isOpen={isPostEditorOpen}
        onClose={() => setIsPostEditorOpen(false)}
        onSave={handleCreatePost}
        isNew={true}
      />
    </div>
  );
};

export default Calendar;