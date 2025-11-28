import { useState } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { items, getTotalPrice, clear } = useCart();
  const { toast } = useToast();
  const [pickupTime, setPickupTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">No items in cart</p>
          <Button onClick={() => setLocation("/")} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const handleCheckout = async () => {
    if (!pickupTime) {
      toast({
        title: "Error",
        description: "Please select a pickup time",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // For now, just redirect to orders page
      // In production, this would create the order in the backend
      clear();
      toast({ title: "Order placed successfully!" });
      await queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setLocation("/orders");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to place order",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Pickup Time</h2>
              <Input
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                data-testid="input-pickup-time"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Select when you'll pick up your order
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Order Items</h2>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.mealId} className="flex justify-between" data-testid={`order-item-${item.mealId}`}>
                    <span>{item.name} x{item.quantity}</span>
                    <span>₱{(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="p-6 h-fit sticky top-20">
            <h2 className="font-bold text-lg mb-4">Order Total</h2>
            <div className="flex justify-between mb-6 pb-6 border-b border-border">
              <span>Subtotal</span>
              <span>₱{getTotalPrice()}</span>
            </div>
            <div className="flex justify-between font-bold mb-6">
              <span>Total</span>
              <span className="text-lg">₱{getTotalPrice()}</span>
            </div>
            <Button
              className="w-full"
              onClick={handleCheckout}
              disabled={isLoading}
              data-testid="button-place-order"
            >
              {isLoading ? "Placing order..." : "Place Order"}
            </Button>
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => setLocation("/cart")}
              disabled={isLoading}
              data-testid="button-back-to-cart"
            >
              Back to Cart
            </Button>
          </Card>
        </div>
      </main>
    </div>
  );
}
