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
  status: 'planned' | 'queued' | 'generating' | 'created' | 'queued_publish' | 'publishing' | 'published' | 'failed_generation' | 'failed_publish' | 'skipped';
  post_id?: string | null;
  title?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  retry_count: number;
  timezone: string;
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
    timezone?: string;
  }) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Get campaign details for quiet hours and timezone
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('quiet_hours_start, quiet_hours_end, campaign_timezone, global_prompt')
        .eq('id', campaignId)
        .single();

      if (campaignError) {
        throw new Error(`Failed to get campaign details: ${campaignError.message}`);
      }

      const scheduleItems: Omit<CampaignScheduleItem, 'id' | 'created_at' | 'updated_at'>[] = [];
      const timezone = config.timezone || campaign.campaign_timezone || 'UTC';
      
      let currentDate = startOfDay(config.startDate);
      const endDate = startOfDay(config.endDate);

      while (currentDate <= endDate) {
        for (let i = 0; i < config.postsPerPeriod; i++) {
          let scheduledFor = new Date(currentDate);
          
          // Smart scheduling within business hours (9 AM - 6 PM)
          if (config.frequency === 'daily' && config.postsPerPeriod > 1) {
            const businessHours = 9; // 9 AM to 6 PM = 9 hours
            const hourSpacing = Math.floor(businessHours / config.postsPerPeriod);
            scheduledFor.setHours(9 + (i * hourSpacing));
          } else if (config.frequency === 'weekly' && config.postsPerPeriod > 1) {
            scheduledFor = addDays(scheduledFor, i);
            scheduledFor.setHours(10); // Default to 10 AM
          } else {
            scheduledFor.setHours(10); // Default to 10 AM
          }

          scheduleItems.push({
            campaign_id: campaignId,
            user_id: user.id,
            scheduled_for: scheduledFor.toISOString(),
            status: 'planned',
            timezone,
            retry_count: 0
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

      // Insert schedule items first (without titles)
      const { data: insertedItems, error: insertError } = await supabase
        .from('campaign_schedule')
        .insert(scheduleItems)
        .select();

      if (insertError) throw insertError;

      // Queue title generation jobs for each schedule item
      const jobPromises = insertedItems.map(item => 
        supabase.from('job_queue').insert({
          job_type: 'generate_titles',
          job_data: {
            schedule_item_id: item.id,
            campaign_id: campaignId,
            global_prompt: campaign.global_prompt
          },
          idempotency_key: `title_gen_${item.id}`
        })
      );

      await Promise.all(jobPromises);

      // Update schedule items to 'queued' status
      await supabase
        .from('campaign_schedule')
        .update({ status: 'queued' })
        .in('id', insertedItems.map(item => item.id));
      
      await fetchSchedules();
      return insertedItems.length;
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