import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";

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
      const response = await import("@/lib/queryClient").then(m => m.apiRequest("POST", "/api/login", { email, password }));
      if (response) {
        toast({ title: "Login successful!" });
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        const profile = await queryClient.fetchQuery({ queryKey: ["/api/auth/user"] });
        if ((profile as any)?.role === "admin") {
          setLocation("/admin");
        } else if ((profile as any)?.role === "staff") {
          setLocation("/staff");
        } else {
          setLocation("/");
        }
      } else {
        toast({
          title: "Login failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      const msg = (error as Error)?.message || "An error occurred during login";
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-muted px-3 py-2 border border-border text-sm hover-elevate"
              aria-label="Go back"
              data-testid="button-back-login"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background border border-border">
                <ArrowLeft className="h-3.5 w-3.5" />
              </span>
              Back
            </Button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">or</span>
            </div>
          </div>

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
              Are you a merchant? Contact the admin to apply via the form
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => setLocation("/merchant")}
              data-testid="button-merchant-form"
            >
              Merchant Application Form
            </Button>
          </div>
        </Card>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Secure email/password authentication • Your data is stored safely
          </p>
        </div>
      </div>
    </div>
  );
}
