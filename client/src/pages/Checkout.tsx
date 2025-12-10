import { useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Upload, Check, AlertCircle, QrCode, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { useCart } from "@/contexts/CartContext";
import { apiRequest } from "@/lib/queryClient";
import { getSupabase } from "@/lib/supabase";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Store } from "@shared/schema";

export default function Checkout() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { items, store, getTotalAmount, clearCart } = useCart();
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const searchParams = new URLSearchParams(window.location.search);
  const pickupTime = searchParams.get("time") || "";
  const notes = searchParams.get("notes") || "";
  const totalAmount = getTotalAmount();

  const { data: storeData } = useQuery<Store>({
    queryKey: ["/api/stores", store?.id],
    enabled: !!store?.id,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentProof(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const createOrder = useMutation({
    mutationFn: async () => {
      if (!store) throw new Error("No store selected");
      
      setIsUploading(true);
      
      let paymentProofUrl = null as string | null;
      if (paymentProof) {
        const supabase = getSupabase();
        const fileName = `${Date.now()}-${paymentProof.name}`.replace(/\s+/g, "-");
        const filePath = `payment_proof/${store.id}/${fileName}`;
        const { error: uploadErr } = await supabase.storage.from("public").upload(filePath, paymentProof, {
          upsert: true,
          cacheControl: "3600",
          contentType: paymentProof.type,
        });
        if (uploadErr) throw new Error(uploadErr.message);
        const { data: pub } = await supabase.storage.from("public").getPublicUrl(filePath);
        paymentProofUrl = pub.publicUrl;
      }
      
      return apiRequest("POST", "/api/orders", {
        storeId: store.id,
        pickupTime,
        notes,
        totalAmount: totalAmount.toString(),
        paymentProofUrl,
        items: items.map((item) => ({
          mealId: item.meal.id,
          quantity: item.quantity,
          price: item.meal.price,
        })),
      });
    },
    onSuccess: (data: any) => {
      clearCart();
      toast({
        title: "Order placed!",
        description: "Your order has been submitted. Please wait for confirmation.",
      });
      navigate(`/orders/${data.id}`);
    },
    onError: (error) => {
      setIsUploading(false);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in to place an order.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!store || items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No items to checkout</h2>
          <p className="text-muted-foreground mb-6">Please add items to your cart first</p>
          <Link href="/">
            <Button>Browse Stores</Button>
          </Link>
        </div>
      </div>
    );
  }

  const gcashQrUrl = storeData?.gcashQrUrl;

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <Link href="/cart">
          <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to cart
          </Button>
        </Link>

        <h1 className="text-2xl font-bold mb-6">Complete Payment</h1>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <QrCode className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Step 1: Scan QR Code</h3>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                Scan the store's GCash QR code below to make your payment of{" "}
                <span className="font-semibold text-primary">₱{totalAmount.toFixed(2)}</span>
              </p>

              {gcashQrUrl ? (
                <div className="bg-white p-4 rounded-lg flex items-center justify-center">
                  <img
                    src={gcashQrUrl}
                    alt="GCash QR Code"
                    className="max-w-[280px] w-full h-auto"
                    data-testid="img-gcash-qr"
                  />
                </div>
              ) : (
                <div className="bg-muted rounded-lg p-8 text-center">
                  <QrCode className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No QR code available. Please contact the store directly.
                  </p>
                </div>
              )}

              <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Paying to:</span>{" "}
                  <span className="text-primary">{store.name}</span>
                </p>
                <p className="text-sm mt-1">
                  <span className="font-medium">Amount:</span>{" "}
                  <span className="text-primary font-semibold">₱{totalAmount.toFixed(2)}</span>
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Step 2: Upload Payment Proof</h3>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                After paying, take a screenshot and upload it here for verification
              </p>

              <div
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover-elevate"
                onClick={() => fileInputRef.current?.click()}
                data-testid="upload-area"
              >
                {previewUrl ? (
                  <div className="space-y-4">
                    <img
                      src={previewUrl}
                      alt="Payment proof"
                      className="max-h-48 mx-auto rounded-lg"
                      data-testid="img-payment-proof-preview"
                    />
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <Check className="h-4 w-4" />
                      <span className="text-sm font-medium">Image selected</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Click to select a different image
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                      <Image className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium">Click to upload</p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG up to 5MB
                    </p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                data-testid="input-payment-proof"
              />
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Order Summary</h3>
              
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <Avatar className="h-10 w-10">
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
                  <p className="font-medium">{store.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Pickup: {pickupTime}
                  </p>
                </div>
              </div>
              
              <div className="py-4 space-y-2">
                {items.map((item) => (
                  <div key={item.meal.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.meal.name} x{item.quantity}
                    </span>
                    <span>₱{(parseFloat(item.meal.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              {notes && (
                <div className="py-2 border-t border-border">
                  <p className="text-sm text-muted-foreground">Notes: {notes}</p>
                </div>
              )}
              
              <div className="pt-4 border-t border-border">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-primary">₱{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Important</p>
                  <p className="text-muted-foreground">
                    Your order will be reviewed by the store staff. Once they confirm your payment, 
                    you'll receive a notification and your order will be prepared.
                  </p>
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
            onClick={() => createOrder.mutate()}
            disabled={!paymentProof || createOrder.isPending || isUploading}
            data-testid="button-place-order"
          >
            {createOrder.isPending || isUploading ? "Processing..." : "Place Order"}
          </Button>
        </div>
      </div>
    </div>
  );
}
