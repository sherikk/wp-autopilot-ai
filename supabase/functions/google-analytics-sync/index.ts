import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleAnalyticsData {
  page_path: string;
  page_views: number;
  unique_page_views: number;
  avg_time_on_page: number;
  bounce_rate: number;
  events: {
    click: number;
    share: number;
    comment: number;
  };
}

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

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: user } = await supabase.auth.getUser(token);

    if (!user.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { site_id, google_analytics_data, date_range } = await req.json();

    if (!site_id || !google_analytics_data) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: site_id, google_analytics_data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Syncing Google Analytics data for site ${site_id}`);

    // Verify the site belongs to the user
    const { data: site, error: siteError } = await supabase
      .from('wordpress_sites')
      .select('id, user_id, url')
      .eq('id', site_id)
      .eq('user_id', user.user.id)
      .single();

    if (siteError || !site) {
      return new Response(
        JSON.stringify({ error: 'Site not found or unauthorized' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const analyticsPromises: Promise<any>[] = [];

    // Process each page's analytics data
    for (const pageData of google_analytics_data as GoogleAnalyticsData[]) {
      // Try to match the page path to a post
      const { data: posts } = await supabase
        .from('posts')
        .select('id')
        .eq('site_id', site_id)
        .eq('user_id', user.user.id)
        .like('title', `%${pageData.page_path.split('/').pop()?.replace(/-/g, ' ') || ''}%`);

      if (posts && posts.length > 0) {
        const post = posts[0];
        const today = new Date().toISOString().split('T')[0];

        // Store analytics data for the matched post
        const analyticsPromise = supabase
          .from('post_analytics')
          .upsert({
            post_id: post.id,
            user_id: user.user.id,
            date: today,
            views: pageData.page_views,
            clicks: pageData.events.click,
            shares: pageData.events.share,
            comments: pageData.events.comment,
            time_on_page: Math.round(pageData.avg_time_on_page),
            bounce_rate: pageData.bounce_rate
          }, {
            onConflict: 'post_id,date'
          });

        analyticsPromises.push(analyticsPromise);
      }
    }

    // Execute all analytics updates
    const results = await Promise.allSettled(analyticsPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Google Analytics sync completed: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Google Analytics sync completed`,
        stats: {
          successful,
          failed,
          total: results.length
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Google Analytics sync error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});