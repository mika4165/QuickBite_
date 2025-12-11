import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!email || !password || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await import("@/lib/queryClient").then(m => m.apiRequest("POST", "/api/register", { email, password }));
      // Only show success if we actually got a valid response with the correct message
      if (response && response.message === "Account created") {
        toast({ title: "Account created successfully! Please log in." });
        setTimeout(() => setLocation("/login"), 1000);
      } else {
        // If response doesn't have the expected message, treat as error
        toast({
          title: "Registration failed",
          description: response?.message || "An error occurred during registration",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Extract error message - handle both Error objects and string messages
      let errorMessage = "An error occurred during registration";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error && typeof error === "object" && "message" in error) {
        errorMessage = String(error.message);
      }
      
      console.error("Registration error:", error);
      
      // Show error toast - this will display the validation error
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      // Don't navigate on error - let user see the error and try again
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
            <h2 className="text-lg font-semibold mb-2">Create Account</h2>
            <p className="text-sm text-muted-foreground">Sign up to start ordering meals</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                data-testid="input-register-email"
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
                data-testid="input-register-password"
              />
              <p className="text-xs text-muted-foreground mt-1">Minimum 6 characters</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Confirm Password</label>
              <Input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                data-testid="input-confirm-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-6"
              disabled={isLoading}
              data-testid="button-create-account"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="pt-4 border-t border-border mt-6">
            <p className="text-sm text-muted-foreground text-center mb-3">
              Already have an account?
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLocation("/login")}
              data-testid="button-back-to-login"
            >
              Back to Login
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
