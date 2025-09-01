import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Eye, MoreVertical, Search, Trash2, Plus, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePosts, Post } from "@/hooks/usePosts";
import { PostEditor } from "@/components/PostEditor";
import { PostTable } from "@/components/PostTable";

const Posts = () => {
  const [selectedTab, setSelectedTab] = useState("posts");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { posts, loading, createPost, updatePost, deletePost, publishPost } = usePosts();

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
            
            <Button variant="gradient" size="lg" className="gap-2" onClick={handleCreate}>
              <Plus className="w-5 h-5" />
              New Post
            </Button>
          </div>

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
    </div>
  );
};

export default Posts;