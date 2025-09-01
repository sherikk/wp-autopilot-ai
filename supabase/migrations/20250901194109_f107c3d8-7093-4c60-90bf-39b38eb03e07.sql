-- Add columns to campaigns table for bulk generation settings
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS bulk_generation_enabled boolean DEFAULT false;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS posts_to_generate integer DEFAULT 10;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS publish_interval_hours integer DEFAULT 24;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS auto_publish_enabled boolean DEFAULT false;

-- Add indexes for better performance on scheduled queries
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_for ON posts(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_status_scheduled ON posts(status, scheduled_for) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_campaign_schedule_status_time ON campaign_schedule(status, scheduled_for);

-- Create function to automatically publish scheduled posts
CREATE OR REPLACE FUNCTION auto_publish_scheduled_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- This function will be called by the edge function to publish posts
  -- We'll implement the logic in the edge function for better control
  RETURN;
END;
$$;

-- Add trigger to update post analytics when posts are published
CREATE OR REPLACE FUNCTION update_post_published_analytics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When a post is published, update its analytics record
  IF NEW.status = 'published' AND OLD.status != 'published' THEN
    INSERT INTO post_analytics (
      post_id, 
      user_id, 
      date, 
      views, 
      clicks, 
      shares, 
      comments
    ) VALUES (
      NEW.id,
      NEW.user_id,
      CURRENT_DATE,
      0, 0, 0, 0
    ) ON CONFLICT (post_id, date) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for post publishing analytics
DROP TRIGGER IF EXISTS trigger_post_published_analytics ON posts;
CREATE TRIGGER trigger_post_published_analytics
  AFTER UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_post_published_analytics();