import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Zap, Construction } from "lucide-react";

const Team = () => {
  const [selectedTab, setSelectedTab] = useState("team");

  return (
    <div className="flex min-h-screen bg-gradient-subtle">
      <Sidebar selectedTab={selectedTab} onTabChange={setSelectedTab} />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Team Management</h1>
              <p className="text-muted-foreground">Collaborate with your team members</p>
            </div>
          </div>

          {/* Coming Soon Card */}
          <Card className="shadow-elegant border-0 text-center py-16">
            <CardContent>
              <Construction className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
              <CardTitle className="text-2xl mb-4">Team Management Coming Soon</CardTitle>
              <CardDescription className="max-w-md mx-auto mb-8">
                We're working on team collaboration features that will allow you to invite team members, 
                assign roles, and manage permissions across your WordPress automation workflows.
              </CardDescription>
              
              <div className="grid md:grid-cols-3 gap-6 max-w-2xl mx-auto mt-8">
                <div className="p-4 border border-border rounded-lg">
                  <Users className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h3 className="font-medium mb-2">Role-Based Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Assign specific roles and permissions to team members
                  </p>
                </div>
                
                <div className="p-4 border border-border rounded-lg">
                  <Zap className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h3 className="font-medium mb-2">Shared Campaigns</h3>
                  <p className="text-sm text-muted-foreground">
                    Collaborate on content campaigns and automation workflows
                  </p>
                </div>
                
                <div className="p-4 border border-border rounded-lg">
                  <Construction className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h3 className="font-medium mb-2">Activity Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Monitor team activity and content creation progress
                  </p>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-muted rounded-lg max-w-md mx-auto">
                <p className="text-sm font-medium mb-2">Want early access?</p>
                <p className="text-xs text-muted-foreground">
                  Contact us to be notified when team features become available.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Team;