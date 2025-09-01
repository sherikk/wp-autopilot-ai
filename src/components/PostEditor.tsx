import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Post } from "@/hooks/usePosts";
import { useWordPressSites } from "@/hooks/useWordPressSites";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useToast } from "@/hooks/use-toast";
import { Save, Trash2, CalendarIcon, Send, Eye, Globe } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface PostEditorProps {
  post?: Post;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (postData: Partial<Post>) => Promise<void>;
  onDelete?: (postId: string) => Promise<void>;
  onPublish?: (postId: string) => Promise<void>;
  isNew?: boolean;
}

export const PostEditor = ({ 
  post, 
  isOpen, 
  onClose, 
  onSave,
  onDelete,
  onPublish,
  isNew = false 
}: PostEditorProps) => {
  const [title, setTitle] = useState(post?.title || '');
  const [content, setContent] = useState(post?.content || '');
  const [status, setStatus] = useState(post?.status || 'draft');
  const [categoryName, setCategoryName] = useState(post?.category_name || '');
  const [tags, setTags] = useState<string[]>(post?.tags || []);
  const [tagsInput, setTagsInput] = useState('');
  const [scheduledFor, setScheduledFor] = useState<Date | undefined>(
    post?.scheduled_for ? new Date(post.scheduled_for) : undefined
  );
  const [selectedSiteId, setSelectedSiteId] = useState(post?.site_id || '');
  const [selectedCampaignId, setSelectedCampaignId] = useState(post?.campaign_id || 'none');
  
  const { sites } = useWordPressSites();
  const { campaigns } = useCampaigns();
  const { toast } = useToast();

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setContent(post.content || '');
      setStatus(post.status);
      setCategoryName(post.category_name || '');
      setTags(post.tags || []);
      setScheduledFor(post.scheduled_for ? new Date(post.scheduled_for) : undefined);
      setSelectedSiteId(post.site_id);
      setSelectedCampaignId(post.campaign_id || 'none');
    }
  }, [post]);

  const handleSave = async () => {
    if (!onSave) return;
    
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for the post.",
        variant: "destructive"
      });
      return;
    }

    if (isNew && !selectedSiteId) {
      toast({
        title: "Site Required",
        description: "Please select a WordPress site.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const postData: Partial<Post> = {
        title: title.trim(),
        content: content.trim(),
        status,
        category_name: categoryName.trim() || null,
        tags,
        scheduled_for: scheduledFor?.toISOString() || null,
        ...(isNew && { site_id: selectedSiteId }),
        ...(selectedCampaignId && selectedCampaignId !== 'none' && { campaign_id: selectedCampaignId })
      };

      await onSave(postData);
      
      toast({
        title: isNew ? "Post Created" : "Post Updated",
        description: `Your post has been successfully ${isNew ? 'created' : 'updated'}.`,
      });
      
      onClose();
    } catch (error: any) {
      toast({
        title: isNew ? "Creation Failed" : "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !post) return;
    
    try {
      await onDelete(post.id);
      toast({
        title: "Post Deleted",
        description: "The post has been successfully deleted.",
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handlePublish = async () => {
    if (!onPublish || !post) return;
    
    try {
      await onPublish(post.id);
      toast({
        title: "Post Published",
        description: "The post has been published to WordPress.",
      });
    } catch (error: any) {
      toast({
        title: "Publish Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleAddTag = () => {
    if (tagsInput.trim() && !tags.includes(tagsInput.trim())) {
      setTags([...tags, tagsInput.trim()]);
      setTagsInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target === document.activeElement) {
      e.preventDefault();
      handleAddTag();
    }
  };

  const currentSite = sites.find(site => site.id === selectedSiteId);
  const currentCampaign = campaigns.find(campaign => campaign.id === selectedCampaignId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Create New Post' : 'Edit Post'}</DialogTitle>
          <DialogDescription>
            {isNew ? 'Create a new blog post for your WordPress site.' : 'Modify your post content and settings.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Post Status */}
          {!isNew && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Status</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant={status === 'published' ? 'default' : status === 'scheduled' ? 'secondary' : 'outline'}>
                    {status}
                  </Badge>
                  {post?.wordpress_post_id && (
                    <Badge variant="outline">
                      WordPress ID: {post.wordpress_post_id}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {post?.wordpress_post_id && currentSite && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        const postUrl = `${currentSite.url}/?p=${post.wordpress_post_id}`;
                        window.open(postUrl, '_blank');
                      }}
                      className="gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      View Live
                    </Button>
                  )}
                  {status === 'draft' && (
                    <Button 
                      size="sm" 
                      onClick={handlePublish}
                      className="gap-1"
                    >
                      <Send className="w-3 h-3" />
                      Publish
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="post-title">Title</Label>
                <Input 
                  id="post-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1"
                  placeholder="Enter post title..."
                />
              </div>

              {isNew && (
                <div>
                  <Label htmlFor="target-site">Target WordPress Site</Label>
                  <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a WordPress site" />
                    </SelectTrigger>
                    <SelectContent>
                      {sites.map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                          {site.name} ({site.url})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {!isNew && currentSite && (
                <div>
                  <Label htmlFor="current-site">WordPress Site</Label>
                  <Input 
                    id="current-site"
                    value={`${currentSite.name} (${currentSite.url})`}
                    disabled
                    className="mt-1"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="post-status">Status</Label>
                  <Select value={status} onValueChange={(value: 'draft' | 'generating' | 'scheduled' | 'published' | 'failed') => setStatus(value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input 
                    id="category"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="mt-1"
                    placeholder="e.g., Technology, Reviews"
                  />
                </div>
              </div>

              {status === 'scheduled' && (
                <div>
                  <Label>Scheduled Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1",
                          !scheduledFor && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {scheduledFor ? format(scheduledFor, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={scheduledFor}
                        onSelect={setScheduledFor}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              <div>
                <Label htmlFor="campaign">Campaign (Optional)</Label>
                <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a campaign (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Campaign</SelectItem>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="post-content">Content</Label>
                <Textarea 
                  id="post-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="mt-1 min-h-[300px]"
                  placeholder="Write your post content here..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {content.split(' ').filter(word => word.length > 0).length} words
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input 
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add tags..."
                  className="flex-1"
                />
                <Button onClick={handleAddTag} size="sm" disabled={!tagsInput.trim()}>
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            {!isNew && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete Post
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Post</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the post.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            
            <div className="flex gap-3 ml-auto">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" />
                {isNew ? 'Create Post' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};