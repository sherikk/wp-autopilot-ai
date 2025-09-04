-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to run auto-publisher every minute
SELECT cron.schedule(
  'auto-publish-scheduled-posts',
  '* * * * *', -- every minute
  $$
  SELECT
    net.http_post(
        url:='https://sncraarjcekyfwsinvvl.supabase.co/functions/v1/auto-publisher',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuY3JhYXJqY2VreWZ3c2ludnZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MjIxOTMsImV4cCI6MjA3MjE5ODE5M30.CvUcwBSpZk_DPUvEMSnJ0rxehnMo_gspYPY99NNYmLE"}'::jsonb,
        body:='{"trigger": "cron"}'::jsonb
    ) as request_id;
  $$
);