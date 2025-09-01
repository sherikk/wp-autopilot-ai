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
import { Save, Trash2, CalendarIcon, Send, Eye, Globe, ImageIcon, Wand2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

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
  const [thumbnailUrl, setThumbnailUrl] = useState(post?.featured_image_url || '');
  const [thumbnailPrompt, setThumbnailPrompt] = useState('');
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  
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
      setThumbnailUrl(post.featured_image_url || '');
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
        featured_image_url: thumbnailUrl || null,
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

  const handleGenerateThumbnail = async () => {
    if (!title.trim() && !thumbnailPrompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a title or custom thumbnail prompt.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingThumbnail(true);
    
    try {
      const prompt = thumbnailPrompt.trim() || `Generate a professional thumbnail image for this blog post: "${title}"`;
      
      const response = await supabase.functions.invoke('generate-thumbnail', {
        body: { 
          prompt: thumbnailPrompt.trim() || null,
          title: title.trim()
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate thumbnail');
      }

      if (response.data?.image) {
        setThumbnailUrl(response.data.image);
        
        toast({
          title: "Thumbnail Generated",
          description: "AI thumbnail has been generated successfully!",
        });
      } else {
        throw new Error('No image data received');
      }
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate thumbnail",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingThumbnail(false);
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

          {/* Thumbnail */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Thumbnail
              </CardTitle>
              <CardDescription>
                Add a featured image for your post
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="thumbnail-url">Thumbnail URL</Label>
                <Input 
                  id="thumbnail-url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  className="mt-1"
                  placeholder="Enter image URL or generate with AI..."
                />
              </div>

              {thumbnailUrl && (
                <div>
                  <Label>Preview</Label>
                  <div className="mt-1 border border-border rounded-lg overflow-hidden w-full max-w-xs">
                    <img 
                      src={thumbnailUrl} 
                      alt="Thumbnail preview" 
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="border-t border-border pt-4">
                <Label htmlFor="thumbnail-prompt">AI Thumbnail Generation</Label>
                <div className="flex gap-2 mt-1">
                  <Input 
                    id="thumbnail-prompt"
                    value={thumbnailPrompt}
                    onChange={(e) => setThumbnailPrompt(e.target.value)}
                    placeholder="Describe the thumbnail image (optional - will use post title if empty)"
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleGenerateThumbnail} 
                    size="sm" 
                    disabled={isGeneratingThumbnail || (!title.trim() && !thumbnailPrompt.trim())}
                    className="gap-1 shrink-0"
                  >
                    <Wand2 className="w-3 h-3" />
                    {isGeneratingThumbnail ? 'Generating...' : 'Generate AI'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Generate a professional thumbnail using AI based on your post title or custom prompt
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