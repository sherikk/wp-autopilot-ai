-- Add duration and scheduling fields to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN total_posts INTEGER DEFAULT 0,
ADD COLUMN posts_per_period INTEGER DEFAULT 1;

-- Create campaign_schedule table to pre-plan post dates
CREATE TABLE public.campaign_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL,
  user_id UUID NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned', -- planned, created, published, skipped
  post_id UUID NULL, -- reference to actual post when created
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on campaign_schedule table
ALTER TABLE public.campaign_schedule ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for campaign_schedule
CREATE POLICY "Users can view their own campaign schedules" 
ON public.campaign_schedule 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaign schedules" 
ON public.campaign_schedule 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaign schedules" 
ON public.campaign_schedule 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaign schedules" 
ON public.campaign_schedule 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for campaign_schedule updated_at
CREATE TRIGGER update_campaign_schedule_updated_at
BEFORE UPDATE ON public.campaign_schedule
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for efficient querying
CREATE INDEX idx_campaign_schedule_campaign_id ON public.campaign_schedule(campaign_id);
CREATE INDEX idx_campaign_schedule_scheduled_for ON public.campaign_schedule(scheduled_for);
CREATE INDEX idx_campaign_schedule_status ON public.campaign_schedule(status);