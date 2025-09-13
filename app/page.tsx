import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, Shield, Zap } from "lucide-react";

/**
 * The root page component for the application - a modern landing page.
 *
 * @remarks
 * This component serves as the primary entry point and landing page for Polly,
 * showcasing the application's features and value proposition with a clean,
 * xAI-inspired design.
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-slide-up">
              Create Engaging
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {" "}Polls
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
              Gather real insights from your audience with beautiful, interactive polls.
              Share anywhere, track results in real-time, and make data-driven decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <Button size="lg" asChild className="text-lg px-8 py-6">
                <Link href="/signup">Get Started Free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6">
                <Link href="/polls">View Examples</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Subtle background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to create better polls
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to help you engage your audience and gather meaningful insights.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 animate-fade-in">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Quick Setup</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base">
                  Create professional polls in minutes with our intuitive interface and smart templates.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Real-time Analytics</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base">
                  Track responses as they come in with live charts and detailed analytics dashboards.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Easy Sharing</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base">
                  Share your polls anywhere with customizable links, QR codes, and embed options.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Secure & Private</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base">
                  Your data is protected with enterprise-grade security and privacy controls.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to create your first poll?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of users who are already using Polly to gather insights and make better decisions.
            </p>
            <Button size="lg" asChild className="text-lg px-8 py-6">
              <Link href="/signup">Start Creating Polls</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-xl font-bold mb-4">Polly</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                Create engaging polls, gather real insights, and make data-driven decisions with our modern polling platform.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/polls" className="hover:text-foreground transition-colors">My Polls</Link></li>
                <li><Link href="/polls/create" className="hover:text-foreground transition-colors">Create Poll</Link></li>
                <li><Link href="/polls" className="hover:text-foreground transition-colors">Templates</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/help" className="hover:text-foreground transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact Us</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Polly. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
