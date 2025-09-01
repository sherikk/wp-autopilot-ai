-- Add foreign key relationship between campaign_schedule and campaigns
ALTER TABLE public.campaign_schedule 
ADD CONSTRAINT campaign_schedule_campaign_id_fkey 
FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;