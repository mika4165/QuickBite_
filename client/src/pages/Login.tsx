import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { UtensilsCrossed } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        toast({ title: "Login successful!" });
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        setLocation("/");
      } else {
        const data = await response.json();
        toast({
          title: "Login failed",
          description: data.message || "Invalid email or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-2">QuickBite</h1>
          <p className="text-muted-foreground">Smart Meal Pre-Order System</p>
        </div>

        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Customer Login</h2>
            <p className="text-sm text-muted-foreground">Sign in with your email and password</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                data-testid="input-email"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Password</label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                data-testid="input-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? "Logging in..." : "Log In"}
            </Button>
          </form>

          <div className="space-y-4 mb-6">
            <div>
              <h3 className="text-sm font-semibold mb-2">New Customer?</h3>
              <p className="text-xs text-muted-foreground mb-4">Create your account to start ordering meals</p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLocation("/register")}
              data-testid="button-create-account"
            >
              Create Account
            </Button>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3">
              Are you a merchant? Contact the admin to apply
            </p>
            <a href="https://forms.gle/QotJYMzE85Lqe1Xj6" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="w-full text-xs" data-testid="button-merchant-form">
                Merchant Application Form
              </Button>
            </a>
          </div>
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Secure email/password authentication
        </p>
      </div>
    </div>
  );
}
