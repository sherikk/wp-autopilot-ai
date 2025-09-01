-- Create analytics tracking tables
CREATE TABLE public.post_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  time_on_page INTEGER DEFAULT 0, -- in seconds
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.post_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for post analytics
CREATE POLICY "Users can view their post analytics" 
ON public.post_analytics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage analytics" 
ON public.post_analytics 
FOR ALL 
USING (true);

-- Create campaign analytics table
CREATE TABLE public.campaign_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  posts_created INTEGER DEFAULT 0,
  posts_published INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_engagement INTEGER DEFAULT 0,
  avg_time_on_page DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for campaign analytics
CREATE POLICY "Users can view their campaign analytics" 
ON public.campaign_analytics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage campaign analytics" 
ON public.campaign_analytics 
FOR ALL 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_post_analytics_post_date ON public.post_analytics(post_id, date);
CREATE INDEX idx_post_analytics_user_date ON public.post_analytics(user_id, date);
CREATE INDEX idx_campaign_analytics_campaign_date ON public.campaign_analytics(campaign_id, date);
CREATE INDEX idx_campaign_analytics_user_date ON public.campaign_analytics(user_id, date);

-- Create function to aggregate daily analytics
CREATE OR REPLACE FUNCTION public.aggregate_daily_analytics()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for analytics aggregation
CREATE TRIGGER update_campaign_analytics_trigger
  AFTER INSERT OR UPDATE ON public.post_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.aggregate_daily_analytics();

-- Add triggers for updating timestamps
CREATE TRIGGER update_post_analytics_updated_at
  BEFORE UPDATE ON public.post_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_analytics_updated_at
  BEFORE UPDATE ON public.campaign_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();