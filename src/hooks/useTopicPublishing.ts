import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface PublishingOptions {
  siteId: string;
  status: 'draft' | 'publish' | 'scheduled';
  scheduledFor?: string;
  categoryId?: number;
  tags?: string[];
  generateFeaturedImage?: boolean;
  imagePrompt?: string;
}

export const useTopicPublishing = () => {
  const [publishing, setPublishing] = useState(false);
  const { user } = useAuth();

  const publishTopicToWordPress = async (
    topicId: string,
    options: PublishingOptions
  ) => {
    if (!user) throw new Error('User not authenticated');

    setPublishing(true);
    
    try {
      console.log('Publishing topic to WordPress:', { topicId, options });

      // Get topic details
      const { data: topic, error: topicError } = await supabase
        .from('topics')
        .select('*')
        .eq('id', topicId)
        .single();

      if (topicError || !topic) {
        throw new Error('Topic not found');
      }

      if (!topic.draft_markdown) {
        throw new Error('Topic must have draft content before publishing');
      }

      // Generate featured image if requested
      let featuredImageUrl = topic.featured_image_url;
      
      if (options.generateFeaturedImage) {
        console.log('Generating featured image for topic');
        
        const imagePrompt = options.imagePrompt || 
          `Create a professional, high-quality featured image for a blog post about "${topic.target_keyword}". The image should be modern, visually appealing, and relevant to the topic. Style: professional, clean, eye-catching.`;

        const { data: imageData, error: imageError } = await supabase.functions.invoke('generate-thumbnail', {
          body: { 
            prompt: imagePrompt,
            title: topic.seo_title || topic.target_keyword
          }
        });

        if (imageError) {
          console.warn('Failed to generate featured image:', imageError);
          toast.error('Failed to generate featured image, continuing without it');
        } else if (imageData?.success && imageData?.image) {
          featuredImageUrl = imageData.image;
          
          // Save the generated image to media_assets
          await supabase
            .from('media_assets')
            .insert({
              topic_id: topicId,
              user_id: user.id,
              url: featuredImageUrl,
              prompt: imagePrompt,
              kind: 'featured'
            });

          // Update topic with featured image
          await supabase
            .from('topics')
            .update({ featured_image_url: featuredImageUrl })
            .eq('id', topicId);

          toast.success('Featured image generated successfully!');
        }
      }

      // Convert markdown to HTML for WordPress
      const htmlContent = convertMarkdownToWordPress(topic.draft_markdown);

      // Create post in posts table
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          site_id: options.siteId,
          campaign_id: topic.project_id, // Use project_id as campaign_id for now
          title: topic.seo_title || topic.target_keyword,
          content: htmlContent,
          status: options.status === 'scheduled' ? 'scheduled' : 'draft',
          scheduled_for: options.scheduledFor || null,
          featured_image_url: featuredImageUrl,
          tags: options.tags || [],
          category_name: null // Will be handled by WordPress API
        })
        .select()
        .single();

      if (postError) {
        throw new Error(`Failed to create post: ${postError.message}`);
      }

      // If publishing immediately, send to WordPress
      if (options.status === 'publish') {
        console.log('Publishing post to WordPress immediately');
        
        const { data: wpResult, error: wpError } = await supabase.functions.invoke('wordpress-post', {
          body: {
            post_id: post.id,
            site_id: options.siteId
          }
        });

        if (wpError) {
          throw new Error(`Failed to publish to WordPress: ${wpError.message}`);
        }

        if (!wpResult.success) {
          throw new Error(wpResult.message || 'Failed to publish to WordPress');
        }

        toast.success('Topic published to WordPress successfully!');
      } else if (options.status === 'scheduled') {
        toast.success('Topic scheduled for WordPress publishing!');
      } else {
        toast.success('Draft post created in WordPress!');
      }

      // Update topic status
      await supabase
        .from('topics')
        .update({ 
          status: 'published',
          updated_at: new Date().toISOString()
        })
        .eq('id', topicId);

      return post;

    } catch (error: any) {
      console.error('Error publishing topic:', error);
      toast.error(error.message || 'Failed to publish topic');
      throw error;
    } finally {
      setPublishing(false);
    }
  };

  const batchPublishTopics = async (
    topicIds: string[],
    options: PublishingOptions
  ) => {
    const results = [];
    let successful = 0;
    let failed = 0;

    for (const topicId of topicIds) {
      try {
        await publishTopicToWordPress(topicId, options);
        successful++;
        results.push({ topicId, success: true });
      } catch (error: any) {
        failed++;
        results.push({ topicId, success: false, error: error.message });
      }
    }

    toast.success(`Batch publishing completed: ${successful} successful, ${failed} failed`);
    return results;
  };

  return {
    publishTopicToWordPress,
    batchPublishTopics,
    publishing
  };
};

// Helper function to convert markdown to WordPress-compatible HTML
function convertMarkdownToWordPress(markdown: string): string {
  // Basic markdown to HTML conversion
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Citations - convert [1], [2] to superscript
    .replace(/\[(\d+)\]/g, '<sup>$1</sup>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    // Lists (basic)
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // Wrap in paragraphs if not already wrapped
  if (!html.startsWith('<')) {
    html = '<p>' + html + '</p>';
  }

  return html;
}