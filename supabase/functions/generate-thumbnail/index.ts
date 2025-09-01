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
    console.log('=== Thumbnail generation function started ===');
    
    const { prompt, title } = await req.json();
    console.log('Request received with:', { prompt: !!prompt, title: !!title });
    
    if (!prompt && !title) {
      console.log('Missing prompt and title');
      return new Response(
        JSON.stringify({ error: 'Either prompt or title is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    console.log('OpenAI API Key status:', !!openAIApiKey);
    
    if (!openAIApiKey) {
      console.error('OpenAI API key is not configured in environment');
      throw new Error('OpenAI API key not configured');
    }

    // Create a comprehensive prompt for thumbnail generation
    const thumbnailPrompt = prompt || `Create a professional, eye-catching thumbnail image for a blog post titled "${title}". The image should be modern, clean, and visually appealing with vibrant colors that would work well as a featured image for a blog post.`;
    console.log('Generated prompt:', thumbnailPrompt.substring(0, 100) + '...');

    console.log('Making request to OpenAI API...');
    const requestBody = {
      model: 'dall-e-3',
      prompt: thumbnailPrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard'
    };
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('OpenAI API response status:', response.status);
    console.log('OpenAI API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI API response data structure:', Object.keys(data));
    
    if (!data.data || !data.data[0]) {
      console.error('Invalid response structure from OpenAI API:', JSON.stringify(data));
      throw new Error('Invalid response from OpenAI API - missing data array');
    }

    const imageUrl = data.data[0].url;
    console.log('Image URL received:', !!imageUrl);
    console.log('=== Thumbnail generated successfully ===');

    return new Response(
      JSON.stringify({ 
        success: true, 
        image: imageUrl
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('=== ERROR in generate-thumbnail function ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
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