import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { post_id, user_id, analytics_data } = await req.json();

    if (!post_id || !user_id || !analytics_data) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: post_id, user_id, analytics_data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing analytics for post ${post_id} by user ${user_id}`);

    // Verify the post belongs to the user
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, user_id')
      .eq('id', post_id)
      .single();

    if (postError || !post || post.user_id !== user_id) {
      return new Response(
        JSON.stringify({ error: 'Post not found or unauthorized' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Upsert post analytics data
    const { data: analyticsData, error: analyticsError } = await supabase
      .from('post_analytics')
      .upsert({
        post_id,
        user_id,
        date: today,
        views: analytics_data.views || 0,
        clicks: analytics_data.clicks || 0,
        shares: analytics_data.shares || 0,
        comments: analytics_data.comments || 0,
        time_on_page: analytics_data.time_on_page || 0,
        bounce_rate: analytics_data.bounce_rate || 0
      }, {
        onConflict: 'post_id,date'
      })
      .select();

    if (analyticsError) {
      console.error('Analytics upsert error:', analyticsError);
      return new Response(
        JSON.stringify({ error: 'Failed to store analytics data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analytics data stored successfully for post ${post_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Analytics data collected successfully',
        data: analyticsData
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Analytics collection error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});