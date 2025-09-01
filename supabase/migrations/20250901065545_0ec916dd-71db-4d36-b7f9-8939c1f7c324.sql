-- Fix security vulnerability in job_queue table
-- Remove overly permissive policy that allows all users to access all job data
DROP POLICY IF EXISTS "System can manage job queue" ON public.job_queue;

-- Create a more secure policy that only allows system operations
-- Edge functions run with service role and bypass RLS, so they can still manage jobs
-- Regular users should only see their own job items through the existing user policy
CREATE POLICY "Service role can manage job queue" 
ON public.job_queue 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Ensure the user viewing policy is properly restrictive
-- Update the user policy to be more secure and only allow viewing, not all operations
DROP POLICY IF EXISTS "Users can view their job queue items" ON public.job_queue;

CREATE POLICY "Users can view their own job queue items" 
ON public.job_queue 
FOR SELECT 
TO authenticated
USING (
  CASE
    WHEN job_type = 'generate_titles' THEN (
      EXISTS (
        SELECT 1 
        FROM campaign_schedule cs 
        WHERE cs.id = (job_data->>'schedule_item_id')::uuid 
        AND cs.user_id = auth.uid()
      )
    )
    WHEN job_type = 'generate_campaign_content' THEN (
      EXISTS (
        SELECT 1 
        FROM campaigns c 
        WHERE c.id = (job_data->>'campaign_id')::uuid 
        AND c.user_id = auth.uid()
      )
    )
    WHEN job_type = 'wordpress_post' THEN (
      EXISTS (
        SELECT 1 
        FROM posts p 
        WHERE p.id = (job_data->>'post_id')::uuid 
        AND p.user_id = auth.uid()
      )
    )
    ELSE false
  END
);