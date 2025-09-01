import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Running campaign scheduler...')

    // Get all active campaigns that need to run
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('status', 'active')

    if (campaignsError) {
      throw new Error(`Failed to fetch campaigns: ${campaignsError.message}`)
    }

    console.log(`Found ${campaigns?.length || 0} active campaigns`)

    const results = []

    for (const campaign of campaigns || []) {
      try {
        const schedulingConfig = campaign.scheduling_config || {}
        const { frequency = 'daily', enabled = false, lastRun } = schedulingConfig

        if (!enabled) {
          console.log(`Campaign ${campaign.name} is not enabled for scheduling`)
          continue
        }

        // Check if it's time to run based on frequency
        const now = new Date()
        const lastRunDate = lastRun ? new Date(lastRun) : null
        let shouldRun = false

        switch (frequency) {
          case 'daily':
            shouldRun = !lastRunDate || (now.getTime() - lastRunDate.getTime()) >= 24 * 60 * 60 * 1000
            break
          case 'weekly':
            shouldRun = !lastRunDate || (now.getTime() - lastRunDate.getTime()) >= 7 * 24 * 60 * 60 * 1000
            break
          case 'hourly':
            shouldRun = !lastRunDate || (now.getTime() - lastRunDate.getTime()) >= 60 * 60 * 1000
            break
          default:
            shouldRun = false
        }

        if (!shouldRun) {
          console.log(`Campaign ${campaign.name} not due to run yet`)
          continue
        }

        console.log(`Triggering content generation for campaign: ${campaign.name}`)

        // Call the content generation function
        const generateResponse = await fetch(`${supabaseUrl}/functions/v1/generate-campaign-content`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ campaignId: campaign.id })
        })

        const generateResult = await generateResponse.json()

        if (generateResult.success) {
          // Update the campaign's last run time
          await supabase
            .from('campaigns')
            .update({
              scheduling_config: {
                ...schedulingConfig,
                lastRun: now.toISOString()
              }
            })
            .eq('id', campaign.id)

          results.push({
            campaignId: campaign.id,
            campaignName: campaign.name,
            success: true,
            postId: generateResult.postId,
            title: generateResult.title
          })

          console.log(`✅ Successfully generated content for ${campaign.name}`)
        } else {
          results.push({
            campaignId: campaign.id,
            campaignName: campaign.name,
            success: false,
            error: generateResult.error
          })

          console.error(`❌ Failed to generate content for ${campaign.name}:`, generateResult.error)
        }

      } catch (error) {
        results.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          success: false,
          error: error.message
        })

        console.error(`❌ Error processing campaign ${campaign.name}:`, error)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        processed: results.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Campaign scheduler error:', error)
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