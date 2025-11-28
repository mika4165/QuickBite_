import { Clock, ShoppingBag, Star, ArrowRight, UtensilsCrossed, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";

const features = [
  {
    icon: Clock,
    title: "Skip the Line",
    description: "Pre-order your meals and pick them up at your chosen time. No more waiting!",
  },
  {
    icon: ShoppingBag,
    title: "Fresh & Hot",
    description: "Meals are prepared just in time for your pickup, ensuring freshness and quality.",
  },
  {
    icon: Star,
    title: "Rate & Review",
    description: "Share your experience and help others find the best food on campus.",
  },
];

const steps = [
  { number: 1, title: "Browse Stores", description: "Explore canteen stores and their menus" },
  { number: 2, title: "Select Meals", description: "Add your favorite items to cart" },
  { number: 3, title: "Pay via GCash", description: "Scan QR and upload payment proof" },
  { number: 4, title: "Pick Up", description: "Get your meal at your chosen time" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-xl">QuickBite</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a href="/login">
              <Button data-testid="button-login-header">Log In</Button>
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/20" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-2 mb-6">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Smart Meal Pre-Order System</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                Skip the line,
                <span className="text-primary block mt-2">grab your meal!</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Pre-order your meals from the school canteen. Pay ahead, choose your pickup time, 
                and enjoy fresh food without the wait.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/login">
                  <Button size="lg" className="w-full sm:w-auto" data-testid="button-get-started">
                    Get Started
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </a>
                <a href="https://forms.gle/QotJYMzE85Lqe1Xj6" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto" data-testid="button-be-merchant">
                    Be a Merchant
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Why QuickBite?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Say goodbye to long queues and cold food. QuickBite makes your break time matter.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="p-6 text-center">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Four simple steps to your perfect meal
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step, index) => (
                <div key={step.number} className="relative">
                  <Card className="p-6 h-full">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-4">
                      {step.number}
                    </div>
                    <h3 className="font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </Card>
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                      <ArrowRight className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Order?</h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Join your classmates and start pre-ordering your meals today!
            </p>
            <a href="/login">
              <Button 
                size="lg" 
                variant="secondary" 
                className="bg-background text-foreground hover:bg-background/90"
                data-testid="button-login-cta"
              >
                Log In to Get Started
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </a>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>QuickBite - Smart Meal Pre-Order System</p>
        </div>
      </footer>
    </div>
  );
}
