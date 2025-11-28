import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { StoreWithRating } from "@shared/schema";
import { Header } from "@/components/Header";
import { ChefHat, Store } from "lucide-react";

export default function StaffSignup() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: stores, isLoading } = useQuery<StoreWithRating[]>({
    queryKey: ["/api/stores"],
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/staff/apply", {
        storeId: parseInt(selectedStoreId),
      });
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted!",
        description: "Your staff application has been submitted. You'll be redirected shortly.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setTimeout(() => {
        navigate("/");
      }, 2000);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!selectedStoreId) {
      toast({
        title: "Error",
        description: "Please select a store.",
        variant: "destructive",
      });
      return;
    }
    applyMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-slate-950 dark:to-slate-900">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card className="p-8">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <ChefHat className="h-8 w-8 text-primary" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center mb-2">Join as Staff</h1>
            <p className="text-center text-muted-foreground mb-8">
              Apply to work at a QuickBite store and start managing orders
            </p>

            <div className="space-y-6">
              <div>
                <Label htmlFor="store-select" className="text-base font-semibold mb-3 block">
                  Select Your Store
                </Label>
                <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                  <SelectTrigger id="store-select" data-testid="select-store">
                    <SelectValue placeholder="Choose a store..." />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoading ? (
                      <div className="p-2 text-muted-foreground">Loading stores...</div>
                    ) : stores?.length ? (
                      stores.map((store) => (
                        <SelectItem key={store.id} value={store.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4" />
                            {store.name}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-muted-foreground">No stores available</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => setShowConfirm(true)}
                disabled={!selectedStoreId || applyMutation.isPending}
                className="w-full"
                size="lg"
                data-testid="button-apply-staff"
              >
                {applyMutation.isPending ? "Applying..." : "Apply as Staff"}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                Already approved? Sign in with your account to access the staff dashboard.
              </p>
            </div>
          </Card>
        </div>
      </main>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to apply as staff at {stores?.find((s) => s.id.toString() === selectedStoreId)?.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              data-testid="button-cancel-confirm"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowConfirm(false);
                handleSubmit();
              }}
              data-testid="button-confirm-apply"
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
