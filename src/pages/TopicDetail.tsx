import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Eye, FileText, Search, Wand2, Save, ExternalLink } from 'lucide-react';
import { useTopics } from '@/hooks/useTopics';
import { useProjects } from '@/hooks/useProjects';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SourceSnippet {
  id: string;
  title: string;
  url: string;
  snippet: string;
  created_at: string;
}

export default function TopicDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { topics, updateTopic, generateOutline, runResearch } = useTopics();
  const { projects } = useProjects();
  
  const [sourceSnippets, setSourceSnippets] = useState<SourceSnippet[]>([]);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const topic = topics.find(t => t.id === id);
  const project = projects.find(p => p.id === topic?.project_id);
  
  const [editableContent, setEditableContent] = useState({
    seo_title: '',
    meta_description: '',
    slug: '',
    draft_markdown: ''
  });

  useEffect(() => {
    if (topic) {
      setEditableContent({
        seo_title: topic.seo_title || '',
        meta_description: topic.meta_description || '',
        slug: topic.slug || '',
        draft_markdown: topic.draft_markdown || ''
      });
    }
  }, [topic]);

  useEffect(() => {
    if (id) {
      fetchSourceSnippets();
    }
  }, [id]);

  const fetchSourceSnippets = async () => {
    if (!id) return;
    
    const { data, error } = await supabase
      .from('source_snippets')
      .select('*')
      .eq('topic_id', id)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('Error fetching source snippets:', error);
      return;
    }
    
    setSourceSnippets(data || []);
  };

  const handleSave = async () => {
    if (!topic) return;
    
    setIsSaving(true);
    try {
      await updateTopic(topic.id, editableContent);
      toast({
        title: "Saved",
        description: "Topic has been updated successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save topic updates.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDraftSections = async () => {
    if (!topic || !topic.outline_json) return;
    
    setIsDrafting(true);
    try {
      const { data, error } = await supabase.functions.invoke('section-drafter', {
        body: { topicId: topic.id }
      });
      
      if (error) throw error;
      
      toast({
        title: "Drafting Started",
        description: "Section-by-section content generation has begun."
      });
      
      // Refresh topic data after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Error drafting sections:', error);
      toast({
        title: "Error",
        description: "Failed to start content drafting.",
        variant: "destructive"
      });
    } finally {
      setIsDrafting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'idea': 'bg-muted text-muted-foreground',
      'outlined': 'bg-blue-100 text-blue-800',
      'needs_review': 'bg-orange-100 text-orange-800',
      'drafting': 'bg-purple-100 text-purple-800',
      'scheduled': 'bg-yellow-100 text-yellow-800',
      'published': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  if (!topic) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/topics')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Topics
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <p>Topic not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/topics')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Topics
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{topic.target_keyword}</h1>
            <p className="text-muted-foreground">
              {project?.name} • {topic.audience} • {topic.length_words} words
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(topic.status)}>
            {topic.status.replace('_', ' ')}
          </Badge>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Panel - Metadata & Citations */}
        <div className="col-span-3">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-sm">Topic Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Search Intent</Label>
                <p className="text-sm">{topic.search_intent}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Target Audience</Label>
                <p className="text-sm">{topic.audience}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Word Count</Label>
                <p className="text-sm">{topic.length_words} words</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Model</Label>
                <p className="text-sm">{topic.model_name}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Search className="w-4 h-4" />
                Citations ({sourceSnippets.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {sourceSnippets.length > 0 ? (
                  <div className="space-y-3">
                    {sourceSnippets.map((snippet, index) => (
                      <div key={snippet.id} className="border rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Badge variant="outline" className="text-xs">
                            [{index + 1}]
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-medium truncate">
                              {snippet.title}
                            </h4>
                            <a 
                              href={snippet.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {new URL(snippet.url).hostname}
                            </a>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {snippet.snippet}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No sources found.</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Center Panel - Content Editor */}
        <div className="col-span-6">
          <Tabs defaultValue="outline" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="outline">Outline</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="outline" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Content Outline</CardTitle>
                  <div className="flex gap-2">
                    {topic.status === 'idea' && (
                      <Button 
                        onClick={() => generateOutline(topic.id)}
                        size="sm"
                      >
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate Outline
                      </Button>
                    )}
                    {topic.status === 'outlined' && (
                      <Button 
                        onClick={() => runResearch(topic.id)}
                        size="sm"
                      >
                        <Search className="w-4 h-4 mr-2" />
                        Run Research
                      </Button>
                    )}
                    {topic.status === 'needs_review' && (
                      <Button 
                        onClick={handleDraftSections}
                        disabled={isDrafting}
                        size="sm"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        {isDrafting ? 'Drafting...' : 'Draft Sections'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {topic.outline_json ? (
                    <div className="space-y-4">
                      {Object.entries(topic.outline_json as Record<string, any>).map(([key, value]) => (
                        <div key={key} className="border rounded-lg p-4">
                          <h3 className="font-medium mb-2">{key}</h3>
                          {typeof value === 'string' ? (
                            <p className="text-sm text-muted-foreground">{value}</p>
                          ) : Array.isArray(value) ? (
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {value.map((item, index) => (
                                <li key={index} className="ml-4">• {item}</li>
                              ))}
                            </ul>
                          ) : (
                            <pre className="text-xs text-muted-foreground overflow-auto">
                              {JSON.stringify(value, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No outline generated yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="draft" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Content Draft</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={editableContent.draft_markdown}
                    onChange={(e) => setEditableContent(prev => ({ ...prev, draft_markdown: e.target.value }))}
                    placeholder="Content will appear here after drafting sections..."
                    className="min-h-[500px] font-mono text-sm"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    {editableContent.draft_markdown ? (
                      <div dangerouslySetInnerHTML={{ 
                        __html: editableContent.draft_markdown.replace(/\n/g, '<br />') 
                      }} />
                    ) : (
                      <p className="text-muted-foreground">No content to preview yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - SEO & Actions */}
        <div className="col-span-3">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-sm">SEO Optimization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="seo_title" className="text-xs">SEO Title</Label>
                <Input
                  id="seo_title"
                  value={editableContent.seo_title}
                  onChange={(e) => setEditableContent(prev => ({ ...prev, seo_title: e.target.value }))}
                  placeholder="SEO optimized title..."
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {editableContent.seo_title.length}/60 characters
                </p>
              </div>
              
              <div>
                <Label htmlFor="meta_description" className="text-xs">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={editableContent.meta_description}
                  onChange={(e) => setEditableContent(prev => ({ ...prev, meta_description: e.target.value }))}
                  placeholder="Meta description for search results..."
                  className="text-sm h-20"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {editableContent.meta_description.length}/160 characters
                </p>
              </div>
              
              <div>
                <Label htmlFor="slug" className="text-xs">URL Slug</Label>
                <Input
                  id="slug"
                  value={editableContent.slug}
                  onChange={(e) => setEditableContent(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="url-friendly-slug"
                  className="text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quality Checks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Citations</span>
                <Badge variant="outline">{sourceSnippets.length}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Word Count</span>
                <Badge variant="outline">
                  {editableContent.draft_markdown.split(/\s+/).filter(w => w.length > 0).length}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>SEO Title</span>
                <Badge variant={editableContent.seo_title.length > 0 && editableContent.seo_title.length <= 60 ? "default" : "destructive"}>
                  {editableContent.seo_title.length > 0 ? "✓" : "✗"}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Meta Description</span>
                <Badge variant={editableContent.meta_description.length > 0 && editableContent.meta_description.length <= 160 ? "default" : "destructive"}>
                  {editableContent.meta_description.length > 0 ? "✓" : "✗"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}