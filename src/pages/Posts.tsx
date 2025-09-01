import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Eye, MoreVertical, Search, Trash2, Plus, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePosts, Post } from "@/hooks/usePosts";
import { PostEditor } from "@/components/PostEditor";

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
                         (post.wordpress_sites?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (post.category_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || post.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setEditingPost(post);
      setIsEditorOpen(true);
    }
  };

  const handleView = (postId: string) => {
    const post = posts.find(p => p.id === postId);
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

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading posts...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <Card className="shadow-elegant border-0 text-center py-12">
              <CardContent>
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No posts found</h3>
                <p className="text-muted-foreground">
                  {posts.length === 0 
                    ? "Create your first post to get started" 
                    : "No posts match your search criteria"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredPosts.map((post) => (
                <Card key={post.id} className="shadow-elegant border-0">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{post.title}</CardTitle>
                      <CardDescription className="space-y-1">
                        <span className="flex items-center gap-4 flex-wrap">
                          <span>{post.wordpress_sites?.name || 'Unknown Site'}</span>
                          {post.content && (
                            <span>{post.content.split(' ').length} words</span>
                          )}
                        </span>
                        {post.category_name && (
                          <span className="block mt-1">
                            <Badge variant="outline">{post.category_name}</Badge>
                          </span>
                        )}
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
                            {post.wordpress_post_id && (
                              <Button 
                                variant="outline" 
                                className="justify-start gap-2"
                                onClick={() => handleView(post.id)}
                              >
                                <Eye className="w-4 h-4" />
                                View Post
                              </Button>
                            )}
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
                      {post.status === "published" && post.published_at && (
                        <span>Published on {new Date(post.published_at).toLocaleDateString()}</span>
                      )}
                      {post.status === "scheduled" && post.scheduled_for && (
                        <span>Scheduled for {new Date(post.scheduled_for).toLocaleDateString()}</span>
                      )}
                      {post.status === "draft" && (
                        <span>Last updated {new Date(post.created_at).toLocaleDateString()}</span>
                      )}
                      {post.error_message && (
                        <div className="mt-2 p-2 bg-destructive/10 rounded text-destructive text-xs">
                          Error: {post.error_message}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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