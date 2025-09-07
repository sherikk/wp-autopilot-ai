import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topicId } = await req.json();
    
    if (!topicId) {
      throw new Error('Topic ID is required');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get topic details
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('*')
      .eq('id', topicId)
      .single();

    if (topicError || !topic) {
      throw new Error('Topic not found');
    }

    if (!topic.outline_json) {
      throw new Error('Topic must have an outline before research');
    }

    // Simulate research by finding credible sources
    // In a real implementation, this would use SerpAPI or Google Custom Search
    const searchQueries = [
      topic.target_keyword,
      `${topic.target_keyword} guide`,
      `${topic.target_keyword} facts statistics`,
      `${topic.target_keyword} best practices`
    ];

    // Mock credible sources - in real implementation, replace with actual search API
    const mockSources = [
      {
        url: "https://example.com/authoritative-source-1",
        title: `Comprehensive Guide to ${topic.target_keyword}`,
        snippet: "This authoritative source provides detailed information about the topic with statistics and expert insights."
      },
      {
        url: "https://example.com/research-study-2", 
        title: `Research Study on ${topic.target_keyword}`,
        snippet: "Peer-reviewed research with quantitative data and methodological analysis of the subject matter."
      },
      {
        url: "https://example.com/industry-report-3",
        title: `Industry Report: ${topic.target_keyword} Trends`,
        snippet: "Industry analysis with market data, trends, and expert opinions from leading professionals."
      },
      {
        url: "https://example.com/expert-analysis-4",
        title: `Expert Analysis of ${topic.target_keyword}`,
        snippet: "Professional insights and analysis from recognized experts in the field with practical examples."
      }
    ];

    // Store source snippets in database
    const sourceInserts = mockSources.map(source => ({
      topic_id: topicId,
      user_id: topic.user_id,
      url: source.url,
      title: source.title,
      snippet: source.snippet
    }));

    const { error: snippetError } = await supabase
      .from('source_snippets')
      .insert(sourceInserts);

    if (snippetError) {
      throw new Error(`Failed to save source snippets: ${snippetError.message}`);
    }

    // Update topic with source URLs
    const sourceUrls = mockSources.map(s => s.url);
    const { error: updateError } = await supabase
      .from('topics')
      .update({
        source_urls: sourceUrls,
        status: 'researched',
        updated_at: new Date().toISOString()
      })
      .eq('id', topicId);

    if (updateError) {
      throw new Error(`Failed to update topic: ${updateError.message}`);
    }

    // Create a job entry for tracking
    await supabase
      .from('job_queue')
      .insert({
        job_type: 'research',
        status: 'done',
        job_data: { topic_id: topicId, sources: mockSources },
        attempts: 1
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        sources: mockSources,
        topicId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Research error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});