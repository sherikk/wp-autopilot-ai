import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!authHeader) {
      console.error('No authorization header found')
      return new Response(
        JSON.stringify({ success: false, message: 'Authorization required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader)
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid authorization token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const requestBody = await req.json()
    console.log('Request body:', requestBody)
    const { post_id, site_id } = requestBody

    if (!post_id || !site_id) {
      console.error('Missing required parameters:', { post_id, site_id })
      return new Response(
        JSON.stringify({ success: false, message: 'Post ID and Site ID are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get post data
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', post_id)
      .eq('user_id', user.id)
      .single()

    if (postError || !post) {
      return new Response(
        JSON.stringify({ success: false, message: 'Post not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get WordPress site data
    const { data: site, error: siteError } = await supabase
      .from('wordpress_sites')
      .select('*')
      .eq('id', site_id)
      .eq('user_id', user.id)
      .single()

    if (siteError || !site) {
      return new Response(
        JSON.stringify({ success: false, message: 'WordPress site not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare post data for WordPress
    const postData = {
      title: post.title,
      content: post.content,
      category: post.category_name,
      featured_image_url: post.featured_image_url,
      tags: post.tags || []
    }

    // If post is scheduled, add schedule date
    if (post.scheduled_for) {
      postData.scheduled_for = post.scheduled_for
    }

    // Send post to WordPress site
    let wpResponse;
    
    if (site.auth_type === 'app-password') {
      // Use WordPress Application Password authentication
      const authString = btoa(`${site.username}:${site.password_encrypted}`);
      
      wpResponse = await fetch(`${site.url}/wp-json/wp/v2/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${authString}`
        },
        body: JSON.stringify({
          title: post.title,
          content: post.content,
          status: post.scheduled_for ? 'future' : 'publish',
          date: post.scheduled_for || new Date().toISOString(),
          categories: post.category_name ? [1] : [], // Default category ID
          // Remove tags for now since WordPress expects tag IDs, not names
          featured_media: post.wordpress_media_id || null
        })
      });
    } else {
      // Use plugin-based API (existing code for backward compatibility)
      wpResponse = await fetch(`${site.url}/wp-json/wp-genie/v1/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Genie-Key': site.password_encrypted
        },
        body: JSON.stringify(postData)
      });
    }

    if (!wpResponse.ok) {
      const errorData = await wpResponse.text()
      
      // Update post status to error
      await supabase
        .from('posts')
        .update({
          status: 'error',
          error_message: `WordPress API error: ${errorData}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', post_id)

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Failed to publish to WordPress: ${errorData}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const wpResult = await wpResponse.json()

    // Update post with WordPress details
    const updateData: any = {
      status: 'published',
      published_at: new Date().toISOString(),
      wordpress_post_id: wpResult.id || wpResult.post_id,
      error_message: null,
      updated_at: new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', post_id)

    if (updateError) {
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to update post status' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Post published successfully',
        wordpress_post_id: wpResult.id || wpResult.post_id,
        post_url: wpResult.link || wpResult.post_url
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})