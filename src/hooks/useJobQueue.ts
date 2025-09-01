import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface JobQueueItem {
  id: string;
  job_type: string;
  job_data: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  idempotency_key?: string;
  attempts: number;
  max_attempts: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
  scheduled_for: string;
}

export const useJobQueue = (jobType?: string) => {
  const [jobs, setJobs] = useState<JobQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchJobs = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('job_queue')
        .select('*')
        .order('created_at', { ascending: false });

      if (jobType) {
        query = query.eq('job_type', jobType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setJobs((data || []).map(job => ({
        id: job.id,
        job_type: job.job_type,
        job_data: job.job_data as Record<string, any>,
        status: job.status as 'pending' | 'processing' | 'completed' | 'failed',
        idempotency_key: job.idempotency_key || undefined,
        attempts: job.attempts || 0,
        max_attempts: job.max_attempts || 3,
        error_message: job.error_message || undefined,
        created_at: job.created_at || new Date().toISOString(),
        updated_at: job.updated_at || new Date().toISOString(),
        scheduled_for: job.scheduled_for || new Date().toISOString()
      })));
    } catch (error: any) {
      toast({
        title: "Error fetching jobs",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [user, jobType]);

  const triggerJobProcessor = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('job-processor');
      
      if (error) throw error;
      
      if (data.success) {
        toast({
          title: "Job processor triggered",
          description: `Processed ${data.processed} jobs`
        });
        await fetchJobs();
      }
      
      return data;
    } catch (error: any) {
      toast({
        title: "Error triggering job processor",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const retryFailedJobs = async (jobIds: string[]) => {
    try {
      const { error } = await supabase
        .from('job_queue')
        .update({ 
          status: 'pending', 
          attempts: 0,
          error_message: null,
          scheduled_for: new Date().toISOString()
        })
        .in('id', jobIds);

      if (error) throw error;
      
      await fetchJobs();
      toast({
        title: "Jobs retried",
        description: `${jobIds.length} jobs have been queued for retry`
      });
    } catch (error: any) {
      toast({
        title: "Error retrying jobs",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return {
    jobs,
    loading,
    triggerJobProcessor,
    retryFailedJobs,
    refetch: fetchJobs
  };
};