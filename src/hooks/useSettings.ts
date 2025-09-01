import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface UserSettings {
  // General
  companyName: string;
  timezone: string;
  language: string;
  
  // AI & Content
  aiProvider: string;
  defaultTone: string;
  defaultWordCount: string;
  thumbnailStyle: string;
  
  // Notifications
  emailNotifications: boolean;
  campaignUpdates: boolean;
  errorAlerts: boolean;
  weeklyReports: boolean;
  
  // Rate Limits
  maxPostsPerDay: string;
  requestDelay: string;
  maxConcurrency: string;
}

const defaultSettings: UserSettings = {
  // General
  companyName: "WP Genie",
  timezone: "UTC-5",
  language: "en",
  
  // AI & Content
  aiProvider: "openai",
  defaultTone: "professional",
  defaultWordCount: "1000-1500",
  thumbnailStyle: "modern",
  
  // Notifications
  emailNotifications: true,
  campaignUpdates: true,
  errorAlerts: true,
  weeklyReports: true,
  
  // Rate Limits
  maxPostsPerDay: "20",
  requestDelay: "2000",
  maxConcurrency: "3"
};

export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('setting_key, setting_value')
        .eq('user_id', user.id);

      if (error) throw error;

      if (data && data.length > 0) {
        const userSettings = { ...defaultSettings };
        data.forEach(({ setting_key, setting_value }) => {
          if (setting_key in userSettings) {
            (userSettings as any)[setting_key] = setting_value;
          }
        });
        setSettings(userSettings);
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error Loading Settings",
        description: "Using default settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof UserSettings, value: any) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          setting_key: key,
          setting_value: value
        }, {
          onConflict: 'user_id,setting_key'
        });

      if (error) throw error;

      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (error: any) {
      throw new Error(`Failed to update setting: ${error.message}`);
    }
  };

  const updateMultipleSettings = async (updates: Partial<UserSettings>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const settingsToUpsert = Object.entries(updates).map(([key, value]) => ({
        user_id: user.id,
        setting_key: key,
        setting_value: value
      }));

      const { error } = await supabase
        .from('user_settings')
        .upsert(settingsToUpsert, {
          onConflict: 'user_id,setting_key'
        });

      if (error) throw error;

      setSettings(prev => ({ ...prev, ...updates }));
    } catch (error: any) {
      throw new Error(`Failed to update settings: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [user]);

  return {
    settings,
    loading,
    updateSetting,
    updateMultipleSettings,
    refetch: fetchSettings
  };
};