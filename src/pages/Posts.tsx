import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Eye, MoreVertical, Search, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Posts = () => {
  const [selectedTab, setSelectedTab] = useState("posts");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const { toast } = useToast();

  const posts = [
    {
      id: 1,
      title: "The Future of AI in WordPress Development",
      site: "TechBlog.com",
      category: "Technology",
      status: "published",
      publishedAt: "2024-01-15T10:30:00Z",
      views: 2847,
      wordCount: 1250
    },
    {
      id: 2,
      title: "10 Healthy Breakfast Ideas for Busy Mornings",
      site: "LifestyleMag.net",
      category: "Health",
      status: "scheduled",
      scheduledFor: "2024-01-20T09:00:00Z",
      wordCount: 980
    },
    {
      id: 3,
      title: "Digital Marketing Strategies That Actually Work",
      site: "BusinessHub.co", 
      category: "Marketing",
      status: "draft",
      updatedAt: "2024-01-14T16:45:00Z",
      wordCount: 1450
    },
    {
      id: 4,
      title: "Best WordPress Plugins for SEO in 2024",
      site: "TechBlog.com",
      category: "WordPress",
      status: "published",
      publishedAt: "2024-01-12T14:20:00Z",
      views: 1923,
      wordCount: 1100
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "default";
      case "scheduled": return "secondary";
      case "draft": return "outline";
      default: return "outline";
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.site.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || post.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (postId: number) => {
    toast({
      title: "Opening Editor",
      description: "Redirecting to post editor...",
    });
  };

  const handleView = (postId: number) => {
    toast({
      title: "Opening Post",
      description: "Opening post in new window...",
    });
  };

  const handleDelete = (postId: number) => {
    toast({
      title: "Post Deleted",
      description: "The post has been moved to trash.",
      variant: "destructive"
    });
  };

  return (
    <div className="flex min-h-screen bg-gradient-subtle">
      <Sidebar selectedTab={selectedTab} onTabChange={setSelectedTab} />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Posts</h1>
              <p className="text-muted-foreground">Manage your published and scheduled content</p>
            </div>
            
            <Button variant="gradient" size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              New Post
            </Button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search posts, sites, categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Posts</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-6">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="shadow-elegant border-0">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{post.title}</CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span>{post.site}</span>
                      <Badge variant="outline">{post.category}</Badge>
                      <span>{post.wordCount} words</span>
                      {post.views && <span>{post.views} views</span>}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant={getStatusColor(post.status)}>
                      {post.status}
                    </Badge>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Post Actions</DialogTitle>
                          <DialogDescription>Choose an action for this post</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-2">
                          <Button 
                            variant="outline" 
                            className="justify-start gap-2"
                            onClick={() => handleEdit(post.id)}
                          >
                            <Edit className="w-4 h-4" />
                            Edit Post
                          </Button>
                          <Button 
                            variant="outline" 
                            className="justify-start gap-2"
                            onClick={() => handleView(post.id)}
                          >
                            <Eye className="w-4 h-4" />
                            View Post
                          </Button>
                          <Button 
                            variant="outline" 
                            className="justify-start gap-2 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(post.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Post
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {post.status === "published" && post.publishedAt && (
                      <span>Published on {new Date(post.publishedAt).toLocaleDateString()}</span>
                    )}
                    {post.status === "scheduled" && post.scheduledFor && (
                      <span>Scheduled for {new Date(post.scheduledFor).toLocaleDateString()}</span>
                    )}
                    {post.status === "draft" && post.updatedAt && (
                      <span>Last updated {new Date(post.updatedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <Card className="shadow-elegant border-0 text-center py-12">
              <CardContent>
                <p className="text-muted-foreground">No posts found matching your search criteria.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Posts;