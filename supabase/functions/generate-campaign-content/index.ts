import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CampaignData {
  id: string
  name: string
  global_prompt: string
  thumbnail_prompt?: string
  target_categories: string[]
  site_id: string
  user_id: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { campaignId } = await req.json()
    
    if (!campaignId) {
      throw new Error('Campaign ID is required')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      throw new Error(`Campaign not found: ${campaignError?.message}`)
    }

    console.log('Generating content for campaign:', campaign.name)

    // Generate content using Gemini
    const prompt = `
Based on this campaign prompt: "${campaign.global_prompt}"

Generate a blog post with the following requirements:
- Create an engaging title (max 60 characters for SEO)
- Write compelling, original content (800-1200 words)
- Include relevant keywords naturally
- Structure with proper headings and paragraphs
- Make it valuable and informative for readers

Format the response as JSON with this structure:
{
  "title": "Generated title here",
  "content": "Generated content here with proper HTML formatting",
  "tags": ["tag1", "tag2", "tag3"]
}
`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`)
    }

    const geminiResponse = await response.json()
    const generatedText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText) {
      throw new Error('No content generated from Gemini')
    }

    // Parse the JSON response from Gemini
    let contentData
    try {
      // Extract JSON from the response (Gemini sometimes wraps it in markdown)
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[0] : generatedText
      contentData = JSON.parse(jsonString)
    } catch (parseError) {
      // Fallback if JSON parsing fails
      contentData = {
        title: `${campaign.name} - ${new Date().toLocaleDateString()}`,
        content: generatedText,
        tags: ['blog', 'content']
      }
    }

    // Create the post record
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: campaign.user_id,
        campaign_id: campaign.id,
        site_id: campaign.site_id,
        title: contentData.title,
        content: contentData.content,
        tags: contentData.tags || [],
        status: 'draft',
        category_name: campaign.target_categories?.[0] || 'uncategorized'
      })
      .select()
      .single()

    if (postError) {
      throw new Error(`Failed to create post: ${postError.message}`)
    }

    console.log('Post created successfully:', post.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        postId: post.id,
        title: contentData.title 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating campaign content:', error)
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