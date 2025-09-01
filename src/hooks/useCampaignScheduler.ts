import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface SchedulingConfig {
  enabled: boolean
  frequency: 'hourly' | 'daily' | 'weekly'
  lastRun?: string
}

export const useCampaignScheduler = () => {
  const [isGenerating, setIsGenerating] = useState(false)

  const generateContent = async (campaignId: string) => {
    setIsGenerating(true)
    try {
      const { data, error } = await supabase.functions.invoke('generate-campaign-content', {
        body: { campaignId }
      })

      if (error) {
        throw error
      }

      if (data.success) {
        toast.success(`Content generated: ${data.title}`)
        return { success: true, postId: data.postId, title: data.title }
      } else {
        throw new Error(data.error || 'Failed to generate content')
      }
    } catch (error) {
      console.error('Content generation error:', error)
      toast.error(error.message || 'Failed to generate content')
      return { success: false, error: error.message }
    } finally {
      setIsGenerating(false)
    }
  }

  const runScheduler = async () => {
    try {
      toast.info('Running campaign scheduler...')
      
      const { data, error } = await supabase.functions.invoke('campaign-scheduler')

      if (error) {
        throw error
      }

      if (data.success) {
        const successful = data.results.filter((r: any) => r.success).length
        const failed = data.results.filter((r: any) => !r.success).length
        
        toast.success(`Scheduler completed: ${successful} successful, ${failed} failed`)
        return data.results
      } else {
        throw new Error(data.error || 'Scheduler failed')
      }
    } catch (error) {
      console.error('Scheduler error:', error)
      toast.error(error.message || 'Failed to run scheduler')
      return []
    }
  }

  return {
    generateContent,
    runScheduler,
    isGenerating
  }
}