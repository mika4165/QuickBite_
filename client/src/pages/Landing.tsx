import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, ArrowRight } from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1410] to-[#0f0c0a]">
      <header className="sticky top-0 z-50 bg-[#1a1410]/95 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center">
              <UtensilsCrossed className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-xl text-white">QuickBite</span>
          </div>
          <div className="flex gap-3 items-center">
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <div className="w-5 h-5 rounded-full border-2 border-white/40" />
            </button>
            <Button 
              size="sm"
              onClick={() => setLocation("/login")}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              data-testid="button-login"
            >
              Log in
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-24 flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-2 text-orange-500">
              <UtensilsCrossed className="h-4 w-4" />
              <span className="text-sm font-medium">Smart Meal Pre-Order System</span>
            </div>
            
            <div className="space-y-3">
              <h1 className="text-6xl md:text-7xl font-bold text-white">
                Skip the line,
              </h1>
              <h2 className="text-6xl md:text-7xl font-bold text-orange-500">
                grab your meal!
              </h2>
            </div>
            
            <p className="text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
              Pre-order your meals from the school canteen. Pay ahead, choose your pickup time, and enjoy fresh food without the wait.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button 
              size="lg" 
              onClick={() => setLocation("/register")}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 gap-2"
              data-testid="button-get-started"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              size="lg" 
              variant="ghost"
              onClick={() => window.open("https://forms.gle/QotJYMzE85Lqe1Xj6", "_blank")}
              className="text-white hover:bg-white/10"
              data-testid="button-be-merchant"
            >
              Be a Merchant
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
