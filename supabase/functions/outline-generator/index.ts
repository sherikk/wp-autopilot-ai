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
      .select('*, projects(*)')
      .eq('id', topicId)
      .single();

    if (topicError || !topic) {
      throw new Error('Topic not found');
    }

    // Create outline using OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: topic.model_name || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You write factual, structured outlines for web articles. You never invent statistics. You ask for citations where needed. Return JSON only.'
          },
          {
            role: 'user',
            content: `Create an outline for "${topic.target_keyword}" for ${topic.audience}. Intent: ${topic.search_intent}. Length: about ${topic.length_words} words.

Include:
- H2/H3 outline as JSON array with structure [{"level": 2, "heading": "Introduction", "description": "Brief overview"}, ...]
- 5-8 facts that must be cited as array ["fact1", "fact2", ...]
- 5 suggested FAQs as array [{"question": "...", "answer": "..."}]
- Draft SEO title <= 60 chars
- Meta description 150-160 chars

Return JSON only with structure: {"outline": [], "facts": [], "faqs": [], "seoTitle": "", "metaDescription": ""}`
          }
        ],
        max_tokens: 2000,
        temperature: topic.temperature || 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
    }

    const openaiData = await openaiResponse.json();
    const outlineContent = openaiData.choices[0].message.content;
    
    let parsedOutline;
    try {
      parsedOutline = JSON.parse(outlineContent);
    } catch (e) {
      // Try to extract JSON from the response if it's wrapped in markdown
      const jsonMatch = outlineContent.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        parsedOutline = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse outline JSON');
      }
    }

    // Update topic with outline
    const { error: updateError } = await supabase
      .from('topics')
      .update({
        outline_json: parsedOutline,
        seo_title: parsedOutline.seoTitle,
        meta_description: parsedOutline.metaDescription,
        status: 'outlined',
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
        job_type: 'outline',
        status: 'done',
        job_data: { topic_id: topicId, outline: parsedOutline },
        attempts: 1
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        outline: parsedOutline,
        topicId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Outline generation error:', error);
    
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