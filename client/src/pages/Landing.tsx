import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed } from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-xl text-foreground">QuickBite</span>
          </div>
          <div className="flex gap-2">
            <a href="https://forms.gle/QotJYMzE85Lqe1Xj6" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" className="text-foreground" data-testid="button-be-merchant">Be a Merchant</Button>
            </a>
            <Button onClick={() => setLocation("/login")} data-testid="button-login">Log In</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-32 flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-primary">
              <UtensilsCrossed className="h-5 w-5" />
              <span className="text-sm font-semibold">Smart Meal Pre-Order System</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold">
              <span className="text-foreground">Skip the line,</span>
              <br />
              <span className="text-primary">grab your meal!</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Pre-order your meals from the school canteen. Pay ahead, choose your pickup time, and enjoy fresh food without the wait.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" onClick={() => setLocation("/register")} className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-get-started">
              Get Started
            </Button>
            <a href="https://forms.gle/QotJYMzE85Lqe1Xj6" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-foreground text-foreground hover:bg-foreground/10" data-testid="button-merchant-apply">
                Be a Merchant
              </Button>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
