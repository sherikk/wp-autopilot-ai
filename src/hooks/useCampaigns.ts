import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  site_id: string;
  post_type: string;
  global_prompt: string;
  thumbnail_prompt: string | null;
  target_categories: string[];
  scheduling_config: any;
  ai_settings: any;
  created_at: string;
  wordpress_sites?: {
    name: string;
    url: string;
  };
}

export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCampaigns = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          wordpress_sites (
            name,
            url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns((data || []) as Campaign[]);
    } catch (error: any) {
      toast({
        title: "Error fetching campaigns",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [user]);

  const createCampaign = async (campaignData: {
    name: string;
    siteId: string;
    postType: string;
    globalPrompt: string;
    thumbnailPrompt?: string;
    targetCategories: string[];
    schedulingConfig?: any;
    aiSettings?: any;
  }) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          user_id: user.id,
          site_id: campaignData.siteId,
          name: campaignData.name,
          post_type: campaignData.postType,
          global_prompt: campaignData.globalPrompt,
          thumbnail_prompt: campaignData.thumbnailPrompt,
          target_categories: campaignData.targetCategories,
          scheduling_config: campaignData.schedulingConfig || {},
          ai_settings: campaignData.aiSettings || {},
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchCampaigns();
      return data;
    } catch (error: any) {
      throw new Error(`Failed to create campaign: ${error.message}`);
    }
  };

  const updateCampaign = async (campaignId: string, updates: Partial<Campaign>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', campaignId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      await fetchCampaigns();
    } catch (error: any) {
      throw new Error(`Failed to update campaign: ${error.message}`);
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      await fetchCampaigns();
    } catch (error: any) {
      throw new Error(`Failed to delete campaign: ${error.message}`);
    }
  };

  return {
    campaigns,
    loading,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    refetch: fetchCampaigns
  };
};