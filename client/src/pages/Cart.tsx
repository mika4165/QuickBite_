import { Link, useLocation } from "wouter";
import { ArrowLeft, Minus, Plus, Trash2, Clock, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Header } from "@/components/Header";
import { useCart } from "@/contexts/CartContext";

function parseStorePickupTimes(store: any | null): string[] {
  const cat = store?.category || "";
  if (typeof cat === "string" && cat.startsWith("CFG:")) {
    try {
      const cfg = JSON.parse(cat.slice(4));
      const slots = Array.isArray(cfg?.slots) ? cfg.slots : [];
      return slots.map((s: any) => String(s.time)).filter(Boolean);
    } catch {
      return [];
    }
  }
  return [];
}

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  
  // Generate slots from 10:00 AM to 6:00 PM in 30-minute intervals
  let hour = 10;
  let minute = 0;
  
  // Generate slots until 6:00 PM (18:00)
  while (hour < 18) {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const timeString = `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
    slots.push(timeString);
    
    // Move to next 30-minute slot
    minute += 30;
    if (minute >= 60) {
      minute = 0;
      hour += 1;
    }
  }
  
  // Add 6:00 PM
  slots.push("6:00 PM");
  
  return slots;
}

export default function Cart() {
  const [, navigate] = useLocation();
  const { items, store, updateQuantity, removeItem, clearCart, getTotalAmount } = useCart();
  const [pickupTime, setPickupTime] = useState("");
  const [storePickupTimes, setStorePickupTimes] = useState<string[]>([]);
  useEffect(() => {
    setStorePickupTimes(parseStorePickupTimes(store));
  }, [store]);
  const [notes, setNotes] = useState("");
  const totalAmount = getTotalAmount();

  const handleProceedToPayment = () => {
    if (!pickupTime) return;
    const params = new URLSearchParams({
      time: pickupTime,
      notes: notes,
    });
    navigate(`/checkout?${params.toString()}`);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">
            Start ordering by browsing our stores
          </p>
          <Link href="/">
            <Button data-testid="button-browse-stores">Browse Stores</Button>
          </Link>
        </div>
      </div>
    );
  }

  const defaultImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop";

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <Link href={store ? `/store/${store.id}` : "/"}>
          <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {store?.name || "store"}
          </Button>
        </Link>

        <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {store && (
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage 
                      src={store.logoUrl || undefined} 
                      alt={store.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {store.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{store.name}</h3>
                    <p className="text-sm text-muted-foreground">{store.category}</p>
                  </div>
                </div>
              </Card>
            )}

            {items.map((item) => (
              <Card key={item.meal.id} className="p-4" data-testid={`cart-item-${item.meal.id}`}>
                <div className="flex gap-4">
                  <img
                    src={item.meal.imageUrl || defaultImage}
                    alt={item.meal.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-medium line-clamp-1">{item.meal.name}</h4>
                        <p className="text-primary font-semibold">
                          ₱{parseFloat(item.meal.price).toFixed(2)}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeItem(item.meal.id)}
                        className="text-destructive"
                        data-testid={`button-remove-${item.meal.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => updateQuantity(item.meal.id, item.quantity - 1)}
                        data-testid={`button-decrease-${item.meal.id}`}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => updateQuantity(item.meal.id, item.quantity + 1)}
                        data-testid={`button-increase-${item.meal.id}`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <span className="ml-auto font-semibold">
                        ₱{(parseFloat(item.meal.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            <Button
              variant="outline"
              onClick={clearCart}
              className="text-destructive"
              data-testid="button-clear-cart"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cart
            </Button>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Pickup Details</h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">
                    <Clock className="h-4 w-4 inline mr-2" />
                    Pickup Time
                  </Label>
                  <Select value={pickupTime} onValueChange={setPickupTime}>
                    <SelectTrigger data-testid="select-pickup-time">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        // Use store pickup times if available, otherwise generate default slots
                        const availableTimes = storePickupTimes.length 
                          ? storePickupTimes 
                          : generateTimeSlots();
                        
                        // Filter out times after 6:00 PM
                        return availableTimes
                          .filter((time) => {
                            // Check if time is after 6:00 PM
                            const [timePart, period] = time.split(" ");
                            const [hours] = timePart.split(":").map(Number);
                            let hour24 = hours;
                            if (period === "PM" && hours !== 12) {
                              hour24 = hours + 12;
                            } else if (period === "AM" && hours === 12) {
                              hour24 = 0;
                            }
                            
                            // Only allow times up to 6:00 PM
                            if (hour24 > 18) return false;
                            
                            return true;
                          })
                          .map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                          ));
                      })()}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block">Notes (optional)</Label>
                  <Textarea
                    placeholder="Any special requests..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    data-testid="input-notes"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Order Summary</h3>
              
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.meal.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.meal.name} x{item.quantity}
                    </span>
                    <span>₱{(parseFloat(item.meal.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                
                <div className="border-t border-border my-2" />
                
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-primary" data-testid="text-total">
                    ₱{totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-xl font-bold text-primary">₱{totalAmount.toFixed(2)}</p>
          </div>
          <Button
            size="lg"
            onClick={handleProceedToPayment}
            disabled={!pickupTime}
            data-testid="button-proceed-payment"
          >
            Proceed to Payment
          </Button>
        </div>
      </div>
    </div>
  );
}
