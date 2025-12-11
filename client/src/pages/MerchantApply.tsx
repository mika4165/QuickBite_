import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getSupabase } from "@/lib/supabase";

export default function MerchantApply() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const submitApp = useMutation({
    mutationFn: async () => {
      const ping = await fetch("/api/_internal/ping").catch(() => null);
      if (ping && ping.ok) {
        const res = await fetch("/api/_internal/submit-merchant-app", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email,
            storeName,
            description: description || undefined,
            password,
          }),
        });
        if (!res.ok) {
          // Get the error message from the response
          const errorText = await res.text().catch(() => "Failed to submit application");
          throw new Error(errorText || "Failed to submit application");
        }
        return { message: "ok" } as any;
      }
      // If internal endpoint is not available, throw an error
      throw new Error("Application submission service is unavailable. Please try again later.");
    },
    onSuccess: () => {
      toast({ title: "Submitted", description: "Your store application is pending approval." });
      setEmail("");
      setStoreName("");
      setDescription("");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => navigate("/"), 1500);
    },
    onError: (e) => {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card className="p-8 space-y-4">
            <h1 className="text-2xl font-bold">Apply as Merchant</h1>
            <p className="text-sm text-muted-foreground">Submit your store details for approval. Once approved, your store will appear in the user dashboard.</p>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Store Name</Label>
              <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="e.g., Mika's Canteen" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters" />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" />
            </div>
            <Button
              onClick={() => {
                if (password.length < 6) {
                  toast({ title: "Weak password", description: "Minimum 6 characters", variant: "destructive" });
                  return;
                }
                if (password !== confirmPassword) {
                  toast({ title: "Passwords do not match", description: "Re-enter to confirm", variant: "destructive" });
                  return;
                }
                submitApp.mutate();
              }}
              disabled={!email || !storeName || submitApp.isPending}
              className="w-full"
            >
              {submitApp.isPending ? "Submitting..." : "Submit Application"}
            </Button>
          </Card>
        </div>
      </main>
    </div>
  );
}
