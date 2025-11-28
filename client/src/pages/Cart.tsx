import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import { Trash2, ShoppingCart } from "lucide-react";

export default function Cart() {
  const [, setLocation] = useLocation();
  const { items, removeItem, updateQuantity, getTotalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Start by adding some meals!</p>
          <Button onClick={() => setLocation("/")} data-testid="button-continue-shopping">
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.mealId} className="p-4 flex items-center justify-between" data-testid={`cart-item-${item.mealId}`}>
                <div className="flex-1">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-muted-foreground">₱{parseFloat(item.price).toFixed(2)} each</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.mealId, item.quantity - 1)}
                      data-testid={`button-decrease-${item.mealId}`}
                    >
                      −
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.mealId, parseInt(e.target.value) || 1)}
                      className="w-16 text-center"
                      data-testid={`input-qty-${item.mealId}`}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.mealId, item.quantity + 1)}
                      data-testid={`button-increase-${item.mealId}`}
                    >
                      +
                    </Button>
                  </div>

                  <p className="font-semibold min-w-24 text-right">
                    ₱{(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </p>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.mealId)}
                    data-testid={`button-remove-${item.mealId}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-6 h-fit sticky top-20">
            <h2 className="font-bold text-lg mb-4">Order Summary</h2>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₱{getTotalPrice()}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">₱{getTotalPrice()}</span>
              </div>
            </div>
            <Button className="w-full" onClick={() => setLocation("/checkout")} data-testid="button-checkout">
              Proceed to Checkout
            </Button>
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => setLocation("/")}
              data-testid="button-continue"
            >
              Continue Shopping
            </Button>
          </Card>
        </div>
      </main>
    </div>
  );
}
