import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreVertical, Plus, UserPlus, Mail, Shield, Eye, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Team = () => {
  const [selectedTab, setSelectedTab] = useState("team");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("");
  const { toast } = useToast();

  const teamMembers = [
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah@wpgenie.com",
      role: "owner", 
      avatar: "/placeholder.svg",
      joinedAt: "2023-12-01",
      lastActive: "2 hours ago",
      sitesAccess: ["All Sites"]
    },
    {
      id: 2,
      name: "Mike Chen",
      email: "mike@company.com",
      role: "editor",
      avatar: "/placeholder.svg", 
      joinedAt: "2024-01-15",
      lastActive: "1 day ago",
      sitesAccess: ["TechBlog.com", "BusinessHub.co"]
    },
    {
      id: 3,
      name: "Emma Davis",
      email: "emma@freelancer.net",
      role: "viewer",
      avatar: "/placeholder.svg",
      joinedAt: "2024-01-20",
      lastActive: "3 hours ago",
      sitesAccess: ["LifestyleMag.net"]
    }
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner": return "default";
      case "editor": return "secondary";
      case "viewer": return "outline";
      default: return "outline";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner": return Shield;
      case "editor": return Edit;
      case "viewer": return Eye;
      default: return Eye;
    }
  };

  const handleInviteMember = () => {
    if (!newMemberEmail || !newMemberRole) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Invitation Sent",
      description: `An invitation has been sent to ${newMemberEmail}`,
    });
    
    setNewMemberEmail("");
    setNewMemberRole("");
  };

  const handleRemoveMember = (memberId: number, memberName: string) => {
    toast({
      title: "Member Removed",
      description: `${memberName} has been removed from the team.`,
      variant: "destructive"
    });
  };

  const handleChangeRole = (memberId: number, memberName: string, newRole: string) => {
    toast({
      title: "Role Updated",
      description: `${memberName}'s role has been changed to ${newRole}.`,
    });
  };

  return (
    <div className="flex min-h-screen bg-gradient-subtle">
      <Sidebar selectedTab={selectedTab} onTabChange={setSelectedTab} />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Team Management</h1>
              <p className="text-muted-foreground">Manage team members and their access permissions</p>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="gradient" size="lg" className="gap-2">
                  <Plus className="w-5 h-5" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to add a new member to your team.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email"
                      type="email"
                      placeholder="member@company.com"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">Editor - Can create and manage campaigns</SelectItem>
                        <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    variant="gradient" 
                    className="w-full gap-2"
                    onClick={handleInviteMember}
                  >
                    <UserPlus className="w-4 h-4" />
                    Send Invitation
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Role Explanation */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="shadow-elegant border-0">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Owner</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Full access to all features, billing, and team management. Can connect/disconnect sites.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="shadow-elegant border-0">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Edit className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Editor</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Can create campaigns, manage content, and run automation jobs. No billing access.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="shadow-elegant border-0">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Viewer</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Read-only access to campaigns, analytics, and posts. Cannot make changes.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Team Members List */}
          <Card className="shadow-elegant border-0">
            <CardHeader>
              <CardTitle>Team Members ({teamMembers.length})</CardTitle>
              <CardDescription>Manage your team members and their permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member) => {
                  const RoleIcon = getRoleIcon(member.role);
                  return (
                    <div key={member.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{member.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {member.email}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Last active: {member.lastActive}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <Badge 
                            variant={getRoleColor(member.role)}
                            className="gap-1 mb-1"
                          >
                            <RoleIcon className="w-3 h-3" />
                            {member.role}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            Access: {member.sitesAccess.join(", ")}
                          </div>
                        </div>
                        
                        {member.role !== "owner" && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Manage {member.name}</DialogTitle>
                                <DialogDescription>Update role or remove from team</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Change Role</Label>
                                  <Select 
                                    defaultValue={member.role}
                                    onValueChange={(newRole) => handleChangeRole(member.id, member.name, newRole)}
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="editor">Editor</SelectItem>
                                      <SelectItem value="viewer">Viewer</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button 
                                  variant="destructive" 
                                  className="w-full"
                                  onClick={() => handleRemoveMember(member.id, member.name)}
                                >
                                  Remove from Team
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Team;