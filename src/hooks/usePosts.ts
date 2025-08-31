import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Post {
  id: string;
  title: string;
  content: string | null;
  status: 'draft' | 'generating' | 'scheduled' | 'published' | 'failed';
  wordpress_post_id: number | null;
  scheduled_for: string | null;
  published_at: string | null;
  category_name: string | null;
  tags: string[];
  featured_image_url: string | null;
  wordpress_media_id: number | null;
  error_message: string | null;
  created_at: string;
  campaigns?: {
    name: string;
  };
  wordpress_sites?: {
    name: string;
    url: string;
  };
}

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPosts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          campaigns (
            name
          ),
          wordpress_sites (
            name,
            url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts((data || []) as Post[]);
    } catch (error: any) {
      toast({
        title: "Error fetching posts",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [user]);

  return {
    posts,
    loading,
    refetch: fetchPosts
  };
};