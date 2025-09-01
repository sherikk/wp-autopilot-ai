-- Add title field to campaign_schedule table to store AI-generated post titles
ALTER TABLE public.campaign_schedule 
ADD COLUMN title TEXT;