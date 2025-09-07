import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTopics } from '@/hooks/useTopics'
import { useProjects } from '@/hooks/useProjects'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MoreHorizontal, Plus, Upload, Play, Eye, Trash2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

const Topics = () => {
  const navigate = useNavigate()
  const { topics, loading, createTopic, deleteTopic, generateOutline, runResearch } = useTopics()
  const { projects } = useProjects()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false)
  const [csvContent, setCsvContent] = useState('')
  const [selectedProject, setSelectedProject] = useState('')

  const [newTopic, setNewTopic] = useState({
    project_id: '',
    target_keyword: '',
    audience: '',
    search_intent: 'info' as const,
    length_words: 1000,
    model_name: 'gpt-4o-mini',
    temperature: 0.7
  })

  const statusColors = {
    idea: 'bg-gray-500',
    outlined: 'bg-blue-500',
    drafting: 'bg-yellow-500',
    needs_review: 'bg-orange-500',
    scheduled: 'bg-purple-500',
    published: 'bg-green-500',
    failed: 'bg-red-500'
  }

  const handleCreateTopic = async () => {
    if (!newTopic.project_id || !newTopic.target_keyword || !newTopic.audience) {
      toast.error('Please fill in all required fields')
      return
    }

    const created = await createTopic(newTopic)
    if (created) {
      setIsCreateDialogOpen(false)
      setNewTopic({
        project_id: '',
        target_keyword: '',
        audience: '',
        search_intent: 'info',
        length_words: 1000,
        model_name: 'gpt-4o-mini',
        temperature: 0.7
      })
    }
  }

  const handleBatchImport = async () => {
    if (!csvContent.trim() || !selectedProject) {
      toast.error('Please select a project and add CSV content')
      return
    }

    const lines = csvContent.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    
    if (!headers.includes('targetKeyword') || !headers.includes('audience')) {
      toast.error('CSV must include targetKeyword and audience columns')
      return
    }

    const topics = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
      const topicData: any = { project_id: selectedProject }
      
      headers.forEach((header, index) => {
        if (header === 'targetKeyword') topicData.target_keyword = values[index]
        else if (header === 'audience') topicData.audience = values[index]
        else if (header === 'searchIntent') topicData.search_intent = values[index] || 'info'
        else if (header === 'lengthWords') topicData.length_words = parseInt(values[index]) || 1000
      })
      
      return topicData
    })

    let successCount = 0
    for (const topic of topics) {
      const created = await createTopic(topic)
      if (created) successCount++
    }

    toast.success(`Created ${successCount} topics successfully`)
    setIsBatchDialogOpen(false)
    setCsvContent('')
    setSelectedProject('')
  }

  const handleRunPipeline = async (topicId: string, currentStatus: string) => {
    if (currentStatus === 'idea') {
      await generateOutline(topicId)
    } else if (currentStatus === 'outlined') {
      await runResearch(topicId)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading topics...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Topics</h1>
          <p className="text-muted-foreground">Manage your content topics and pipeline</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Batch Import
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Batch Import Topics</DialogTitle>
                <DialogDescription>
                  Import topics from CSV. Format: targetKeyword,audience,searchIntent,lengthWords
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="project">Project</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="csv">CSV Content</Label>
                  <Textarea
                    id="csv"
                    placeholder={`targetKeyword,audience,searchIntent,lengthWords
"best wireless earbuds under 100","budget shoppers","commercial",1200
"how to clean a dishwasher","homeowners","info",1400`}
                    value={csvContent}
                    onChange={(e) => setCsvContent(e.target.value)}
                    rows={10}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBatchDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBatchImport}>Import Topics</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Topic
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Topic</DialogTitle>
                <DialogDescription>
                  Add a new topic to your content pipeline
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="project" className="text-right">Project</Label>
                  <Select value={newTopic.project_id} onValueChange={(value) => setNewTopic(prev => ({ ...prev, project_id: value }))}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="keyword" className="text-right">Keyword</Label>
                  <Input
                    id="keyword"
                    value={newTopic.target_keyword}
                    onChange={(e) => setNewTopic(prev => ({ ...prev, target_keyword: e.target.value }))}
                    className="col-span-3"
                    placeholder="e.g., best wireless earbuds"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="audience" className="text-right">Audience</Label>
                  <Input
                    id="audience"
                    value={newTopic.audience}
                    onChange={(e) => setNewTopic(prev => ({ ...prev, audience: e.target.value }))}
                    className="col-span-3"
                    placeholder="e.g., budget shoppers"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="intent" className="text-right">Intent</Label>
                  <Select value={newTopic.search_intent} onValueChange={(value: any) => setNewTopic(prev => ({ ...prev, search_intent: value }))}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Informational</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="transactional">Transactional</SelectItem>
                      <SelectItem value="navigational">Navigational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="length" className="text-right">Length</Label>
                  <Input
                    id="length"
                    type="number"
                    value={newTopic.length_words}
                    onChange={(e) => setNewTopic(prev => ({ ...prev, length_words: parseInt(e.target.value) || 1000 }))}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTopic}>Create Topic</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Topics</CardTitle>
          <CardDescription>
            {topics.length} topics in your pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Keyword</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Intent</TableHead>
                <TableHead>Length</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topics.map((topic) => (
                <TableRow key={topic.id}>
                  <TableCell className="font-medium">
                    {topic.target_keyword}
                  </TableCell>
                  <TableCell>{topic.audience}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[topic.status]}>
                      {topic.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{topic.search_intent}</TableCell>
                  <TableCell>{topic.length_words} words</TableCell>
                  <TableCell>
                    {new Date(topic.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleRunPipeline(topic.id, topic.status)}>
                          <Play className="mr-2 h-4 w-4" />
                          Run Pipeline
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/topics/${topic.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => deleteTopic(topic.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {topics.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No topics yet. Create your first topic to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Topics