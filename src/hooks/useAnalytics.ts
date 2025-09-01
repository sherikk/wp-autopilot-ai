import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface PostAnalytics {
  id: string;
  post_id: string;
  date: string;
  views: number;
  clicks: number;
  shares: number;
  comments: number;
  time_on_page: number;
  bounce_rate: number;
}

export interface CampaignAnalytics {
  id: string;
  campaign_id: string;
  date: string;
  posts_created: number;
  posts_published: number;
  total_views: number;
  total_engagement: number;
  avg_time_on_page: number;
}

export interface AnalyticsOverview {
  totalPosts: number;
  totalViews: number;
  totalEngagement: number;
  avgTimeOnPage: number;
  bounceRate: number;
  topPosts: Array<{
    title: string;
    views: number;
    engagement: number;
    site: string;
  }>;
  performanceTrend: Array<{
    date: string;
    views: number;
    engagement: number;
  }>;
}

export const useAnalytics = () => {
  const [postAnalytics, setPostAnalytics] = useState<PostAnalytics[]>([]);
  const [campaignAnalytics, setCampaignAnalytics] = useState<CampaignAnalytics[]>([]);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPostAnalytics = async (dateRange: string = '30d') => {
    if (!user) return;

    try {
      const startDate = getStartDate(dateRange);
      
      const { data, error } = await supabase
        .from('post_analytics')
        .select(`
          *,
          posts (
            title,
            wordpress_sites (name, url)
          )
        `)
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;
      setPostAnalytics(data || []);
    } catch (error) {
      console.error('Error fetching post analytics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch post analytics",
        variant: "destructive",
      });
    }
  };

  const fetchCampaignAnalytics = async (dateRange: string = '30d') => {
    if (!user) return;

    try {
      const startDate = getStartDate(dateRange);
      
      const { data, error } = await supabase
        .from('campaign_analytics')
        .select(`
          *,
          campaigns (name)
        `)
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;
      setCampaignAnalytics(data || []);
    } catch (error) {
      console.error('Error fetching campaign analytics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch campaign analytics",
        variant: "destructive",
      });
    }
  };

  const calculateOverview = () => {
    if (!postAnalytics.length) {
      setOverview(null);
      return;
    }

    const totalViews = postAnalytics.reduce((sum, pa) => sum + pa.views, 0);
    const totalEngagement = postAnalytics.reduce((sum, pa) => sum + pa.clicks + pa.shares + pa.comments, 0);
    const avgTimeOnPage = postAnalytics.reduce((sum, pa) => sum + pa.time_on_page, 0) / postAnalytics.length;
    const bounceRate = postAnalytics.reduce((sum, pa) => sum + pa.bounce_rate, 0) / postAnalytics.length;

    // Get performance trend (last 30 days)
    const trendData = postAnalytics
      .reduce((acc, pa) => {
        const existing = acc.find(item => item.date === pa.date);
        if (existing) {
          existing.views += pa.views;
          existing.engagement += pa.clicks + pa.shares + pa.comments;
        } else {
          acc.push({
            date: pa.date,
            views: pa.views,
            engagement: pa.clicks + pa.shares + pa.comments
          });
        }
        return acc;
      }, [] as Array<{ date: string; views: number; engagement: number }>)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30);

    // Get top performing posts
    const topPosts = postAnalytics
      .map(pa => ({
        ...pa,
        engagement: pa.clicks + pa.shares + pa.comments
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map(pa => ({
        title: (pa as any).posts?.title || 'Unknown Post',
        views: pa.views,
        engagement: pa.engagement,
        site: (pa as any).posts?.wordpress_sites?.name || 'Unknown Site'
      }));

    setOverview({
      totalPosts: new Set(postAnalytics.map(pa => pa.post_id)).size,
      totalViews,
      totalEngagement,
      avgTimeOnPage,
      bounceRate,
      topPosts,
      performanceTrend: trendData
    });
  };

  const getStartDate = (range: string): Date => {
    const now = new Date();
    switch (range) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  };

  const refreshAnalytics = (dateRange: string = '30d') => {
    setLoading(true);
    Promise.all([
      fetchPostAnalytics(dateRange),
      fetchCampaignAnalytics(dateRange)
    ]).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    if (user) {
      refreshAnalytics();
    }
  }, [user]);

  useEffect(() => {
    calculateOverview();
  }, [postAnalytics]);

  return {
    postAnalytics,
    campaignAnalytics,
    overview,
    loading,
    refreshAnalytics,
    fetchPostAnalytics,
    fetchCampaignAnalytics
  };
};