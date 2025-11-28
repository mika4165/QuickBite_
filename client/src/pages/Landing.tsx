import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, TrendingUp, Clock, MessageCircle } from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-xl">QuickBite</span>
          </div>
          <div className="flex gap-2">
            <a href="https://forms.gle/QotJYMzE85Lqe1Xj6" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" data-testid="button-be-merchant">Be a Merchant</Button>
            </a>
            <Button onClick={() => setLocation("/login")} data-testid="button-login">Log In</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Smart Meal Pre-Order System</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Skip the lines. Pre-order your meals from school canteens with our payment-first system
          </p>
          <Button size="lg" onClick={() => setLocation("/register")} data-testid="button-get-started">
            Get Started
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-card rounded-lg p-6 border border-border">
            <TrendingUp className="h-12 w-12 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-2">Browse & Order</h3>
            <p className="text-muted-foreground">
              Explore stores, browse meals, and add items to your cart
            </p>
          </div>
          <div className="bg-card rounded-lg p-6 border border-border">
            <Clock className="h-12 w-12 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-2">Pay & Verify</h3>
            <p className="text-muted-foreground">
              Upload GCash payment proof and wait for merchant confirmation
            </p>
          </div>
          <div className="bg-card rounded-lg p-6 border border-border">
            <MessageCircle className="h-12 w-12 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-2">Real-Time Chat</h3>
            <p className="text-muted-foreground">
              Communicate directly with merchants about your orders
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
