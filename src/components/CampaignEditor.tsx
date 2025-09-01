import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Campaign } from "@/hooks/useCampaigns";
import { useWordPressSites } from "@/hooks/useWordPressSites";
import { useToast } from "@/hooks/use-toast";
import { useCampaignSchedule } from "@/hooks/useCampaignSchedule";
import { Save, Play, Pause, Trash2, Calendar as CalendarIcon, Clock, List } from "lucide-react";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";

interface CampaignEditorProps {
  campaign: Campaign;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (campaignData: Partial<Campaign>) => Promise<void>;
  onDelete?: (campaignId: string) => Promise<void>;
}

export const CampaignEditor = ({ 
  campaign, 
  isOpen, 
  onClose, 
  onUpdate,
  onDelete 
}: CampaignEditorProps) => {
  const [name, setName] = useState(campaign.name);
  const [globalPrompt, setGlobalPrompt] = useState(campaign.global_prompt);
  const [thumbnailPrompt, setThumbnailPrompt] = useState(campaign.thumbnail_prompt || "");
  const [postType, setPostType] = useState(campaign.post_type);
  const [targetCategories, setTargetCategories] = useState<string[]>(campaign.target_categories);
  const [status, setStatus] = useState(campaign.status);
  const [schedulingEnabled, setSchedulingEnabled] = useState(campaign?.scheduling_config?.enabled || false);
  const [schedulingFrequency, setSchedulingFrequency] = useState(campaign?.scheduling_config?.frequency || 'daily');
  
  // New duration fields
  const [startDate, setStartDate] = useState<Date | undefined>(
    campaign.start_date ? new Date(campaign.start_date) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    campaign.end_date ? new Date(campaign.end_date) : undefined
  );
  const [totalPosts, setTotalPosts] = useState(campaign.total_posts || 0);
  const [postsPerPeriod, setPostsPerPeriod] = useState(campaign.posts_per_period || 1);
  
  const { sites } = useWordPressSites();
  const { toast } = useToast();
  const { schedules, generateSchedule, clearCampaignSchedule, loading: schedulesLoading } = useCampaignSchedule(campaign.id);

  const handleSave = async () => {
    if (!onUpdate) return;
    
    try {
      await onUpdate({
        name,
        global_prompt: globalPrompt,
        thumbnail_prompt: thumbnailPrompt || null,
        post_type: postType,
        target_categories: targetCategories,
        status,
        start_date: startDate?.toISOString() || null,
        end_date: endDate?.toISOString() || null,
        total_posts: totalPosts,
        posts_per_period: postsPerPeriod,
        scheduling_config: {
          enabled: schedulingEnabled,
          frequency: schedulingFrequency,
          lastRun: campaign?.scheduling_config?.lastRun
        }
      });
      
      toast({
        title: "Campaign Updated",
        description: "Your campaign has been successfully updated.",
      });
      
      onClose();
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleGenerateSchedule = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Missing Dates",
        description: "Please select both start and end dates.",
        variant: "destructive"
      });
      return;
    }

    if (endDate <= startDate) {
      toast({
        title: "Invalid Date Range",
        description: "End date must be after start date.",
        variant: "destructive"
      });
      return;
    }

    try {
      const postsGenerated = await generateSchedule(campaign.id, {
        startDate,
        endDate,
        frequency: schedulingFrequency as 'hourly' | 'daily' | 'weekly',
        postsPerPeriod
      });
      
      toast({
        title: "Schedule Generated",
        description: `Generated ${postsGenerated} scheduled posts.`,
      });
    } catch (error: any) {
      toast({
        title: "Schedule Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleClearSchedule = async () => {
    if (window.confirm("Are you sure you want to clear all scheduled posts for this campaign?")) {
      try {
        await clearCampaignSchedule(campaign.id);
        toast({
          title: "Schedule Cleared",
          description: "All scheduled posts have been removed.",
        });
      } catch (error: any) {
        toast({
          title: "Clear Failed",
          description: error.message,
          variant: "destructive"
        });
      }
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus as Campaign['status']);
    
    if (!onUpdate) return;
    
    try {
      await onUpdate({ status: newStatus as Campaign['status'] });
      toast({
        title: "Status Updated",
        description: `Campaign is now ${newStatus}.`,
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    if (window.confirm("Are you sure you want to delete this campaign? This action cannot be undone.")) {
      try {
        await onDelete(campaign.id);
        toast({
          title: "Campaign Deleted",
          description: "The campaign has been successfully deleted.",
        });
        onClose();
      } catch (error: any) {
        toast({
          title: "Delete Failed",
          description: error.message,
          variant: "destructive"
        });
      }
    }
  };

  const currentSite = sites.find(site => site.id === campaign.site_id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Campaign</DialogTitle>
          <DialogDescription>
            Modify your campaign settings and content generation prompts.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Campaign Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Campaign Status</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <Badge variant={status === 'active' ? 'default' : status === 'paused' ? 'secondary' : 'outline'}>
                {status}
              </Badge>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant={status === 'active' ? 'secondary' : 'default'}
                  onClick={() => handleStatusChange('active')}
                  className="gap-1"
                >
                  <Play className="w-3 h-3" />
                  Activate
                </Button>
                <Button 
                  size="sm" 
                  variant={status === 'paused' ? 'secondary' : 'outline'}
                  onClick={() => handleStatusChange('paused')}
                  className="gap-1"
                >
                  <Pause className="w-3 h-3" />
                  Pause
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Basic Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="campaign-name">Campaign Name</Label>
                <Input 
                  id="campaign-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="target-site">Target WordPress Site</Label>
                <Input 
                  id="target-site"
                  value={currentSite ? `${currentSite.name} (${currentSite.url})` : 'Unknown Site'}
                  disabled
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="post-type">Post Type</Label>
                <Select value={postType} onValueChange={setPostType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="post">Post</SelectItem>
                    <SelectItem value="page">Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Content Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Content Generation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="global-prompt">Global Content Prompt</Label>
                <Textarea 
                  id="global-prompt"
                  value={globalPrompt}
                  onChange={(e) => setGlobalPrompt(e.target.value)}
                  className="mt-1"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="thumbnail-prompt">Thumbnail Generation Prompt (Optional)</Label>
                <Textarea 
                  id="thumbnail-prompt"
                  value={thumbnailPrompt}
                  onChange={(e) => setThumbnailPrompt(e.target.value)}
                  className="mt-1"
                  rows={3}
                  placeholder="Describe the style and content for generated thumbnails..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Duration Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Campaign Duration</CardTitle>
              <CardDescription>Set the timeframe for this campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        disabled={(date) => startDate ? date < startDate : date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="posts-per-period">Posts per Period</Label>
                  <Input 
                    id="posts-per-period"
                    type="number"
                    min="1"
                    max="10"
                    value={postsPerPeriod}
                    onChange={(e) => setPostsPerPeriod(parseInt(e.target.value) || 1)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select value={schedulingFrequency} onValueChange={(value: any) => setSchedulingFrequency(value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Every Hour</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="scheduling-enabled"
                  checked={schedulingEnabled}
                  onChange={(e) => setSchedulingEnabled(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="scheduling-enabled">Enable automatic posting</Label>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <List className="w-4 h-4" />
                Schedule Management
              </CardTitle>
              <CardDescription>Generate and manage your campaign schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  onClick={handleGenerateSchedule}
                  disabled={!startDate || !endDate || schedulesLoading}
                  className="flex-1"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Generate Schedule
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleClearSchedule}
                  disabled={schedules.length === 0 || schedulesLoading}
                >
                  Clear Schedule
                </Button>
              </div>
              
              {schedules.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    {schedules.length} posts scheduled
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {schedules.slice(0, 5).map((schedule, index) => (
                      <div key={schedule.id} className="text-xs p-2 bg-accent rounded flex justify-between">
                        <span>Post #{index + 1}</span>
                        <span>{format(new Date(schedule.scheduled_for), "MMM dd, HH:mm")}</span>
                      </div>
                    ))}
                    {schedules.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center">
                        ...and {schedules.length - 5} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {campaign?.scheduling_config?.lastRun && (
                <p className="text-sm text-muted-foreground">
                  Last run: {new Date(campaign.scheduling_config.lastRun).toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Campaign
            </Button>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};