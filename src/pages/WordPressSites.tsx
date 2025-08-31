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

const WordPressSites = () => {
  const [selectedTab, setSelectedTab] = useState("sites");
  const [sites] = useState([
    {
      id: 1,
      name: "TechBlog.com",
      url: "https://techblog.com",
      status: "connected",
      lastSync: "2 hours ago",
      posts: 247,
      categories: 12
    },
    {
      id: 2,
      name: "LifestyleMag.net",
      url: "https://lifestylemag.net",
      status: "connected",
      lastSync: "5 minutes ago", 
      posts: 89,
      categories: 8
    },
    {
      id: 3,
      name: "BusinessHub.co",
      url: "https://businesshub.co",
      status: "error",
      lastSync: "2 days ago",
      posts: 156,
      categories: 15
    }
  ]);

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
            
            <Dialog>
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
                    <Label htmlFor="site-url">Site URL</Label>
                    <Input 
                      id="site-url" 
                      placeholder="https://your-wordpress-site.com" 
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="auth-type">Authentication Method</Label>
                    <Select>
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
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password/Token</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="Application password or token" 
                      className="mt-1"
                    />
                  </div>
                  <Button variant="gradient" className="w-full">
                    Test Connection & Connect
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

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
                      <div className="text-2xl font-bold text-primary">{site.posts}</div>
                      <div className="text-sm text-muted-foreground">Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{site.categories}</div>
                      <div className="text-sm text-muted-foreground">Categories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">Last Sync</div>
                      <div className="text-sm text-muted-foreground">{site.lastSync}</div>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Settings className="w-4 h-4" />
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default WordPressSites;