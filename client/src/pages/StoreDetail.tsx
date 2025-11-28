import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import type { Store, Meal } from "@shared/schema";

export default function StoreDetail() {
  const [, params] = useRoute("/store/:id");
  const storeId = parseInt(params?.id || "0");
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { toast } = useToast();

  const { data: store, isLoading: storeLoading } = useQuery<Store>({
    queryKey: ["/api/stores", storeId],
  });

  const { data: meals, isLoading: mealsLoading } = useQuery<Meal[]>({
    queryKey: ["/api/stores", storeId, "meals"],
  });

  const handleAddToCart = (meal: Meal) => {
    addItem({
      mealId: meal.id,
      name: meal.name,
      price: meal.price,
      quantity,
    });
    toast({ title: `${meal.name} added to cart!` });
    setSelectedMeal(null);
    setQuantity(1);
  };

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-64 w-full rounded-lg mb-8" />
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">Store not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {store.bannerImageUrl && (
          <div className="aspect-video rounded-lg overflow-hidden mb-8 bg-muted">
            <img src={store.bannerImageUrl} alt={store.name} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{store.name}</h1>
          <p className="text-muted-foreground">{store.description}</p>
        </div>

        <h2 className="text-2xl font-bold mb-6">Menu</h2>

        {mealsLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : meals && meals.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meals.map((meal) => (
              <Card key={meal.id} className="overflow-hidden hover-elevate cursor-pointer" data-testid={`card-meal-${meal.id}`}>
                {meal.imageUrl && (
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img src={meal.imageUrl} alt={meal.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold mb-1">{meal.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{meal.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold">₱{parseFloat(meal.price).toFixed(2)}</span>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedMeal(meal);
                        setQuantity(1);
                      }}
                      data-testid={`button-add-${meal.id}`}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No meals available</p>
        )}

        {selectedMeal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-sm p-6">
              <h2 className="text-xl font-bold mb-4">{selectedMeal.name}</h2>
              <p className="text-muted-foreground mb-4">{selectedMeal.description}</p>
              <p className="text-lg font-bold mb-4">₱{parseFloat(selectedMeal.price).toFixed(2)}</p>
              
              <div className="mb-6">
                <label className="text-sm font-medium block mb-2">Quantity</label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    data-testid="button-decrease-qty"
                  >
                    −
                  </Button>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="text-center"
                    data-testid="input-quantity"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setQuantity(quantity + 1)}
                    data-testid="button-increase-qty"
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedMeal(null)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleAddToCart(selectedMeal)}
                  data-testid="button-confirm-add"
                >
                  Add to Cart
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
