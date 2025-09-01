import { useState, useMemo, useCallback } from "react";
import { Calendar, momentLocalizer, View } from "react-big-calendar";
import moment from "moment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Filter, Calendar as CalendarIcon, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePosts } from "@/hooks/usePosts";
import { useCampaignSchedule } from "@/hooks/useCampaignSchedule";
import { useWordPressSites } from "@/hooks/useWordPressSites";
import { useCampaigns } from "@/hooks/useCampaigns";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    type: 'post' | 'campaign';
    status: string;
    site: string;
    campaign?: string;
    campaignId?: string;
    originalId: string;
  };
}

interface CalendarViewProps {
  onEventEdit?: (eventId: string, type: 'post' | 'campaign') => void;
  onEventDelete?: (eventId: string, type: 'post' | 'campaign') => void;
}

export function CalendarView({ onEventEdit, onEventDelete }: CalendarViewProps) {
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  
  const { toast } = useToast();
  const { posts, updatePost, loading: postsLoading } = usePosts();
  const { schedules, updateScheduleItem, loading: schedulesLoading } = useCampaignSchedule();
  const { sites } = useWordPressSites();
  const { campaigns } = useCampaigns();

  // Transform posts and schedules into calendar events
  const events = useMemo(() => {
    const postEvents: CalendarEvent[] = posts
      .filter(post => post.scheduled_for)
      .map(post => ({
        id: `post-${post.id}`,
        title: post.title,
        start: new Date(post.scheduled_for!),
        end: new Date(new Date(post.scheduled_for!).getTime() + 60 * 60 * 1000), // 1 hour duration
        resource: {
          type: 'post' as const,
          status: post.status,
          site: post.wordpress_sites?.name || 'Unknown Site',
          originalId: post.id,
        },
      }));

    const campaignEvents: CalendarEvent[] = schedules
      .filter(schedule => schedule.scheduled_for)
      .map(schedule => {
        const campaign = campaigns.find(c => c.id === schedule.campaign_id);
        return {
          id: `campaign-${schedule.id}`,
          title: schedule.title || `AI Post: ${campaign?.name || 'Campaign'}`,
          start: new Date(schedule.scheduled_for),
          end: new Date(new Date(schedule.scheduled_for).getTime() + 60 * 60 * 1000),
          resource: {
            type: 'campaign' as const,
            status: schedule.status || 'planned',
            site: 'Campaign Generated',
            campaign: campaign?.name || 'Unknown Campaign',
            campaignId: schedule.campaign_id,
            originalId: schedule.id,
          },
        };
      });

    return [...postEvents, ...campaignEvents];
  }, [posts, schedules, campaigns]);

  // Filter events based on search and filters
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = searchTerm === "" || 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.resource.site.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesStatus = statusFilter === "all" || event.resource.status === statusFilter;
      const matchesSite = siteFilter === "all" || event.resource.site === siteFilter;
      const matchesCampaign = campaignFilter === "all" || 
        (event.resource.type === 'campaign' && event.resource.campaignId === campaignFilter);
        
      return matchesSearch && matchesStatus && matchesSite && matchesCampaign;
    });
  }, [events, searchTerm, statusFilter, siteFilter, campaignFilter]);

  // Event style function for color coding
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const baseStyle = {
      borderRadius: '4px',
      border: 'none',
      color: 'white',
      fontSize: '12px',
      padding: '2px 6px',
    };

    if (event.resource.type === 'campaign') {
      return {
        style: {
          ...baseStyle,
          backgroundColor: 'hsl(var(--primary))',
          border: '1px solid hsl(var(--primary))',
        }
      };
    }

    // Color by status for regular posts
    switch (event.resource.status) {
      case 'scheduled':
        return {
          style: {
            ...baseStyle,
            backgroundColor: 'hsl(var(--success))',
            border: '1px solid hsl(var(--success))',
          }
        };
      case 'draft':
        return {
          style: {
            ...baseStyle,
            backgroundColor: 'hsl(var(--warning))',
            border: '1px solid hsl(var(--warning))',
          }
        };
      default:
        return {
          style: {
            ...baseStyle,
            backgroundColor: 'hsl(var(--muted))',
            border: '1px solid hsl(var(--muted))',
          }
        };
    }
  }, []);

  // Handle event drag and drop
  const onEventDrop = useCallback(async (args: any) => {
    const { event, start } = args;
    const eventId = event.resource.originalId;
    const eventType = event.resource.type;

    try {
      if (eventType === 'post') {
        await updatePost(eventId, { scheduled_for: start.toISOString() });
        toast({
          title: "Post Rescheduled",
          description: "The post has been rescheduled successfully.",
        });
      } else if (eventType === 'campaign') {
        await updateScheduleItem(eventId, { scheduled_for: start.toISOString() });
        toast({
          title: "Campaign Item Rescheduled",
          description: "The campaign item has been rescheduled successfully.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Reschedule Failed",
        description: error.message || "Failed to reschedule the item.",
        variant: "destructive"
      });
    }
  }, [updatePost, updateScheduleItem, toast]);

  // Handle event resize
  const onEventResize = useCallback(async (args: any) => {
    // For now, we don't need to handle resize as posts don't have duration
    // But we could extend this later for events with specific durations
  }, []);

  // Custom event component
  const EventComponent = ({ event }: { event: CalendarEvent }) => (
    <div className="flex items-center gap-1 text-xs">
      {event.resource.type === 'campaign' && <Zap className="w-3 h-3" />}
      <span className="truncate">{event.title}</span>
    </div>
  );

  // Get unique sites and campaigns for filters
  const availableSites = useMemo(() => {
    const siteNames = Array.from(new Set(events.map(e => e.resource.site)));
    return siteNames.filter(name => name !== 'Campaign Generated');
  }, [events]);

  const availableCampaigns = useMemo(() => {
    return campaigns.map(c => ({ id: c.id, name: c.name }));
  }, [campaigns]);

  const loading = postsLoading || schedulesLoading;

  if (loading) {
    return (
      <Card className="shadow-elegant border-0">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading calendar...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="shadow-elegant border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>

            <Select value={siteFilter} onValueChange={setSiteFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by site" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sites</SelectItem>
                {availableSites.map(site => (
                  <SelectItem key={site} value={site}>{site}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={campaignFilter} onValueChange={setCampaignFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by campaign" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {availableCampaigns.map(campaign => (
                  <SelectItem key={campaign.id} value={campaign.id}>{campaign.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card className="shadow-elegant border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Content Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={view === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('month')}
              >
                Month
              </Button>
              <Button
                variant={view === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('week')}
              >
                Week
              </Button>
              <Button
                variant={view === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('day')}
              >
                Day
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[600px]">
            <Calendar
              localizer={localizer}
              events={filteredEvents}
              startAccessor="start"
              endAccessor="end"
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              eventPropGetter={eventStyleGetter}
              onEventDrop={onEventDrop}
              onEventResize={onEventResize}
              resizable
              draggableAccessor={() => true}
              components={{
                event: EventComponent,
              }}
              popup
              popupOffset={{ x: 30, y: 20 }}
              className="calendar-custom"
            />
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="shadow-elegant border-0">
        <CardHeader>
          <CardTitle>Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary"></div>
              <span className="text-sm">AI Generated Content</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-success"></div>
              <span className="text-sm">Scheduled Posts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-warning"></div>
              <span className="text-sm">Draft Posts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted"></div>
              <span className="text-sm">Other</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}