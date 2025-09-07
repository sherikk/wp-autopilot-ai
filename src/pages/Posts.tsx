import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Edit, Eye, MoreVertical, Search, Trash2, Plus, FileText, Send, Clock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePosts, Post } from "@/hooks/usePosts";
import { PostEditor } from "@/components/PostEditor";
import { PostTable } from "@/components/PostTable";

const Posts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState(0);
  const [showGenerating, setShowGenerating] = useState(false);
  const { toast } = useToast();
  const { posts, loading, createPost, updatePost, deletePost, publishPost } = usePosts();

  // Check for generating posts
  useEffect(() => {
    const generatingPosts = posts.filter(p => p.status === 'generating');
    setShowGenerating(generatingPosts.length > 0);
    
    if (generatingPosts.length > 0) {
      // Simulate progress based on the number of generating posts
      const totalPosts = posts.length;
      const completedPosts = totalPosts - generatingPosts.length;
      setGeneratingProgress(Math.min((completedPosts / totalPosts) * 100, 90));
      
      // Auto refresh every 3 seconds when posts are generating
      const interval = setInterval(() => {
        window.location.reload();
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [posts]);

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
                         post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.wordpress_sites?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.campaigns?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || post.status === filterStatus
    
    return matchesSearch && matchesFilter
  })

  // Group posts by status for better organization
  const groupedPosts = {
    scheduled: filteredPosts.filter(p => p.status === 'scheduled'),
    published: filteredPosts.filter(p => p.status === 'published'),
    draft: filteredPosts.filter(p => p.status === 'draft'),
    failed: filteredPosts.filter(p => p.status === 'failed'),
    generating: filteredPosts.filter(p => p.status === 'generating'),
  }

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    setIsEditorOpen(true);
  };

  const handleView = (post: Post) => {
    if (post?.wordpress_post_id && post.wordpress_sites?.url) {
      const postUrl = `${post.wordpress_sites.url}/?p=${post.wordpress_post_id}`;
      window.open(postUrl, '_blank');
    } else {
      toast({
        title: "Cannot Open Post",
        description: "Post URL not available",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      await deletePost(postId);
      toast({
        title: "Post Deleted",
        description: "The post has been successfully deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingPost(null);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setEditingPost(null);
    setIsCreating(false);
  };

  const handleSave = async (postData: Partial<Post>) => {
    if (isCreating) {
      await createPost(postData);
    } else if (editingPost) {
      await updatePost(editingPost.id, postData);
    }
  };

  const handlePublishAll = async () => {
    const draftPosts = groupedPosts.draft;
    if (draftPosts.length === 0) return;

    const confirmMessage = `Are you sure you want to publish all ${draftPosts.length} draft posts?`;
    if (!window.confirm(confirmMessage)) return;

    toast({
      title: "Publishing Posts",
      description: `Starting to publish ${draftPosts.length} draft posts...`,
    });

    let successCount = 0;
    let errorCount = 0;

    for (const post of draftPosts) {
      try {
        await publishPost(post.id);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Failed to publish post ${post.title}:`, error);
      }
    }

    toast({
      title: "Bulk Publish Complete",
      description: `Successfully published ${successCount} posts${errorCount > 0 ? `, ${errorCount} failed` : ''}.`,
      variant: errorCount > 0 ? "destructive" : "default"
    });
  };

  return (
    <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Posts</h1>
              <p className="text-muted-foreground">Manage your published and scheduled content</p>
            </div>
            
            <Button variant="gradient" size="lg" className="gap-2" onClick={handleCreate}>
              <Plus className="w-5 h-5" />
              New Post
            </Button>
          </div>

          {/* Progress indicator for generating posts */}
          {showGenerating && (
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-primary mb-2">Generating Posts with AI...</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {groupedPosts.generating.length} posts are being generated with AI content and thumbnails
                    </p>
                    <Progress value={generatingProgress} className="w-full" />
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="w-3 h-3" />
                    {groupedPosts.generating.length} generating
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search posts by title, content, site, or campaign..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="generating">Generating</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Badge variant="outline" className="px-3 py-1">
                Total: {filteredPosts.length}
              </Badge>
              <Badge variant="secondary" className="px-3 py-1">
                Scheduled: {groupedPosts.scheduled.length}
              </Badge>
              <Badge variant="default" className="px-3 py-1">
                Published: {groupedPosts.published.length}
              </Badge>
              {groupedPosts.generating.length > 0 && (
                <Badge variant="secondary" className="px-3 py-1 gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Generating: {groupedPosts.generating.length}
                </Badge>
              )}
              {groupedPosts.draft.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handlePublishAll}
                  disabled={loading}
                  className="gap-1"
                >
                  <Send className="w-3 h-3" />
                  Publish All Drafts ({groupedPosts.draft.length})
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500">Loading posts...</div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-32">
                <p className="text-gray-500 mb-4">No posts found</p>
                <Button onClick={handleCreate}>Create Your First Post</Button>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">All Posts ({filteredPosts.length})</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled ({groupedPosts.scheduled.length})</TabsTrigger>
                <TabsTrigger value="published">Published ({groupedPosts.published.length})</TabsTrigger>
                <TabsTrigger value="draft">Draft ({groupedPosts.draft.length})</TabsTrigger>
                {groupedPosts.generating.length > 0 && (
                  <TabsTrigger value="generating">Generating ({groupedPosts.generating.length})</TabsTrigger>
                )}
                {groupedPosts.failed.length > 0 && (
                  <TabsTrigger value="failed">Failed ({groupedPosts.failed.length})</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="all">
                <PostTable posts={filteredPosts} onEdit={handleEdit} onView={handleView} onDelete={handleDelete} />
              </TabsContent>
              
              <TabsContent value="scheduled">
                <PostTable posts={groupedPosts.scheduled} onEdit={handleEdit} onView={handleView} onDelete={handleDelete} />
              </TabsContent>
              
              <TabsContent value="published">
                <PostTable posts={groupedPosts.published} onEdit={handleEdit} onView={handleView} onDelete={handleDelete} />
              </TabsContent>
              
              <TabsContent value="draft">
                <PostTable posts={groupedPosts.draft} onEdit={handleEdit} onView={handleView} onDelete={handleDelete} />
              </TabsContent>
              
              {groupedPosts.generating.length > 0 && (
                <TabsContent value="generating">
                  <PostTable posts={groupedPosts.generating} onEdit={handleEdit} onView={handleView} onDelete={handleDelete} />
                </TabsContent>
              )}
              
              {groupedPosts.failed.length > 0 && (
                <TabsContent value="failed">
                  <PostTable posts={groupedPosts.failed} onEdit={handleEdit} onView={handleView} onDelete={handleDelete} />
                </TabsContent>
              )}
            </Tabs>
          )}

        </div>

        {/* Post Editor */}
        <PostEditor
          post={editingPost || undefined}
          isOpen={isEditorOpen}
          onClose={handleCloseEditor}
          onSave={handleSave}
          onDelete={deletePost}
          onPublish={publishPost}
          isNew={isCreating}
        />
    </main>
  );
};

export default Posts;