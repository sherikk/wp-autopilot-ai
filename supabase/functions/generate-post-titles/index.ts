import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { globalPrompt, count } = await req.json();
    
    if (!globalPrompt || !count) {
      return new Response(
        JSON.stringify({ error: 'Global prompt and count are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    console.log(`Generating ${count} post titles for prompt:`, globalPrompt);

    // Create a prompt to generate multiple post titles
    const prompt = `
Based on this campaign theme: "${globalPrompt}"

Generate exactly ${count} unique, engaging blog post titles that would work well for this campaign. Each title should be:
- SEO-friendly (50-60 characters max)
- Unique and compelling
- Related to the campaign theme
- Suitable for blog posts

Format the response as a JSON array of strings:
["Title 1", "Title 2", "Title 3", ...]
`;

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
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const geminiResponse = await response.json();
    const generatedText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No titles generated from Gemini');
    }

    // Parse the JSON response from Gemini
    let titles;
    try {
      // Extract JSON from the response (Gemini sometimes wraps it in markdown)
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : generatedText;
      titles = JSON.parse(jsonString);
    } catch (parseError) {
      // Fallback if JSON parsing fails - split by lines and clean up
      titles = generatedText
        .split('\n')
        .filter(line => line.trim() && !line.includes('```'))
        .map(line => line.replace(/^\d+\.\s*/, '').replace(/^["'\-\s]+|["'\s]+$/g, ''))
        .slice(0, count);
    }

    // Ensure we have the right number of titles
    if (!Array.isArray(titles) || titles.length === 0) {
      throw new Error('Failed to generate valid titles');
    }

    // Pad with generic titles if we don't have enough
    while (titles.length < count) {
      titles.push(`Blog Post ${titles.length + 1}`);
    }

    // Trim to exact count requested
    titles = titles.slice(0, count);

    console.log('Generated titles:', titles);

    return new Response(
      JSON.stringify({ 
        success: true, 
        titles: titles
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-post-titles function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});