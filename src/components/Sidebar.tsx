import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Calendar, 
  Globe, 
  Home, 
  Settings, 
  Zap,
  FileText,
  Users
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface SidebarProps {
  selectedTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ selectedTab, onTabChange }: SidebarProps) {
  const location = useLocation();
  
  const navigation = [
    { id: "overview", label: "Overview", icon: Home, path: "/dashboard" },
    { id: "sites", label: "WordPress Sites", icon: Globe, path: "/sites" },
    { id: "campaigns", label: "Campaigns", icon: Zap, path: "/campaigns" },
    { id: "calendar", label: "Calendar", icon: Calendar, path: "/calendar" },
    { id: "posts", label: "Posts", icon: FileText, path: "/posts" },
    { id: "analytics", label: "Analytics", icon: BarChart3, path: "/analytics" },
    { id: "team", label: "Team", icon: Users, path: "/team" },
    { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            WP Genie
          </span>
        </Link>
        
        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-11",
                  isActive && "bg-accent text-accent-foreground"
                )}
                asChild
              >
                <Link to={item.path}>
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}