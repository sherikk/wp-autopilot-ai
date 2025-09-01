-- Fix security warnings by setting proper search paths for functions
CREATE OR REPLACE FUNCTION public.aggregate_daily_analytics()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update campaign analytics when post analytics change
  INSERT INTO public.campaign_analytics (
    campaign_id, 
    user_id, 
    date, 
    posts_created, 
    posts_published, 
    total_views, 
    total_engagement
  )
  SELECT 
    p.campaign_id,
    p.user_id,
    NEW.date,
    COUNT(DISTINCT p.id) as posts_created,
    COUNT(DISTINCT CASE WHEN p.status = 'published' THEN p.id END) as posts_published,
    COALESCE(SUM(pa.views), 0) as total_views,
    COALESCE(SUM(pa.clicks + pa.shares + pa.comments), 0) as total_engagement
  FROM public.posts p
  LEFT JOIN public.post_analytics pa ON p.id = pa.post_id AND pa.date = NEW.date
  WHERE p.campaign_id = (SELECT campaign_id FROM public.posts WHERE id = NEW.post_id)
    AND p.user_id = NEW.user_id
  GROUP BY p.campaign_id, p.user_id
  ON CONFLICT (campaign_id, date) 
  DO UPDATE SET
    posts_created = EXCLUDED.posts_created,
    posts_published = EXCLUDED.posts_published,
    total_views = EXCLUDED.total_views,
    total_engagement = EXCLUDED.total_engagement,
    updated_at = now();
    
  RETURN NEW;
END;
$$;

-- Update the existing function to have proper search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;