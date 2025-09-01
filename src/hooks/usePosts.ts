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
  site_id: string;
  campaign_id: string | null;
  user_id: string;
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

  const createPost = async (postData: Partial<Post>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          title: postData.title,
          content: postData.content,
          status: postData.status || 'draft',
          site_id: postData.site_id,
          campaign_id: postData.campaign_id || null,
          category_name: postData.category_name,
          tags: postData.tags || [],
          scheduled_for: postData.scheduled_for
        })
        .select()
        .single();

      if (error) throw error;
      await fetchPosts();
      return data;
    } catch (error: any) {
      toast({
        title: "Error creating post",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const updatePost = async (postId: string, updates: Partial<Post>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('posts')
        .update({
          title: updates.title,
          content: updates.content,
          status: updates.status,
          category_name: updates.category_name,
          tags: updates.tags,
          scheduled_for: updates.scheduled_for,
          campaign_id: updates.campaign_id
        })
        .eq('id', postId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      await fetchPosts();
      return data;
    } catch (error: any) {
      toast({
        title: "Error updating post",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const deletePost = async (postId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchPosts();
    } catch (error: any) {
      toast({
        title: "Error deleting post",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const publishPost = async (postId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // First get the post data
      const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select('*, wordpress_sites(*)')
        .eq('id', postId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;
      if (!post) throw new Error('Post not found');

      // Call WordPress publish function with correct parameters
      const { data, error } = await supabase.functions.invoke('wordpress-post', {
        body: {
          post_id: postId,
          site_id: post.site_id
        }
      });

      if (error) throw error;
      await fetchPosts();
      return data;
    } catch (error: any) {
      toast({
        title: "Error publishing post",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    posts,
    loading,
    refetch: fetchPosts,
    createPost,
    updatePost,
    deletePost,
    publishPost
  };
};