import { createContext, useContext, useState } from "react";

export interface CartItem {
  mealId: number;
  name: string;
  price: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (mealId: number) => void;
  updateQuantity: (mealId: number, quantity: number) => void;
  clear: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.mealId === item.mealId);
      if (existing) {
        return prev.map((i) =>
          i.mealId === item.mealId ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      return [...prev, item];
    });
  };

  const removeItem = (mealId: number) => {
    setItems((prev) => prev.filter((i) => i.mealId !== mealId));
  };

  const updateQuantity = (mealId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(mealId);
    } else {
      setItems((prev) =>
        prev.map((i) => (i.mealId === mealId ? { ...i, quantity } : i))
      );
    }
  };

  const clear = () => setItems([]);

  const getTotalItems = () => items.reduce((sum, item) => sum + item.quantity, 0);

  const getTotalPrice = () => {
    const total = items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
    return total.toFixed(2);
  };

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clear, getTotalItems, getTotalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
