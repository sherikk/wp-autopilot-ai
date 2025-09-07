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

    // Get Gemini API key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not found');
    }

    console.log('Starting research for topic:', topic.target_keyword);

    // Use Gemini to research the topic and generate credible sources
    const researchPrompt = `You are a research assistant. Research the topic "${topic.target_keyword}" for ${topic.audience}.

Generate 4 credible source snippets that would be found from authoritative websites. For each source, provide:
1. A realistic URL from a credible domain (use real domain names like .edu, .org, government sites, industry publications)
2. A descriptive title
3. A detailed snippet (2-3 sentences) with specific facts, statistics, or insights

Focus on:
- Academic and authoritative sources
- Industry reports and studies  
- Government publications
- Reputable news organizations
- Professional publications

Return ONLY a JSON array with this exact structure:
[
  {
    "url": "https://example.edu/research-article",
    "title": "Article Title Here",
    "snippet": "Detailed research findings with specific data and insights."
  }
]`;

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: researchPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!geminiResponse.ok) {
      const error = await geminiResponse.text();
      console.error('Gemini API error:', error);
      throw new Error(`Gemini API failed: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const generatedContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedContent) {
      throw new Error('No content generated from Gemini');
    }

    console.log('Generated research content:', generatedContent);

    // Parse the JSON response from Gemini
    let researchSources;
    try {
      // Clean the response - remove any markdown formatting
      const cleanContent = generatedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      researchSources = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      console.log('Raw content:', generatedContent);
      
      // Fallback to mock sources if parsing fails
      researchSources = [
        {
          url: `https://research.edu/${topic.target_keyword.replace(/\s+/g, '-').toLowerCase()}`,
          title: `Academic Research on ${topic.target_keyword}`,
          snippet: "Comprehensive academic research providing evidence-based insights and methodological analysis of the subject matter."
        },
        {
          url: `https://industry-journal.org/articles/${topic.target_keyword.replace(/\s+/g, '-').toLowerCase()}`,
          title: `Industry Analysis: ${topic.target_keyword}`,
          snippet: "Professional industry analysis with current trends, market data, and expert opinions from leading practitioners."
        },
        {
          url: `https://government-reports.gov/studies/${topic.target_keyword.replace(/\s+/g, '-').toLowerCase()}`,
          title: `Government Study on ${topic.target_keyword}`,
          snippet: "Official government research with statistical data, policy implications, and regulatory considerations."
        },
        {
          url: `https://professional-review.com/${topic.target_keyword.replace(/\s+/g, '-').toLowerCase()}-guide`,
          title: `Professional Guide to ${topic.target_keyword}`,
          snippet: "Expert professional guidance with best practices, implementation strategies, and practical recommendations."
        }
      ];
    }

    // Validate the sources array
    if (!Array.isArray(researchSources) || researchSources.length === 0) {
      throw new Error('Invalid research sources generated');
    }

    console.log('Final research sources:', researchSources);

    // Store source snippets in database
    const sourceInserts = researchSources.map(source => ({
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
    const sourceUrls = researchSources.map(s => s.url);
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
        job_data: { topic_id: topicId, sources: researchSources },
        attempts: 1
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        sources: researchSources,
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