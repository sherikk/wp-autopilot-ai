import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Globe, MoreVertical, Plus, Settings, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWordPressSites } from "@/hooks/useWordPressSites";

const WordPressSites = () => {
  const [selectedTab, setSelectedTab] = useState("sites");
  const { toast } = useToast();
  const [siteUrl, setSiteUrl] = useState("");
  const [siteName, setSiteName] = useState("");
  const [authType, setAuthType] = useState<"app-password" | "bearer">("app-password");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { sites, loading, addSite } = useWordPressSites();

  const handleConnect = async () => {
    if (!siteUrl || !siteName || !authType || !username || !password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    try {
      await addSite({
        name: siteName,
        url: siteUrl,
        authType,
        username,
        password
      });
      
      toast({
        title: "Connection Successful!",
        description: `Successfully connected to ${siteName}`,
      });
      
      // Reset form
      setSiteUrl("");
      setSiteName("");
      setAuthType("app-password");
      setUsername("");
      setPassword("");
      setDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-subtle">
      <Sidebar selectedTab={selectedTab} onTabChange={setSelectedTab} />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">WordPress Sites</h1>
              <p className="text-muted-foreground">Manage your connected WordPress installations</p>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient" size="lg" className="gap-2">
                  <Plus className="w-5 h-5" />
                  Connect Site
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Connect WordPress Site</DialogTitle>
                  <DialogDescription>
                    Enter your WordPress site details to connect it with WP Genie.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="site-name">Site Name</Label>
                    <Input 
                      id="site-name" 
                      placeholder="My WordPress Site" 
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="site-url">Site URL</Label>
                    <Input 
                      id="site-url" 
                      placeholder="https://your-wordpress-site.com" 
                      value={siteUrl}
                      onChange={(e) => setSiteUrl(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="auth-type">Authentication Method</Label>
                    <Select value={authType} onValueChange={(value: "app-password" | "bearer") => setAuthType(value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select authentication method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="app-password">Application Password</SelectItem>
                        <SelectItem value="bearer">Bearer Token</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username" 
                      placeholder="WordPress username" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password/Token</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="Application password or token" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    variant="gradient" 
                    className="w-full"
                    onClick={handleConnect}
                    disabled={isConnecting}
                  >
                    {isConnecting ? "Connecting..." : "Test Connection & Connect"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading sites...</p>
            </div>
          ) : sites.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No WordPress sites connected</h3>
              <p className="text-muted-foreground mb-4">Connect your first WordPress site to get started</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {sites.map((site) => (
                <Card key={site.id} className="shadow-elegant border-0">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                        <Globe className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{site.name}</CardTitle>
                        <CardDescription>{site.url}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge 
                        variant={site.status === "connected" ? "default" : "destructive"}
                        className="gap-1"
                      >
                        {site.status === "connected" ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {site.status}
                      </Badge>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{site.posts_count}</div>
                        <div className="text-sm text-muted-foreground">Posts</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{site.categories_count}</div>
                        <div className="text-sm text-muted-foreground">Categories</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">Last Sync</div>
                        <div className="text-sm text-muted-foreground">
                          {site.last_sync ? new Date(site.last_sync).toLocaleString() : "Never"}
                        </div>
                      </div>
                    </div>
                    {site.error_message && (
                      <div className="mt-4 p-3 bg-destructive/10 rounded-lg">
                        <p className="text-sm text-destructive">{site.error_message}</p>
                      </div>
                    )}
                    <div className="flex justify-end mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => toast({
                          title: "Configuration",
                          description: "Site configuration panel opened.",
                        })}
                      >
                        <Settings className="w-4 h-4" />
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default WordPressSites;