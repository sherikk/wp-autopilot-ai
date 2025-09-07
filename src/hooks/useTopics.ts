import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

export interface Topic {
  id: string
  project_id: string
  user_id: string
  status: 'idea' | 'outlined' | 'drafting' | 'needs_review' | 'scheduled' | 'published' | 'failed'
  target_keyword: string
  search_intent: 'info' | 'commercial' | 'transactional' | 'navigational'
  audience: string
  length_words: number
  outline_json?: any
  source_urls?: string[]
  draft_markdown?: string
  seo_title?: string
  meta_description?: string
  slug?: string
  featured_image_url?: string
  quality_score?: number
  plagiarism_score?: number
  model_name: string
  temperature: number
  scheduled_at?: string
  created_at: string
  updated_at: string
}

export const useTopics = () => {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchTopics = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching topics:', error)
        toast.error('Failed to fetch topics')
        return
      }

      setTopics((data || []) as Topic[])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to fetch topics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTopics()
  }, [user])

  const createTopic = async (topicData: Partial<Topic>) => {
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from('topics')
        .insert({
          user_id: user.id,
          target_keyword: topicData.target_keyword || '',
          audience: topicData.audience || '',
          project_id: topicData.project_id || '',
          model_name: topicData.model_name || 'gpt-4o-mini',
          temperature: topicData.temperature || 0.7,
          length_words: topicData.length_words || 1000,
          search_intent: topicData.search_intent || 'info',
          status: 'idea'
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating topic:', error)
        toast.error('Failed to create topic')
        return null
      }

      toast.success('Topic created successfully')
      await fetchTopics()
      return data
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to create topic')
      return null
    }
  }

  const updateTopic = async (topicId: string, updates: Partial<Topic>) => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from('topics')
        .update(updates)
        .eq('id', topicId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error updating topic:', error)
        toast.error('Failed to update topic')
        return false
      }

      toast.success('Topic updated successfully')
      await fetchTopics()
      return true
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to update topic')
      return false
    }
  }

  const deleteTopic = async (topicId: string) => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from('topics')
        .delete()
        .eq('id', topicId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error deleting topic:', error)
        toast.error('Failed to delete topic')
        return false
      }

      toast.success('Topic deleted successfully')
      await fetchTopics()
      return true
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to delete topic')
      return false
    }
  }

  const generateOutline = async (topicId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('outline-generator', {
        body: { topicId }
      })

      if (error) {
        throw error
      }

      if (data.success) {
        toast.success('Outline generated successfully')
        await fetchTopics()
        return data
      } else {
        throw new Error(data.error || 'Failed to generate outline')
      }
    } catch (error) {
      console.error('Outline generation error:', error)
      toast.error(error.message || 'Failed to generate outline')
      return null
    }
  }

  const runResearch = async (topicId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('research-engine', {
        body: { topicId }
      })

      if (error) {
        throw error
      }

      if (data.success) {
        toast.success('Research completed successfully')
        await fetchTopics()
        return data
      } else {
        throw new Error(data.error || 'Failed to run research')
      }
    } catch (error) {
      console.error('Research error:', error)
      toast.error(error.message || 'Failed to run research')
      return null
    }
  }

  return {
    topics,
    loading,
    createTopic,
    updateTopic,
    deleteTopic,
    generateOutline,
    runResearch,
    refetch: fetchTopics
  }
}