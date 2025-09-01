-- Enable pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job to run the campaign scheduler every hour
SELECT cron.schedule(
  'campaign-scheduler-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://sncraarjcekyfwsinvvl.supabase.co/functions/v1/campaign-scheduler',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuY3JhYXJqY2VreWZ3c2ludnZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjYyMjE5MywiZXhwIjoyMDcyMTk4MTkzfQ.3_dSrFZcUdddxNLV1e2O7b7cYnJB7X3V4CU6vGAGZmE"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);