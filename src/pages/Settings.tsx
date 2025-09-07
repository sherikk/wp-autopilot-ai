import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Key, Bell, Palette, Globe, CreditCard, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSettings, UserSettings } from "@/hooks/useSettings";

const Settings = () => {
  const { toast } = useToast();
  const { settings, loading, updateMultipleSettings } = useSettings();
  
  // Local state for form inputs
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);

  // Update local settings when global settings change
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async (section: string, sectionSettings: Partial<UserSettings>) => {
    try {
      await updateMultipleSettings(sectionSettings);
      toast({
        title: "Settings Saved",
        description: `${section} settings have been updated successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Account Deletion Requested",
      description: "Your account deletion request has been submitted. You'll receive a confirmation email.",
      variant: "destructive"
    });
  };

  if (loading) {
    return (
      <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
              <p className="text-muted-foreground">Loading your settings...</p>
            </div>
          </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage your account and application preferences</p>
          </div>

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="ai">AI & Content</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="limits">Rate Limits</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card className="shadow-elegant border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    General Settings
                  </CardTitle>
                  <CardDescription>Basic application preferences and regional settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company">Company/Organization Name</Label>
                      <Input 
                        id="company"
                        value={localSettings.companyName}
                        onChange={(e) => setLocalSettings({...localSettings, companyName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select value={localSettings.timezone} onValueChange={(value) => setLocalSettings({...localSettings, timezone: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC-8">Pacific Time (UTC-8)</SelectItem>
                          <SelectItem value="UTC-7">Mountain Time (UTC-7)</SelectItem>
                          <SelectItem value="UTC-6">Central Time (UTC-6)</SelectItem>
                          <SelectItem value="UTC-5">Eastern Time (UTC-5)</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select value={localSettings.language} onValueChange={(value) => setLocalSettings({...localSettings, language: value})}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={() => handleSave("General", {
                      companyName: localSettings.companyName,
                      timezone: localSettings.timezone,
                      language: localSettings.language
                    })}
                  >
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="space-y-6">
              <Card className="shadow-elegant border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    AI & Content Defaults
                  </CardTitle>
                  <CardDescription>Configure default AI behavior and content generation settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ai-provider">AI Provider</Label>
                      <Select value={localSettings.aiProvider} onValueChange={(value) => setLocalSettings({...localSettings, aiProvider: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI GPT-4</SelectItem>
                          <SelectItem value="claude">Anthropic Claude</SelectItem>
                          <SelectItem value="gemini">Google Gemini</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="tone">Default Tone</Label>
                      <Select value={localSettings.defaultTone} onValueChange={(value) => setLocalSettings({...localSettings, defaultTone: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="formal">Formal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="word-count">Default Word Count Range</Label>
                      <Select value={localSettings.defaultWordCount} onValueChange={(value) => setLocalSettings({...localSettings, defaultWordCount: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="500-800">Short (500-800 words)</SelectItem>
                          <SelectItem value="1000-1500">Medium (1000-1500 words)</SelectItem>
                          <SelectItem value="2000-3000">Long (2000-3000 words)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="thumbnail-style">Thumbnail Style</Label>
                      <Select value={localSettings.thumbnailStyle} onValueChange={(value) => setLocalSettings({...localSettings, thumbnailStyle: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="modern">Modern</SelectItem>
                          <SelectItem value="minimalist">Minimalist</SelectItem>
                          <SelectItem value="vibrant">Vibrant</SelectItem>
                          <SelectItem value="corporate">Corporate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleSave("AI & Content", {
                      aiProvider: localSettings.aiProvider,
                      defaultTone: localSettings.defaultTone,
                      defaultWordCount: localSettings.defaultWordCount,
                      thumbnailStyle: localSettings.thumbnailStyle
                    })}
                  >
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card className="shadow-elegant border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>Choose what notifications you'd like to receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-muted-foreground">Receive email updates about your account activity</p>
                    </div>
                    <Switch 
                      checked={localSettings.emailNotifications}
                      onCheckedChange={(checked) => setLocalSettings({...localSettings, emailNotifications: checked})}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Campaign Updates</h4>
                      <p className="text-sm text-muted-foreground">Get notified when campaigns complete or fail</p>
                    </div>
                    <Switch 
                      checked={localSettings.campaignUpdates}
                      onCheckedChange={(checked) => setLocalSettings({...localSettings, campaignUpdates: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Error Alerts</h4>
                      <p className="text-sm text-muted-foreground">Immediate notifications for critical errors</p>
                    </div>
                    <Switch 
                      checked={localSettings.errorAlerts}
                      onCheckedChange={(checked) => setLocalSettings({...localSettings, errorAlerts: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Weekly Reports</h4>
                      <p className="text-sm text-muted-foreground">Summary of your weekly activity and performance</p>
                    </div>
                    <Switch 
                      checked={localSettings.weeklyReports}
                      onCheckedChange={(checked) => setLocalSettings({...localSettings, weeklyReports: checked})}
                    />
                  </div>
                  <Button 
                    onClick={() => handleSave("Notifications", {
                      emailNotifications: localSettings.emailNotifications,
                      campaignUpdates: localSettings.campaignUpdates,
                      errorAlerts: localSettings.errorAlerts,
                      weeklyReports: localSettings.weeklyReports
                    })}
                  >
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="limits" className="space-y-6">
              <Card className="shadow-elegant border-0">
                <CardHeader>
                  <CardTitle>Rate Limits & Performance</CardTitle>
                  <CardDescription>Configure rate limiting to protect your WordPress sites</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="max-posts">Max Posts Per Day (per site)</Label>
                      <Input 
                        id="max-posts"
                        type="number"
                        value={localSettings.maxPostsPerDay}
                        onChange={(e) => setLocalSettings({...localSettings, maxPostsPerDay: e.target.value})}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Prevents spam and respects hosting limits</p>
                    </div>
                    <div>
                      <Label htmlFor="delay">Request Delay (ms)</Label>
                      <Input 
                        id="delay"
                        type="number"
                        value={localSettings.requestDelay}
                        onChange={(e) => setLocalSettings({...localSettings, requestDelay: e.target.value})}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Delay between API requests</p>
                    </div>
                    <div>
                      <Label htmlFor="concurrency">Max Concurrent Jobs</Label>
                      <Input 
                        id="concurrency"
                        type="number"
                        value={localSettings.maxConcurrency}
                        onChange={(e) => setLocalSettings({...localSettings, maxConcurrency: e.target.value})}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Parallel processing limit</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleSave("Rate Limits", {
                      maxPostsPerDay: localSettings.maxPostsPerDay,
                      requestDelay: localSettings.requestDelay,
                      maxConcurrency: localSettings.maxConcurrency
                    })}
                  >
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account" className="space-y-6">
              <Card className="shadow-elegant border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Account Information
                  </CardTitle>
                  <CardDescription>Manage your account details and subscription</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <h4 className="font-medium">Current Plan</h4>
                      <p className="text-sm text-muted-foreground">Professional Plan</p>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Account Email</Label>
                      <Input value="sarah@wpgenie.com" disabled />
                    </div>
                    <div>
                      <Label>Member Since</Label>
                      <Input value="December 1, 2023" disabled />
                    </div>
                  </div>
                  <Button variant="outline">Manage Subscription</Button>
                </CardContent>
              </Card>

              <Card className="shadow-elegant border-0 border-destructive/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <Trash2 className="w-5 h-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>Irreversible actions that will affect your account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                    <h4 className="font-medium text-destructive mb-2">Delete Account</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      This will permanently delete your account, all connected sites, campaigns, and generated content. This action cannot be undone.
                    </p>
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteAccount}
                    >
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
    </main>
  );
};

export default Settings;