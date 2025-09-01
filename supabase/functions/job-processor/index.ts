import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JobQueueItem {
  id: string;
  job_type: string;
  job_data: Record<string, any>;
  status: string;
  attempts: number;
  max_attempts: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Job processor started');

    // Fetch pending jobs that are ready to process
    const { data: pendingJobs, error: fetchError } = await supabase
      .from('job_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(10); // Process 10 jobs at a time

    if (fetchError) {
      console.error('Error fetching jobs:', fetchError);
      throw fetchError;
    }

    if (!pendingJobs || pendingJobs.length === 0) {
      console.log('No pending jobs found');
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No pending jobs' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter jobs that haven't exceeded max attempts
    const eligibleJobs = pendingJobs.filter(job => job.attempts < job.max_attempts);

    if (eligibleJobs.length === 0) {
      console.log('No eligible jobs found (all have exceeded max attempts)');
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No eligible jobs' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${eligibleJobs.length} jobs`);
    const results = [];

    for (const job of eligibleJobs as JobQueueItem[]) {
      try {
        console.log(`Processing job ${job.id} of type ${job.job_type}`);
        
        // Mark job as processing
        await supabase
          .from('job_queue')
          .update({ 
            status: 'processing',
            attempts: job.attempts + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);

        let jobResult;
        
        switch (job.job_type) {
          case 'generate_titles':
            jobResult = await processTitleGenerationJob(supabase, job);
            break;
          default:
            throw new Error(`Unknown job type: ${job.job_type}`);
        }

        if (jobResult.success) {
          // Mark job as completed
          await supabase
            .from('job_queue')
            .update({ 
              status: 'completed',
              updated_at: new Date().toISOString()
            })
            .eq('id', job.id);
          
          console.log(`Job ${job.id} completed successfully`);
        } else {
          throw new Error(jobResult.error || 'Job processing failed');
        }

        results.push({ jobId: job.id, success: true });

      } catch (error) {
        console.error(`Job ${job.id} failed:`, error);
        
        // Check if we should retry or mark as failed
        const shouldRetry = job.attempts + 1 < job.max_attempts;
        const nextStatus = shouldRetry ? 'pending' : 'failed';
        const nextScheduled = shouldRetry 
          ? new Date(Date.now() + Math.pow(2, job.attempts) * 60000).toISOString() // Exponential backoff
          : null;

        await supabase
          .from('job_queue')
          .update({ 
            status: nextStatus,
            error_message: error.message,
            updated_at: new Date().toISOString(),
            ...(nextScheduled && { scheduled_for: nextScheduled })
          })
          .eq('id', job.id);

        results.push({ jobId: job.id, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Job processing completed: ${successCount} successful, ${failureCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        successful: successCount,
        failed: failureCount,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Job processor error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function processTitleGenerationJob(supabase: any, job: JobQueueItem) {
  try {
    const { schedule_item_id, campaign_id, global_prompt } = job.job_data;
    
    if (!schedule_item_id || !campaign_id || !global_prompt) {
      throw new Error('Missing required job data: schedule_item_id, campaign_id, or global_prompt');
    }

    console.log(`Generating title for schedule item ${schedule_item_id}`);

    // Check for duplicate titles in the last 90 days for this user
    const { data: recentTitles } = await supabase
      .from('campaign_schedule')
      .select('title, user_id')
      .eq('user_id', (await supabase
        .from('campaign_schedule')
        .select('user_id')
        .eq('id', schedule_item_id)
        .single()).data?.user_id)
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .not('title', 'is', null);

    const existingTitles = recentTitles?.map(t => t.title?.toLowerCase()) || [];

    // Generate title using Gemini API
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const prompt = `
Based on this campaign theme: "${global_prompt}"

Generate 1 unique, engaging blog post title that:
- Is 45-65 characters long
- Is SEO-friendly and compelling
- Is completely different from these existing titles: ${existingTitles.slice(0, 20).join(', ')}
- Avoids overused phrases like "Ultimate Guide" or "10 Ways"
- Is specific and actionable

Return only the title, no quotes or additional text.
    `.trim();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 100,
            temperature: 0.9
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    const generatedTitle = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!generatedTitle) {
      throw new Error('No title generated by Gemini API');
    }

    // Validate title length
    if (generatedTitle.length < 20 || generatedTitle.length > 80) {
      console.warn(`Generated title length (${generatedTitle.length}) outside ideal range, but proceeding`);
    }

    // Check for duplicates
    const normalizedTitle = generatedTitle.toLowerCase();
    const isDuplicate = existingTitles.some(existing => 
      existing && normalizedTitle.includes(existing) || existing.includes(normalizedTitle)
    );

    if (isDuplicate) {
      console.warn('Generated title is similar to existing titles, but proceeding');
    }

    // Update the schedule item with the generated title and change status to 'created'
    const { error: updateError } = await supabase
      .from('campaign_schedule')
      .update({ 
        title: generatedTitle,
        status: 'created',
        updated_at: new Date().toISOString()
      })
      .eq('id', schedule_item_id);

    if (updateError) {
      throw new Error(`Failed to update schedule item: ${updateError.message}`);
    }

    // Log the generation for audit trail
    await supabase
      .from('title_generations')
      .insert({
        schedule_item_id,
        title: generatedTitle,
        title_source: 'ai',
        prompt_used: prompt,
        model_version: 'gemini-1.5-flash-latest',
        generation_metadata: {
          campaign_id,
          global_prompt,
          title_length: generatedTitle.length,
          generated_at: new Date().toISOString()
        }
      });

    console.log(`Successfully generated title for schedule item ${schedule_item_id}: "${generatedTitle}"`);

    return { success: true, title: generatedTitle };

  } catch (error) {
    console.error('Title generation job failed:', error);
    
    // Update schedule item status to failed_generation
    await supabase
      .from('campaign_schedule')
      .update({ 
        status: 'failed_generation',
        error_code: 'TITLE_GENERATION_FAILED',
        error_message: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', job.job_data.schedule_item_id);

    return { success: false, error: error.message };
  }
}