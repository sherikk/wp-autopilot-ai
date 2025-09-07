import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface MediaAsset {
  id: string;
  topic_id: string;
  user_id: string;
  url: string;
  prompt: string;
  kind: 'featured' | 'thumbnail' | 'social' | 'inline';
  created_at: string;
}

export const useMediaAssets = () => {
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchMediaAssets = async (topicId?: string) => {
    if (!user) return;

    try {
      let query = supabase
        .from('media_assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (topicId) {
        query = query.eq('topic_id', topicId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMediaAssets((data || []) as MediaAsset[]);
    } catch (error: any) {
      console.error('Error fetching media assets:', error);
      toast.error(`Failed to fetch media assets: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateImage = async (
    topicId: string,
    prompt: string,
    kind: MediaAsset['kind'] = 'featured'
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      console.log('Generating image:', { topicId, prompt, kind });

      const { data, error } = await supabase.functions.invoke('generate-thumbnail', {
        body: { prompt, title: null }
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate image');
      }

      if (!data.success || !data.image) {
        throw new Error('Failed to generate image');
      }

      // Save to media_assets table
      const { data: mediaAsset, error: saveError } = await supabase
        .from('media_assets')
        .insert({
          topic_id: topicId,
          user_id: user.id,
          url: data.image,
          prompt,
          kind
        })
        .select()
        .single();

      if (saveError) {
        throw new Error(`Failed to save media asset: ${saveError.message}`);
      }

      toast.success('Image generated successfully!');
      return mediaAsset as MediaAsset;
    } catch (error: any) {
      console.error('Error generating image:', error);
      toast.error(error.message || 'Failed to generate image');
      throw error;
    }
  };

  const deleteMediaAsset = async (assetId: string) => {
    try {
      const { error } = await supabase
        .from('media_assets')
        .delete()
        .eq('id', assetId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setMediaAssets(prev => prev.filter(asset => asset.id !== assetId));
      toast.success('Media asset deleted');
    } catch (error: any) {
      toast.error(`Failed to delete media asset: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchMediaAssets();
  }, [user]);

  return {
    mediaAssets,
    loading,
    fetchMediaAssets,
    generateImage,
    deleteMediaAsset,
    refetch: fetchMediaAssets
  };
};