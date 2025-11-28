import { createContext, useContext, useState, useCallback } from "react";
import type { Meal, Store } from "@shared/schema";

export interface CartItem {
  meal: Meal;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  store: Store | null;
  addItem: (meal: Meal, store: Store) => void;
  removeItem: (mealId: number) => void;
  updateQuantity: (mealId: number, quantity: number) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [store, setStore] = useState<Store | null>(null);

  const addItem = useCallback((meal: Meal, newStore: Store) => {
    setItems((prev) => {
      if (store && store.id !== newStore.id) {
        setStore(newStore);
        return [{ meal, quantity: 1 }];
      }
      
      const existing = prev.find((item) => item.meal.id === meal.id);
      if (existing) {
        return prev.map((item) =>
          item.meal.id === meal.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      if (!store) {
        setStore(newStore);
      }
      
      return [...prev, { meal, quantity: 1 }];
    });
  }, [store]);

  const removeItem = useCallback((mealId: number) => {
    setItems((prev) => {
      const filtered = prev.filter((item) => item.meal.id !== mealId);
      if (filtered.length === 0) {
        setStore(null);
      }
      return filtered;
    });
  }, []);

  const updateQuantity = useCallback((mealId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(mealId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.meal.id === mealId ? { ...item, quantity } : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    setStore(null);
  }, []);

  const getTotalAmount = useCallback(() => {
    return items.reduce(
      (total, item) => total + parseFloat(item.meal.price) * item.quantity,
      0
    );
  }, [items]);

  const getTotalItems = useCallback(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        store,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotalAmount,
        getTotalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
