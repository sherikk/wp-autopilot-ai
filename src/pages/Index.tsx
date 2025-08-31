import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, CheckCircle, Globe, Sparkles, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-image.jpg";

const Index = () => {
  const features = [
    {
      icon: Globe,
      title: "Multi-Site Management",
      description: "Connect and manage multiple WordPress sites from a single dashboard"
    },
    {
      icon: Zap,
      title: "AI Content Generation", 
      description: "Create high-quality blog posts and thumbnails using advanced AI models"
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Schedule posts by exact datetime, intervals, or rolling schedules"
    },
    {
      icon: CheckCircle,
      title: "Quality Assurance",
      description: "Built-in checks for word count, duplication, and content quality"
    }
  ];

  const stats = [
    { number: "10K+", label: "Posts Generated" },
    { number: "500+", label: "Sites Connected" }, 
    { number: "98.2%", label: "Success Rate" },
    { number: "50hrs", label: "Time Saved Weekly" }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                WP Genie
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button variant="gradient" asChild>
                <Link to="/auth">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <Badge variant="outline" className="gap-2 bg-accent/50">
                  <Sparkles className="w-4 h-4" />
                  AI-Powered WordPress Automation
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                  Automate Your
                  <span className="bg-gradient-primary bg-clip-text text-transparent"> WordPress </span>
                  Content Creation
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Generate high-quality blog posts, create stunning thumbnails, and schedule content across multiple WordPress sites - all powered by AI.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="gradient" size="lg" className="gap-2" asChild>
                  <Link to="/auth">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="gap-2">
                  Watch Demo
                  <Globe className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex items-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Free 14-day trial
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Cancel anytime
                </div>
              </div>
            </div>
            
            <div className="lg:pl-8">
              <div className="relative">
                <img 
                  src={heroImage}
                  alt="WordPress automation dashboard showing AI content generation"
                  className="rounded-2xl shadow-elegant w-full"
                />
                <div className="absolute -bottom-6 -left-6 bg-card border border-border rounded-lg p-4 shadow-elegant">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-success/20 text-success rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">5 Posts Published</div>
                      <div className="text-xs text-muted-foreground">Last 2 hours</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Everything you need to automate WordPress
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From content creation to publishing, WP Genie handles the entire workflow so you can focus on growing your business.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="shadow-elegant border-0 text-center">
                  <CardHeader>
                    <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary">
        <div className="max-w-4xl mx-auto text-center px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to automate your WordPress content?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of content creators who save hours every week with WP Genie.
          </p>
          <Button 
            variant="secondary" 
            size="lg" 
            className="gap-2 bg-white text-primary hover:bg-white/90"
            asChild
          >
            <Link to="/auth">
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;