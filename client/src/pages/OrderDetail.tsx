import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle, Send, Phone, Clock, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { OrderStatusProgress } from "@/components/OrderStatusProgress";
import { ChatBubble } from "@/components/ChatBubble";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { OrderWithDetails, MessageWithSender } from "@shared/schema";
import { format } from "date-fns";

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: order, isLoading } = useQuery<OrderWithDetails>({
    queryKey: ["/api/orders", id],
  });

  const { data: messages } = useQuery<MessageWithSender[]>({
    queryKey: ["/api/orders", id, "messages"],
    enabled: !!id,
    refetchInterval: 3000,
  });

  const sendMessage = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/orders/${id}/messages`, {
        content: message,
      });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/orders", id, "messages"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage.mutate();
  };

  const defaultImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-48 rounded-lg mb-6" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Order not found</h2>
          <Link href="/orders">
            <Button>Go to My Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <Link href="/orders">
          <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to orders
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Order #{order.id}</h2>
                <span className="text-sm text-muted-foreground">
                  {order.createdAt
                    ? format(new Date(order.createdAt), "MMM d, yyyy 'at' h:mm a")
                    : ""}
                </span>
              </div>

              <OrderStatusProgress status={order.status || "pending_payment"} />
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={order.store?.logoUrl || undefined}
                    alt={order.store?.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {order.store?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{order.store?.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Pickup: {order.pickupTime}
                  </p>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.meal?.imageUrl || defaultImage}
                      alt={item.meal?.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.meal?.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">
                      ₱{(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {order.notes && (
                <div className="border-t border-border mt-4 pt-4">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Notes:</span> {order.notes}
                  </p>
                </div>
              )}

              <div className="border-t border-border mt-4 pt-4 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg text-primary">
                  ₱{parseFloat(order.totalAmount || "0").toFixed(2)}
                </span>
              </div>
            </Card>

            {order.paymentProofUrl && (
              <Card className="p-6">
                <h3 className="font-semibold mb-3">Payment Proof</h3>
                <img
                  src={order.paymentProofUrl}
                  alt="Payment proof"
                  className="max-h-64 rounded-lg"
                  data-testid="img-payment-proof"
                />
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="h-[500px] flex flex-col">
              <div className="p-4 border-b border-border flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Messages</h3>
              </div>

              <ScrollArea className="flex-1 p-4">
                {messages && messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <ChatBubble
                        key={msg.id}
                        message={msg}
                        isOwn={msg.senderId === user?.id}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No messages yet. Start a conversation with the store.
                    </p>
                  </div>
                )}
              </ScrollArea>

              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    data-testid="input-message"
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!message.trim() || sendMessage.isPending}
                    data-testid="button-send"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
