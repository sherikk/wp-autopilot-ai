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
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid authorization token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { site_url, api_key } = await req.json()

    if (!site_url || !api_key) {
      return new Response(
        JSON.stringify({ success: false, message: 'Site URL and API key are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Test connection to WordPress site
    const testResponse = await fetch(`${site_url}/wp-json/wp-genie/v1/status`, {
      headers: {
        'X-WP-Genie-Key': api_key
      }
    })

    if (!testResponse.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Failed to connect to WordPress site. Make sure the WP Genie plugin is installed and activated.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const siteStatus = await testResponse.json()
    
    // Get categories from WordPress site
    const categoriesResponse = await fetch(`${site_url}/wp-json/wp-genie/v1/categories`, {
      headers: {
        'X-WP-Genie-Key': api_key
      }
    })

    const categories = categoriesResponse.ok ? await categoriesResponse.json() : []

    // Check if site already exists
    const { data: existingSite } = await supabase
      .from('wordpress_sites')
      .select('id')
      .eq('url', site_url)
      .eq('user_id', user.id)
      .single()

    if (existingSite) {
      // Update existing site
      const { error: updateError } = await supabase
        .from('wordpress_sites')
        .update({
          status: 'connected',
          last_sync: new Date().toISOString(),
          posts_count: siteStatus.posts_count || 0,
          categories_count: siteStatus.categories_count || 0,
          error_message: null
        })
        .eq('id', existingSite.id)

      if (updateError) {
        return new Response(
          JSON.stringify({ success: false, message: 'Failed to update site status' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    } else {
      // Create new site record
      const { error: insertError } = await supabase
        .from('wordpress_sites')
        .insert({
          user_id: user.id,
          name: site_url.replace(/^https?:\/\//, '').replace(/\/$/, ''),
          url: site_url,
          auth_type: 'plugin',
          username: 'wp_genie_plugin',
          password_encrypted: api_key, // Store API key in password field
          status: 'connected',
          last_sync: new Date().toISOString(),
          posts_count: siteStatus.posts_count || 0,
          categories_count: siteStatus.categories_count || 0
        })

      if (insertError) {
        return new Response(
          JSON.stringify({ success: false, message: 'Failed to save site configuration' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'WordPress site connected successfully',
        site_info: siteStatus,
        categories: categories
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