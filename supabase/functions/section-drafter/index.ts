import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topicId } = await req.json();
    
    if (!topicId) {
      return new Response(
        JSON.stringify({ error: 'Topic ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting section drafting for topic:', topicId);

    // Get topic details with related project
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select(`
        *,
        projects (
          name,
          brand_tone,
          default_model
        )
      `)
      .eq('id', topicId)
      .single();

    if (topicError || !topic) {
      console.error('Error fetching topic:', topicError);
      return new Response(
        JSON.stringify({ error: 'Topic not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!topic.outline_json) {
      return new Response(
        JSON.stringify({ error: 'Topic must have an outline before drafting' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get source snippets for citations
    const { data: sourceSnippets, error: snippetsError } = await supabase
      .from('source_snippets')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true });

    if (snippetsError) {
      console.error('Error fetching source snippets:', snippetsError);
    }

    const sources = sourceSnippets || [];
    console.log(`Found ${sources.length} source snippets for topic`);

    // Update topic status to drafting
    await supabase
      .from('topics')
      .update({ status: 'drafting' })
      .eq('id', topicId);

    // Generate content for each section
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const outline = topic.outline_json as Record<string, any>;
    const sections = Object.entries(outline);
    let fullContent = `# ${topic.seo_title || topic.target_keyword}\n\n`;

    console.log(`Processing ${sections.length} sections`);

    for (let i = 0; i < sections.length; i++) {
      const [sectionTitle, sectionContent] = sections[i];
      
      console.log(`Drafting section: ${sectionTitle}`);

      // Create citations text from sources
      const citationsText = sources.length > 0 
        ? sources.map((source, idx) => `[${idx + 1}] ${source.title} - ${source.snippet}`).join('\n')
        : 'No specific sources available for this topic.';

      // Build comprehensive prompt for section
      const sectionPrompt = `You are writing a section of a comprehensive article about "${topic.target_keyword}" for ${topic.audience}.

ARTICLE CONTEXT:
- Target Keyword: ${topic.target_keyword}
- Audience: ${topic.audience}
- Search Intent: ${topic.search_intent}
- Brand Tone: ${topic.projects?.brand_tone || 'professional'}
- Target Length: ${topic.length_words} words total

SECTION TO WRITE:
- Section Title: ${sectionTitle}
- Section Outline: ${typeof sectionContent === 'string' ? sectionContent : JSON.stringify(sectionContent)}

AVAILABLE SOURCES FOR CITATIONS:
${citationsText}

WRITING REQUIREMENTS:
1. Write in a ${topic.projects?.brand_tone || 'professional'} tone suitable for ${topic.audience}
2. Use Grade 7-8 reading level for accessibility
3. Include citations using [1], [2], [3] format where sources are referenced
4. Make the content informative and engaging
5. Use proper markdown formatting with headers, lists, and emphasis
6. Aim for approximately ${Math.floor((topic.length_words || 1000) / sections.length)} words for this section
7. Ensure the content flows naturally and addresses the section outline comprehensively

Write the complete section content now:`;

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: topic.model_name || 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are an expert content writer specializing in creating comprehensive, well-researched articles with proper citations.'
              },
              {
                role: 'user',
                content: sectionPrompt
              }
            ],
            max_tokens: Math.min(4000, Math.floor((topic.length_words || 1000) / sections.length) * 2),
            temperature: topic.temperature || 0.7,
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const sectionText = data.choices[0].message.content;

        // Add section to full content
        fullContent += `\n## ${sectionTitle}\n\n${sectionText}\n\n`;

        console.log(`Completed section: ${sectionTitle} (${sectionText.length} characters)`);

      } catch (sectionError) {
        console.error(`Error generating section ${sectionTitle}:`, sectionError);
        // Add placeholder for failed section
        fullContent += `\n## ${sectionTitle}\n\n*[Content generation failed for this section. Please edit manually.]*\n\n`;
      }
    }

    // Add citations section at the end
    if (sources.length > 0) {
      fullContent += '\n## References\n\n';
      sources.forEach((source, index) => {
        fullContent += `[${index + 1}] [${source.title}](${source.url})\n`;
      });
    }

    console.log(`Generated full content: ${fullContent.length} characters`);

    // Update topic with generated content
    const { error: updateError } = await supabase
      .from('topics')
      .update({
        draft_markdown: fullContent,
        status: 'needs_review',
        updated_at: new Date().toISOString()
      })
      .eq('id', topicId);

    if (updateError) {
      console.error('Error updating topic:', updateError);
      throw updateError;
    }

    // Add job to queue for tracking
    await supabase
      .from('job_queue')
      .insert({
        job_type: 'section_draft',
        job_data: {
          topic_id: topicId,
          sections_processed: sections.length,
          content_length: fullContent.length
        },
        status: 'completed'
      });

    console.log('Section drafting completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Content drafted successfully',
        sections_processed: sections.length,
        content_length: fullContent.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in section-drafter function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});