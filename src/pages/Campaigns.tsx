import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, FileText, Globe, MoreVertical, Pause, Play, Plus, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCampaigns, Campaign } from "@/hooks/useCampaigns";
import { useWordPressSites } from "@/hooks/useWordPressSites";
import { CampaignEditor } from "@/components/CampaignEditor";
import { useCampaignScheduler } from "@/hooks/useCampaignScheduler";

const Campaigns = () => {
  const { toast } = useToast();
  const [campaignName, setCampaignName] = useState("");
  const [selectedSite, setSelectedSite] = useState("");
  const [globalPrompt, setGlobalPrompt] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  
  const { campaigns, loading: campaignsLoading, createCampaign, updateCampaign, deleteCampaign } = useCampaigns();
  const { sites } = useWordPressSites();
  const { generateContent, runScheduler, isGenerating } = useCampaignScheduler();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "paused": return "secondary"; 
      case "draft": return "outline";
      default: return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return Play;
      case "paused": return Pause;
      case "draft": return FileText;
      default: return FileText;
    }
  };

  return (
    <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Campaigns</h1>
              <p className="text-muted-foreground">Manage your content automation campaigns</p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={runScheduler} 
                variant="outline"
                disabled={isGenerating}
                className="gap-2"
              >
                <Clock className="w-4 h-4" />
                {isGenerating ? 'Running...' : 'Run Scheduler'}
              </Button>
              
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient" size="lg" className="gap-2">
                  <Plus className="w-5 h-5" />
                  Create Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Campaign</DialogTitle>
                  <DialogDescription>
                    Set up a new AI content generation campaign for your WordPress site.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="campaign-name">Campaign Name</Label>
                    <Input 
                      id="campaign-name"
                      placeholder="e.g., Tech Reviews Campaign"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="target-site">Target WordPress Site</Label>
                    <Select value={selectedSite} onValueChange={setSelectedSite}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a connected site" />
                      </SelectTrigger>
                      <SelectContent>
                        {sites.length === 0 ? (
                          <SelectItem value="" disabled>No sites connected</SelectItem>
                        ) : (
                          sites.map((site) => (
                            <SelectItem key={site.id} value={site.id}>
                              {site.name} ({site.url})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="global-prompt">Global Content Prompt</Label>
                    <Textarea 
                      id="global-prompt"
                      placeholder="Write engaging blog posts about [CATEGORY] targeting [AUDIENCE]..."
                      value={globalPrompt}
                      onChange={(e) => setGlobalPrompt(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    variant="gradient" 
                    className="w-full"
                    onClick={async () => {
                      if (!campaignName || !selectedSite || !globalPrompt) {
                        toast({
                          title: "Missing Information",
                          description: "Please fill in all required fields.",
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      if (sites.length === 0) {
                        toast({
                          title: "No Sites Available",
                          description: "Please connect a WordPress site first.",
                          variant: "destructive"
                        });
                        return;
                      }

                      try {
                        await createCampaign({
                          name: campaignName,
                          siteId: selectedSite,
                          postType: 'post',
                          globalPrompt,
                          targetCategories: []
                        });
                        
                        toast({
                          title: "Campaign Created!",
                          description: `"${campaignName}" has been created successfully.`,
                        });
                        
                        setCampaignName("");
                        setSelectedSite("");
                        setGlobalPrompt("");
                        setDialogOpen(false);
                      } catch (error: any) {
                        toast({
                          title: "Creation Failed",
                          description: error.message,
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    Create Campaign
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          {campaignsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading campaigns...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground mb-4">Create your first campaign to start automating content</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {campaigns.map((campaign) => {
                const StatusIcon = getStatusIcon(campaign.status);
                const siteName = campaign.wordpress_sites?.name || 'Unknown Site';
                
                return (
                  <Card key={campaign.id} className="shadow-elegant border-0">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                          <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{campaign.name}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Globe className="w-4 h-4" />
                            {siteName}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={getStatusColor(campaign.status)}
                            className="gap-1"
                          >
                            <StatusIcon className="w-3 h-3" />
                            {campaign.status}
                          </Badge>
                          {campaign.scheduling_config?.enabled && (
                            <Badge variant="secondary" className="text-xs">
                              Auto: {campaign.scheduling_config.frequency}
                            </Badge>
                          )}
                          <Button 
                            onClick={() => generateContent(campaign.id)}
                            disabled={isGenerating}
                            size="sm"
                            variant="outline"
                            className="gap-1"
                          >
                            <Zap className="w-3 h-3" />
                            Generate
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setSelectedCampaign(campaign);
                              setEditorOpen(true);
                            }}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Global Prompt</span>
                        </div>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                          {campaign.global_prompt}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-semibold text-primary">{campaign.post_type}</div>
                          <div className="text-xs text-muted-foreground">Post Type</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-warning">
                            {campaign.target_categories?.length || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">Categories</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-success">
                            {new Date(campaign.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">Created</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          Updated: {new Date(campaign.created_at).toLocaleString()}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {campaign.target_categories?.slice(0, 3).map((category) => (
                            <Badge key={category} variant="outline" className="text-xs">
                              {category}
                            </Badge>
                          ))}
                          {(campaign.target_categories?.length || 0) > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{(campaign.target_categories?.length || 0) - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Campaign Editor Dialog */}
        {selectedCampaign && (
          <CampaignEditor
            campaign={selectedCampaign}
            isOpen={editorOpen}
            onClose={() => {
              setEditorOpen(false);
              setSelectedCampaign(null);
            }}
            onUpdate={async (updates) => {
              await updateCampaign(selectedCampaign.id, updates);
            }}
            onDelete={async (campaignId) => {
              await deleteCampaign(campaignId);
            }}
          />
        )}
    </main>
  );
};

export default Campaigns;