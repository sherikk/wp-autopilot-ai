import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { addDays, addWeeks, addHours, startOfDay } from 'date-fns';

export interface CampaignScheduleItem {
  id: string;
  campaign_id: string;
  user_id: string;
  scheduled_for: string;
  status: 'planned' | 'created' | 'published' | 'skipped';
  post_id?: string | null;
  title?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignScheduleWithDetails extends CampaignScheduleItem {
  campaigns?: {
    name: string;
    global_prompt: string;
  };
}

export const useCampaignSchedule = (campaignId?: string) => {
  const [schedules, setSchedules] = useState<CampaignScheduleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSchedules = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('campaign_schedule')
        .select(`
          *,
          campaigns (
            name,
            global_prompt
          )
        `)
        .eq('user_id', user.id)
        .order('scheduled_for', { ascending: true });

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSchedules((data || []) as CampaignScheduleWithDetails[]);
    } catch (error: any) {
      toast({
        title: "Error fetching schedules",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [user, campaignId]);

  const generateSchedule = async (campaignId: string, config: {
    startDate: Date;
    endDate: Date;
    frequency: 'hourly' | 'daily' | 'weekly';
    postsPerPeriod: number;
  }) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const scheduleItems: Omit<CampaignScheduleItem, 'id' | 'created_at' | 'updated_at'>[] = [];
      
      let currentDate = startOfDay(config.startDate);
      const endDate = startOfDay(config.endDate);

      while (currentDate <= endDate) {
        for (let i = 0; i < config.postsPerPeriod; i++) {
          let scheduledFor = new Date(currentDate);
          
          // Add offset based on post number within the period
          if (config.frequency === 'daily' && config.postsPerPeriod > 1) {
            scheduledFor.setHours(9 + (i * 3)); // Space posts 3 hours apart starting at 9 AM
          } else if (config.frequency === 'weekly' && config.postsPerPeriod > 1) {
            scheduledFor = addDays(scheduledFor, i); // Space posts across the week
          }

          scheduleItems.push({
            campaign_id: campaignId,
            user_id: user.id,
            scheduled_for: scheduledFor.toISOString(),
            status: 'planned'
          });
        }

        // Move to next period
        switch (config.frequency) {
          case 'hourly':
            currentDate = addHours(currentDate, 1);
            break;
          case 'daily':
            currentDate = addDays(currentDate, 1);
            break;
          case 'weekly':
            currentDate = addWeeks(currentDate, 1);
            break;
        }
      }

      // Get campaign details for AI title generation
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('global_prompt')
        .eq('id', campaignId)
        .single();

      if (campaignError) {
        throw new Error(`Failed to get campaign details: ${campaignError.message}`);
      }

      // Generate AI titles for all scheduled posts
      const { data: titleResponse, error: titleError } = await supabase.functions.invoke('generate-post-titles', {
        body: { 
          globalPrompt: campaign.global_prompt,
          count: scheduleItems.length 
        }
      });

      let generatedTitles: string[] = [];
      if (titleError || !titleResponse?.success) {
        console.warn('Title generation failed, using fallback titles:', titleError);
        // Fallback to generic titles if AI generation fails
        generatedTitles = scheduleItems.map((_, index) => `Blog Post ${index + 1}`);
      } else {
        generatedTitles = titleResponse.titles;
      }

      // Add titles to schedule items
      const scheduleItemsWithTitles = scheduleItems.map((item, index) => ({
        ...item,
        title: generatedTitles[index] || `Blog Post ${index + 1}`
      }));

      const { error } = await supabase
        .from('campaign_schedule')
        .insert(scheduleItemsWithTitles);

      if (error) throw error;
      
      await fetchSchedules();
      return scheduleItemsWithTitles.length;
    } catch (error: any) {
      throw new Error(`Failed to generate schedule: ${error.message}`);
    }
  };

  const updateScheduleItem = async (scheduleId: string, updates: Partial<CampaignScheduleItem>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('campaign_schedule')
        .update(updates)
        .eq('id', scheduleId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      await fetchSchedules();
    } catch (error: any) {
      throw new Error(`Failed to update schedule: ${error.message}`);
    }
  };

  const deleteScheduleItem = async (scheduleId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('campaign_schedule')
        .delete()
        .eq('id', scheduleId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      await fetchSchedules();
    } catch (error: any) {
      throw new Error(`Failed to delete schedule item: ${error.message}`);
    }
  };

  const clearCampaignSchedule = async (campaignId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('campaign_schedule')
        .delete()
        .eq('campaign_id', campaignId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      await fetchSchedules();
    } catch (error: any) {
      throw new Error(`Failed to clear schedule: ${error.message}`);
    }
  };

  return {
    schedules,
    loading,
    generateSchedule,
    updateScheduleItem,
    deleteScheduleItem,
    clearCampaignSchedule,
    refetch: fetchSchedules
  };
};