import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useContentAnalysis, ContentAnalysis } from '@/hooks/useContentAnalysis';
import { 
  BarChart3, 
  Target, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  RefreshCw,
  TrendingUp
} from 'lucide-react';

interface ContentAnalysisPanelProps {
  content: string;
  targetKeyword: string;
  seoTitle?: string;
  metaDescription?: string;
  onAnalysisUpdate?: (analysis: ContentAnalysis) => void;
}

export const ContentAnalysisPanel: React.FC<ContentAnalysisPanelProps> = ({
  content,
  targetKeyword,
  seoTitle,
  metaDescription,
  onAnalysisUpdate
}) => {
  const { analyzeContent, analyzing } = useContentAnalysis();
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [lastAnalyzed, setLastAnalyzed] = useState<string>('');

  const performAnalysis = async () => {
    if (!content.trim() || !targetKeyword.trim()) return;

    try {
      const result = await analyzeContent(content, targetKeyword, seoTitle, metaDescription);
      setAnalysis(result);
      setLastAnalyzed(new Date().toISOString());
      
      if (onAnalysisUpdate) {
        onAnalysisUpdate(result);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  // Auto-analyze when content changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      performAnalysis();
    }, 1000);

    return () => clearTimeout(timer);
  }, [content, targetKeyword, seoTitle, metaDescription]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return CheckCircle;
    if (score >= 60) return AlertCircle;
    return XCircle;
  };

  const getReadabilityColor = (score: number) => {
    // Flesch-Kincaid: 60-80 is ideal for most audiences
    if (score >= 60 && score <= 80) return 'text-green-600';
    if (score >= 50 && score <= 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!content.trim() || !targetKeyword.trim()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Content Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Add content and target keyword to analyze</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Content Analysis
          </CardTitle>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={performAnalysis}
            disabled={analyzing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${analyzing ? 'animate-spin' : ''}`} />
            {analyzing ? 'Analyzing...' : 'Refresh'}
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {analysis && (
            <>
              {/* Overall Score */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 mb-2">
                  {React.createElement(getScoreIcon(analysis.quality.overallScore), {
                    className: `w-6 h-6 ${getScoreColor(analysis.quality.overallScore)}`
                  })}
                  <span className={`text-2xl font-bold ${getScoreColor(analysis.quality.overallScore)}`}>
                    {analysis.quality.overallScore}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Overall Content Score</p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold">{analysis.quality.wordCount}</div>
                  <div className="text-sm text-muted-foreground">Words</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold flex items-center justify-center gap-1">
                    <Clock className="w-4 h-4" />
                    {analysis.readability.readingTime}m
                  </div>
                  <div className="text-sm text-muted-foreground">Reading Time</div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {analysis && (
        <>
          {/* Readability */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Readability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Flesch-Kincaid Score</span>
                <span className={`font-semibold ${getReadabilityColor(analysis.readability.fleschKincaid)}`}>
                  {analysis.readability.fleschKincaid}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Grade Level</span>
                <Badge variant="secondary">{analysis.readability.gradeLevel}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* SEO Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4" />
                SEO Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Title Optimization</span>
                  <span className={`font-semibold ${getScoreColor(analysis.seo.titleOptimization)}`}>
                    {analysis.seo.titleOptimization}%
                  </span>
                </div>
                <Progress value={analysis.seo.titleOptimization} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Meta Description</span>
                  <span className={`font-semibold ${getScoreColor(analysis.seo.metaOptimization)}`}>
                    {analysis.seo.metaOptimization}%
                  </span>
                </div>
                <Progress value={analysis.seo.metaOptimization} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Heading Structure</span>
                  <span className={`font-semibold ${getScoreColor(analysis.seo.headingStructure)}`}>
                    {analysis.seo.headingStructure}%
                  </span>
                </div>
                <Progress value={analysis.seo.headingStructure} className="h-2" />
              </div>

              {/* Keyword Density */}
              <div className="pt-2 border-t">
                <div className="text-sm font-medium mb-2">Keyword Density</div>
                {Object.entries(analysis.seo.keywordDensity).map(([keyword, density]) => (
                  <div key={keyword} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{keyword}</span>
                    <Badge variant={density >= 1 && density <= 3 ? "default" : "secondary"}>
                      {density}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quality Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Quality Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold">{analysis.quality.sentenceCount}</div>
                  <div className="text-sm text-muted-foreground">Sentences</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{analysis.quality.paragraphCount}</div>
                  <div className="text-sm text-muted-foreground">Paragraphs</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm">Citations</span>
                <Badge variant={analysis.quality.citationCount >= 3 ? "default" : "secondary"}>
                  {analysis.quality.citationCount}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Suggestions */}
          {analysis.suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Optimization Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.suggestions.map((suggestion, index) => (
                    <Alert key={index}>
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription className="text-sm">
                        {suggestion}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {lastAnalyzed && (
            <div className="text-xs text-muted-foreground text-center">
              Last analyzed: {new Date(lastAnalyzed).toLocaleTimeString()}
            </div>
          )}
        </>
      )}
    </div>
  );
};