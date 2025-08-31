-- Create WordPress sites table
CREATE TABLE public.wordpress_sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  auth_type TEXT NOT NULL CHECK (auth_type IN ('app-password', 'bearer')),
  username TEXT NOT NULL,
  password_encrypted TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'connecting' CHECK (status IN ('connected', 'connecting', 'error')),
  last_sync TIMESTAMP WITH TIME ZONE,
  posts_count INTEGER DEFAULT 0,
  categories_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  site_id UUID NOT NULL REFERENCES public.wordpress_sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  post_type TEXT DEFAULT 'post',
  global_prompt TEXT NOT NULL,
  thumbnail_prompt TEXT,
  target_categories JSONB DEFAULT '[]',
  scheduling_config JSONB DEFAULT '{}',
  ai_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create posts table
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES public.wordpress_sites(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'scheduled', 'published', 'failed')),
  wordpress_post_id INTEGER,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  category_name TEXT,
  tags TEXT[] DEFAULT '{}',
  featured_image_url TEXT,
  wordpress_media_id INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wordpress_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for wordpress_sites
CREATE POLICY "Users can view their own sites" 
ON public.wordpress_sites 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sites" 
ON public.wordpress_sites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sites" 
ON public.wordpress_sites 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sites" 
ON public.wordpress_sites 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for campaigns
CREATE POLICY "Users can view their own campaigns" 
ON public.campaigns 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaigns" 
ON public.campaigns 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" 
ON public.campaigns 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns" 
ON public.campaigns 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for posts
CREATE POLICY "Users can view their own posts" 
ON public.posts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own posts" 
ON public.posts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
ON public.posts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
ON public.posts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_wordpress_sites_updated_at
  BEFORE UPDATE ON public.wordpress_sites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();