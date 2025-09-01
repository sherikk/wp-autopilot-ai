-- Fix the aggregate_daily_analytics function to handle missing constraints
CREATE OR REPLACE FUNCTION public.aggregate_daily_analytics()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update campaign analytics when post analytics change
  -- Use INSERT without ON CONFLICT since we don't have the constraint yet
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
  GROUP BY p.campaign_id, p.user_id;
    
  RETURN NEW;
END;
$function$;

-- Fix the update_post_published_analytics function
CREATE OR REPLACE FUNCTION public.update_post_published_analytics()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- When a post is published, create analytics record if it doesn't exist
  IF NEW.status = 'published' AND OLD.status != 'published' THEN
    INSERT INTO post_analytics (
      post_id, 
      user_id, 
      date, 
      views, 
      clicks, 
      shares, 
      comments
    ) 
    SELECT NEW.id, NEW.user_id, CURRENT_DATE, 0, 0, 0, 0
    WHERE NOT EXISTS (
      SELECT 1 FROM post_analytics 
      WHERE post_id = NEW.id AND date = CURRENT_DATE
    );
  END IF;
  
  RETURN NEW;
END;
$function$;