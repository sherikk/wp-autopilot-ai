import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Eye, Edit, Trash2, Clock, Calendar, Image } from 'lucide-react'
import { Post } from '@/hooks/usePosts'

interface PostTableProps {
  posts: Post[]
  onEdit: (post: Post) => void
  onView: (post: Post) => void
  onDelete: (postId: string) => void
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'published': return 'default'
    case 'scheduled': return 'secondary'
    case 'draft': return 'outline'
    case 'failed': return 'destructive'
    default: return 'outline'
  }
}

export const PostTable: React.FC<PostTableProps> = ({ posts, onEdit, onView, onDelete }) => {
  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-32">
          <p className="text-gray-500">No posts in this category</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Title & Content</TableHead>
              <TableHead>Campaign & Site</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Media</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div className="space-y-1">
                    <div className="font-semibold text-sm">{post.title}</div>
                    {post.content && (
                      <div className="text-xs text-muted-foreground line-clamp-2 max-w-[280px]">
                        {post.content.length > 100 
                          ? `${post.content.substring(0, 100)}...` 
                          : post.content}
                      </div>
                    )}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {post.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {post.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{post.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="space-y-1">
                    {post.campaigns && (
                      <div className="text-sm font-medium text-purple-600">
                        {post.campaigns.name}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {post.wordpress_sites?.name || 'No site'}
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge variant={getStatusColor(post.status)}>
                    {post.status}
                  </Badge>
                  {post.error_message && (
                    <div className="text-xs text-red-600 mt-1 max-w-[120px] truncate" title={post.error_message}>
                      {post.error_message}
                    </div>
                  )}
                </TableCell>
                
                <TableCell>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Created: {new Date(post.created_at).toLocaleDateString()}
                    </div>
                    {post.scheduled_for && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <Clock className="w-3 h-3" />
                        Scheduled: {new Date(post.scheduled_for).toLocaleString()}
                      </div>
                    )}
                    {post.published_at && (
                      <div className="flex items-center gap-1 text-green-600">
                        <Eye className="w-3 h-3" />
                        Published: {new Date(post.published_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  {post.featured_image_url && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Image className="w-3 h-3" />
                      Thumbnail
                    </div>
                  )}
                </TableCell>
                
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onEdit(post)}
                      title="Edit post"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    {post.wordpress_post_id && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onView(post)}
                        title="View on WordPress"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" title="Delete post">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Post</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete "{post.title}"? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => {}}>Cancel</Button>
                          <Button 
                            variant="destructive" 
                            onClick={() => onDelete(post.id)}
                          >
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}