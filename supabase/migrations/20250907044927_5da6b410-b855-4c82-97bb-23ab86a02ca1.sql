-- Create projects table for brand and configuration management
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  brand_tone TEXT DEFAULT 'professional',
  default_model TEXT DEFAULT 'gpt-4o-mini',
  wp_site_url TEXT,
  wp_user TEXT,
  wp_app_password_encrypted TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create topics table as the main content unit
CREATE TABLE public.topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'idea',
  target_keyword TEXT NOT NULL,
  search_intent TEXT DEFAULT 'info',
  audience TEXT NOT NULL,
  length_words INTEGER DEFAULT 1000,
  outline_json JSONB,
  source_urls TEXT[],
  draft_markdown TEXT,
  seo_title TEXT,
  meta_description TEXT,
  slug TEXT,
  featured_image_url TEXT,
  quality_score FLOAT,
  plagiarism_score FLOAT,
  model_name TEXT DEFAULT 'gpt-4o-mini',
  temperature FLOAT DEFAULT 0.7,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create source_snippets table for research citations
CREATE TABLE public.source_snippets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL,
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  snippet TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create media_assets table for generated images
CREATE TABLE public.media_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL,
  user_id UUID NOT NULL,
  kind TEXT NOT NULL DEFAULT 'featured',
  url TEXT NOT NULL,
  prompt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add constraints and check constraints
ALTER TABLE public.topics ADD CONSTRAINT topics_status_check 
CHECK (status IN ('idea', 'outlined', 'drafting', 'needs_review', 'scheduled', 'published', 'failed'));

ALTER TABLE public.topics ADD CONSTRAINT topics_search_intent_check 
CHECK (search_intent IN ('info', 'commercial', 'transactional', 'navigational'));

ALTER TABLE public.media_assets ADD CONSTRAINT media_assets_kind_check 
CHECK (kind IN ('featured', 'og'));

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for projects
CREATE POLICY "Users can view their own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for topics
CREATE POLICY "Users can view their own topics" ON public.topics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own topics" ON public.topics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own topics" ON public.topics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own topics" ON public.topics FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for source_snippets
CREATE POLICY "Users can view their own source snippets" ON public.source_snippets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own source snippets" ON public.source_snippets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own source snippets" ON public.source_snippets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own source snippets" ON public.source_snippets FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for media_assets
CREATE POLICY "Users can view their own media assets" ON public.media_assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own media assets" ON public.media_assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own media assets" ON public.media_assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own media assets" ON public.media_assets FOR DELETE USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON public.topics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add enhanced job_queue types for the new pipeline
ALTER TABLE public.job_queue DROP CONSTRAINT IF EXISTS job_queue_job_type_check;
ALTER TABLE public.job_queue ADD CONSTRAINT job_queue_job_type_check 
CHECK (job_type IN ('generate_titles', 'generate_campaign_content', 'wordpress_post', 'outline', 'research', 'draft', 'media', 'seo', 'qa', 'publish'));