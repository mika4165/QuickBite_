import { Plus, Minus, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import type { Meal, Store } from "@shared/schema";

interface MealCardProps {
  meal: Meal;
  store: Store;
}

export function MealCard({ meal, store }: MealCardProps) {
  const { items, addItem, removeItem, updateQuantity } = useCart();
  const cartItem = items.find((item) => item.meal.id === meal.id);
  const quantity = cartItem?.quantity || 0;
  
  const defaultImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop";

  const handleAdd = () => {
    addItem(meal, store);
  };

  const handleRemove = () => {
    if (quantity > 1) {
      updateQuantity(meal.id, quantity - 1);
    } else {
      removeItem(meal.id);
    }
  };

  return (
    <Card 
      className="overflow-hidden hover-elevate"
      data-testid={`card-meal-${meal.id}`}
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={meal.imageUrl || defaultImage}
          alt={meal.name}
          className="w-full h-full object-cover"
          data-testid={`img-meal-${meal.id}`}
        />
        
        <Badge 
          className="absolute top-3 right-3 bg-primary text-primary-foreground font-semibold"
          data-testid={`badge-price-${meal.id}`}
        >
          ₱{parseFloat(meal.price).toFixed(2)}
        </Badge>
        
        {!meal.isAvailable && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Badge variant="destructive" className="text-sm">
              Out of Stock
            </Badge>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 
              className="font-semibold line-clamp-1"
              data-testid={`text-meal-name-${meal.id}`}
            >
              {meal.name}
            </h3>
            {meal.category && (
              <span className="text-xs text-muted-foreground">
                {meal.category}
              </span>
            )}
          </div>
          
          {meal.isAvailable && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-green-600 dark:text-green-400">Available</span>
            </div>
          )}
        </div>
        
        <div className="mb-2">
          <p className="text-lg font-bold text-primary" data-testid={`text-meal-price-${meal.id}`}>
            ₱{parseFloat(meal.price).toFixed(2)}
          </p>
        </div>
        
        {meal.description && (
          <p 
            className="text-sm text-muted-foreground line-clamp-2 mb-3"
            data-testid={`text-meal-description-${meal.id}`}
          >
            {meal.description}
          </p>
        )}
        
        {meal.isAvailable && (
          <div className="flex items-center justify-end gap-2">
            {quantity > 0 ? (
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleRemove}
                  data-testid={`button-decrease-${meal.id}`}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span 
                  className="w-8 text-center font-medium"
                  data-testid={`text-quantity-${meal.id}`}
                >
                  {quantity}
                </span>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleAdd}
                  data-testid={`button-increase-${meal.id}`}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleAdd}
                data-testid={`button-add-${meal.id}`}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
