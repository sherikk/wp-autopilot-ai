import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface WordPressSite {
  id: string;
  name: string;
  url: string;
  auth_type: 'app-password' | 'bearer' | 'plugin';
  username: string;
  status: 'connected' | 'connecting' | 'error';
  last_sync: string | null;
  posts_count: number;
  categories_count: number;
  error_message: string | null;
  created_at: string;
}

export const useWordPressSites = () => {
  const [sites, setSites] = useState<WordPressSite[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSites = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wordpress_sites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSites((data || []) as WordPressSite[]);
    } catch (error: any) {
      toast({
        title: "Error fetching sites",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, [user]);

  const testWordPressConnection = async (url: string, username: string, password: string) => {
    try {
      // Normalize URL
      const baseUrl = url.replace(/\/$/, '');
      
      // Test WordPress API access
      const apiResponse = await fetch(`${baseUrl}/wp-json/wp/v2/posts?per_page=1`, {
        headers: {
          'Authorization': `Basic ${btoa(`${username}:${password}`)}`
        }
      });

      if (!apiResponse.ok) {
        throw new Error(`WordPress API test failed: ${apiResponse.status}`);
      }

      // Get categories count
      const categoriesResponse = await fetch(`${baseUrl}/wp-json/wp/v2/categories`, {
        headers: {
          'Authorization': `Basic ${btoa(`${username}:${password}`)}`
        }
      });

      const categories = categoriesResponse.ok ? await categoriesResponse.json() : [];
      
      return {
        success: true,
        categoriesCount: Array.isArray(categories) ? categories.length : 0
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  };

  const addSite = async (siteData: {
    name: string;
    url: string;
    authType: 'app-password' | 'bearer' | 'plugin';
    username: string;
    password: string;
  }) => {
    if (!user) throw new Error('User not authenticated');

    // Test connection first (skip for plugin type)
    if (siteData.authType !== 'plugin') {
      const testResult = await testWordPressConnection(siteData.url, siteData.username, siteData.password);
      
      if (!testResult.success) {
        throw new Error(`Connection test failed: ${testResult.error}`);
      }
    }

    try {
      const { data, error } = await supabase
        .from('wordpress_sites')
        .insert({
          user_id: user.id,
          name: siteData.name,
          url: siteData.url.replace(/\/$/, ''),
          auth_type: siteData.authType,
          username: siteData.username,
          password_encrypted: siteData.password, // In production, encrypt this
          status: siteData.authType === 'plugin' ? 'connecting' : 'connected',
          last_sync: siteData.authType === 'plugin' ? null : new Date().toISOString(),
          categories_count: 0,
          posts_count: 0
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchSites(); // Refresh list
      return data;
    } catch (error: any) {
      throw new Error(`Failed to save site: ${error.message}`);
    }
  };

  const connectViaPlugin = async (siteUrl: string, apiKey: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('No valid session');

      const response = await fetch(`https://sncraarjcekyfwsinvvl.supabase.co/functions/v1/wordpress-verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          site_url: siteUrl,
          api_key: apiKey
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }

      await fetchSites();
      return result;
    } catch (error: any) {
      throw new Error(`Failed to connect via plugin: ${error.message}`);
    }
  };

  return {
    sites,
    loading,
    addSite,
    connectViaPlugin,
    refetch: fetchSites
  };
};