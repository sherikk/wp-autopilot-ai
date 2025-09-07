import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useMediaAssets, MediaAsset } from '@/hooks/useMediaAssets';
import { ImageIcon, Plus, Trash2, Eye, Download } from 'lucide-react';
import { toast } from 'sonner';

interface MediaGalleryProps {
  topicId?: string;
  onImageSelect?: (imageUrl: string) => void;
  showAddButton?: boolean;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  topicId,
  onImageSelect,
  showAddButton = true
}) => {
  const { mediaAssets, loading, fetchMediaAssets, generateImage, deleteMediaAsset } = useMediaAssets();
  const [isGenerating, setIsGenerating] = useState(false);
  const [newImagePrompt, setNewImagePrompt] = useState('');
  const [newImageKind, setNewImageKind] = useState<MediaAsset['kind']>('featured');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Filter assets by topic if topicId is provided
  const filteredAssets = topicId 
    ? mediaAssets.filter(asset => asset.topic_id === topicId)
    : mediaAssets;

  const handleGenerateImage = async () => {
    if (!newImagePrompt.trim() || !topicId) {
      toast.error('Please enter an image prompt');
      return;
    }

    setIsGenerating(true);
    try {
      await generateImage(topicId, newImagePrompt.trim(), newImageKind);
      setNewImagePrompt('');
      setDialogOpen(false);
      await fetchMediaAssets(topicId);
    } catch (error) {
      // Error is already handled in the hook
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageSelect = (imageUrl: string) => {
    if (onImageSelect) {
      onImageSelect(imageUrl);
      toast.success('Image selected');
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      await deleteMediaAsset(assetId);
      await fetchMediaAssets(topicId);
    }
  };

  const getKindColor = (kind: MediaAsset['kind']) => {
    switch (kind) {
      case 'featured': return 'bg-primary';
      case 'thumbnail': return 'bg-secondary';
      case 'social': return 'bg-accent';
      case 'inline': return 'bg-muted';
      default: return 'bg-muted';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading media assets...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Media Gallery
          {filteredAssets.length > 0 && (
            <Badge variant="secondary">{filteredAssets.length}</Badge>
          )}
        </CardTitle>
        
        {showAddButton && topicId && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Generate Image
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate AI Image</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="image-prompt">Image Description</Label>
                  <Textarea
                    id="image-prompt"
                    value={newImagePrompt}
                    onChange={(e) => setNewImagePrompt(e.target.value)}
                    placeholder="Describe the image you want to generate..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="image-kind">Image Type</Label>
                  <Select value={newImageKind} onValueChange={(value: MediaAsset['kind']) => setNewImageKind(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">Featured Image</SelectItem>
                      <SelectItem value="thumbnail">Thumbnail</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="inline">Inline Content</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleGenerateImage} 
                    disabled={isGenerating || !newImagePrompt.trim()}
                  >
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      
      <CardContent>
        {filteredAssets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No images generated yet</p>
            {showAddButton && topicId && (
              <p className="text-sm mt-2">Generate AI images for your content</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssets.map((asset) => (
              <div key={asset.id} className="group relative">
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-video relative">
                    <img 
                      src={asset.url} 
                      alt={asset.prompt}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    
                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {onImageSelect && (
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleImageSelect(asset.url)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Select
                        </Button>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => window.open(asset.url, '_blank')}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDeleteAsset(asset.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge className={getKindColor(asset.kind)} variant="secondary">
                        {asset.kind}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(asset.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {asset.prompt}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};