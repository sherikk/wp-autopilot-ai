-- Phase 1: Database Safety - Add critical constraints and new columns

-- Add error tracking and timezone columns to campaign_schedule
ALTER TABLE public.campaign_schedule 
ADD COLUMN IF NOT EXISTS error_code TEXT,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Add unique constraint to prevent double-booking (campaign_id, scheduled_for)
ALTER TABLE public.campaign_schedule 
ADD CONSTRAINT unique_campaign_schedule UNIQUE (campaign_id, scheduled_for);

-- Update status enum to include intermediate states
ALTER TABLE public.campaign_schedule 
DROP CONSTRAINT IF EXISTS campaign_schedule_status_check;

ALTER TABLE public.campaign_schedule 
ADD CONSTRAINT campaign_schedule_status_check 
CHECK (status IN ('planned', 'queued', 'generating', 'created', 'queued_publish', 'publishing', 'published', 'failed_generation', 'failed_publish', 'skipped'));

-- Add quiet hours and timezone preferences to campaigns
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS quiet_hours_start TIME DEFAULT '22:00',
ADD COLUMN IF NOT EXISTS quiet_hours_end TIME DEFAULT '08:00',
ADD COLUMN IF NOT EXISTS campaign_timezone TEXT DEFAULT 'UTC';

-- Create job_queue table for async processing
CREATE TABLE IF NOT EXISTS public.job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  job_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  idempotency_key TEXT UNIQUE,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on job_queue
ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;

-- Create policies for job_queue
CREATE POLICY "Users can view their job queue items" 
ON public.job_queue 
FOR SELECT 
USING (
  CASE 
    WHEN job_type = 'generate_titles' THEN 
      EXISTS (
        SELECT 1 FROM public.campaign_schedule cs 
        WHERE cs.id = (job_data->>'schedule_item_id')::uuid 
        AND cs.user_id = auth.uid()
      )
    ELSE true 
  END
);

CREATE POLICY "System can manage job queue" 
ON public.job_queue 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create titles audit table for observability
CREATE TABLE IF NOT EXISTS public.title_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_item_id UUID REFERENCES public.campaign_schedule(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_source TEXT NOT NULL DEFAULT 'ai' CHECK (title_source IN ('ai', 'manual')),
  title_version INTEGER DEFAULT 1,
  prompt_used TEXT,
  model_version TEXT,
  generation_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on title_generations
ALTER TABLE public.title_generations ENABLE ROW LEVEL SECURITY;

-- Create policy for title_generations
CREATE POLICY "Users can view their title generations" 
ON public.title_generations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.campaign_schedule cs 
    WHERE cs.id = title_generations.schedule_item_id 
    AND cs.user_id = auth.uid()
  )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_schedule_scheduled_for ON public.campaign_schedule(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_campaign_schedule_status ON public.campaign_schedule(status);
CREATE INDEX IF NOT EXISTS idx_job_queue_status_scheduled ON public.job_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_title_generations_schedule_item ON public.title_generations(schedule_item_id);

-- Add trigger for updated_at on job_queue
CREATE TRIGGER update_job_queue_updated_at
  BEFORE UPDATE ON public.job_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();