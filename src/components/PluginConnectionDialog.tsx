import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useWordPressSites } from '@/hooks/useWordPressSites';
import { Loader2, Download, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PluginConnectionDialogProps {
  children: React.ReactNode;
}

export function PluginConnectionDialog({ children }: PluginConnectionDialogProps) {
  const [open, setOpen] = useState(false);
  const [siteUrl, setSiteUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const { connectViaPlugin } = useWordPressSites();
  const { toast } = useToast();

  const handleConnect = async () => {
    if (!siteUrl || !apiKey) {
      toast({
        title: "Missing Information",
        description: "Please enter both site URL and API key",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await connectViaPlugin(siteUrl, apiKey);
      toast({
        title: "Success",
        description: "WordPress site connected successfully!",
      });
      setOpen(false);
      setSiteUrl('');
      setApiKey('');
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadPlugin = () => {
    const pluginContent = `<?php /* Plugin content would go here */`;
    const blob = new Blob([pluginContent], { type: 'application/x-php' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = '/wp-genie-plugin.php';
    a.download = 'wp-genie-plugin.php';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Connect via WordPress Plugin</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Download className="h-5 w-5" />
                Step 1: Install Plugin
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Download and install the WP Genie plugin on your WordPress site.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={downloadPlugin}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Plugin
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => window.open('/wp-genie-plugin-guide.md', '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                  Installation Guide
                </Button>
              </div>
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p><strong>Quick Install:</strong></p>
                <ol className="list-decimal list-inside space-y-1 mt-2 text-muted-foreground">
                  <li>Upload wp-genie-plugin.php to your /wp-content/plugins/ folder</li>
                  <li>Activate the plugin in WordPress Admin → Plugins</li>
                  <li>Go to Settings → WP Genie to get your API key</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ExternalLink className="h-5 w-5" />
                Step 2: Connect Site
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site-url">WordPress Site URL</Label>
                <Input
                  id="site-url"
                  type="url"
                  placeholder="https://yoursite.com"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="api-key">Site API Key</Label>
                <Input
                  id="api-key"
                  type="text"
                  placeholder="Get this from Settings → WP Genie in your WordPress admin"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Copy the API key from the WP Genie settings page in your WordPress admin area.
                </p>
              </div>
              
              <Button 
                onClick={handleConnect} 
                disabled={loading || !siteUrl || !apiKey}
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Connect WordPress Site
              </Button>
            </CardContent>
          </Card>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Why use the plugin?</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• <strong>Easy setup:</strong> No complex authentication needed</li>
              <li>• <strong>Secure:</strong> Uses encrypted API keys instead of passwords</li>
              <li>• <strong>Reliable:</strong> Direct WordPress REST API integration</li>
              <li>• <strong>Real-time:</strong> Instant connection testing and status updates</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}