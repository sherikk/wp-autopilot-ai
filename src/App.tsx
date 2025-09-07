import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import WordPressSites from "./pages/WordPressSites";
import Campaigns from "./pages/Campaigns";
import Topics from "./pages/Topics";
import TopicDetail from "./pages/TopicDetail";
import Calendar from "./pages/Calendar";
import Posts from "./pages/Posts";
import Analytics from "./pages/Analytics";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <AppSidebar />
            
            <div className="flex-1 flex flex-col">
              {/* Header with sidebar trigger */}
              <header className="h-14 flex items-center border-b bg-background px-4">
                <SidebarTrigger />
                <div className="flex-1" />
              </header>

              {/* Main content */}
              <main className="flex-1 overflow-auto">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/wordpress-sites" element={<ProtectedRoute><WordPressSites /></ProtectedRoute>} />
                  <Route path="/topics" element={<ProtectedRoute><Topics /></ProtectedRoute>} />
                  <Route path="/topics/:id" element={<ProtectedRoute><TopicDetail /></ProtectedRoute>} />
                  <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
                  <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
                  <Route path="/posts" element={<ProtectedRoute><Posts /></ProtectedRoute>} />
                  <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                  <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
