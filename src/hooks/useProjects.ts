import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

export interface Project {
  id: string
  user_id: string
  name: string
  brand_tone: string
  default_model: string
  wp_site_url?: string
  wp_user?: string
  wp_app_password_encrypted?: string
  created_at: string
  updated_at: string
}

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchProjects = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching projects:', error)
        toast.error('Failed to fetch projects')
        return
      }

      setProjects(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to fetch projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [user])

  const createProject = async (projectData: Partial<Project>) => {
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: projectData.name || '',
          ...projectData,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating project:', error)
        toast.error('Failed to create project')
        return null
      }

      toast.success('Project created successfully')
      await fetchProjects()
      return data
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to create project')
      return null
    }
  }

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error updating project:', error)
        toast.error('Failed to update project')
        return false
      }

      toast.success('Project updated successfully')
      await fetchProjects()
      return true
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to update project')
      return false
    }
  }

  const deleteProject = async (projectId: string) => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error deleting project:', error)
        toast.error('Failed to delete project')
        return false
      }

      toast.success('Project deleted successfully')
      await fetchProjects()
      return true
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to delete project')
      return false
    }
  }

  return {
    projects,
    loading,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects
  }
}