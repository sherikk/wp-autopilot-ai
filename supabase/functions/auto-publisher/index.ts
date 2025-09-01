import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Running auto-publisher for scheduled posts...')

    // Get posts that are scheduled to be published now
    const now = new Date().toISOString()
    const { data: scheduledPosts, error: postsError } = await supabase
      .from('posts')
      .select(`
        *,
        wordpress_sites (
          id,
          url,
          auth_type,
          username,
          password_encrypted,
          status
        )
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_for', now)

    if (postsError) {
      throw new Error(`Failed to fetch scheduled posts: ${postsError.message}`)
    }

    console.log(`Found ${scheduledPosts?.length || 0} posts ready for publishing`)

    const results = []

    for (const post of scheduledPosts || []) {
      try {
        // Skip if WordPress site is not connected
        if (!post.wordpress_sites || post.wordpress_sites.status !== 'connected') {
          console.log(`Skipping post ${post.title} - WordPress site not connected`)
          results.push({
            postId: post.id,
            title: post.title,
            success: false,
            error: 'WordPress site not connected'
          })
          continue
        }

        console.log(`Publishing post: ${post.title} to ${post.wordpress_sites.url}`)

        // Call WordPress publishing function
        const publishResponse = await supabase.functions.invoke('wordpress-post', {
          body: { postId: post.id }
        })

        if (publishResponse.error) {
          throw new Error(`Publishing failed: ${publishResponse.error.message}`)
        }

        if (publishResponse.data?.success) {
          // Update post status to published
          await supabase
            .from('posts')
            .update({ 
              status: 'published',
              published_at: new Date().toISOString(),
              wordpress_post_id: publishResponse.data.wordpress_post_id
            })
            .eq('id', post.id)

          results.push({
            postId: post.id,
            title: post.title,
            success: true,
            wordpressPostId: publishResponse.data.wordpress_post_id
          })

          console.log(`✅ Successfully published: ${post.title}`)
        } else {
          throw new Error(publishResponse.data?.error || 'Unknown publishing error')
        }

      } catch (error) {
        console.error(`❌ Failed to publish ${post.title}:`, error)
        
        // Update post with error message
        await supabase
          .from('posts')
          .update({ 
            status: 'failed',
            error_message: error.message
          })
          .eq('id', post.id)

        results.push({
          postId: post.id,
          title: post.title,
          success: false,
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        processed: results.length,
        published: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Auto-publisher error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})