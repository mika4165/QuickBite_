import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  LayoutDashboard,
  Package,
  Clock,
  Check,
  ShoppingBag,
  ChevronRight,
  MessageCircle,
  Send,
  Settings,
  Store,
  UtensilsCrossed,
  Plus,
  Image,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { ChatBubble } from "@/components/ChatBubble";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { OrderWithDetails, Store as StoreType, Meal, MessageWithSender } from "@shared/schema";
import { format } from "date-fns";

const orderTabs = [
  { value: "pending_payment", label: "Pending Payment", icon: Clock },
  { value: "payment_submitted", label: "Payment Submitted", icon: Package },
  { value: "confirmed", label: "Confirmed", icon: Check },
  { value: "ready", label: "Ready", icon: ShoppingBag },
  { value: "claimed", label: "Claimed", icon: Check },
];

export default function StaffDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("payment_submitted");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [message, setMessage] = useState("");

  const { data: store, isLoading: storeLoading } = useQuery<StoreType>({
    queryKey: ["/api/staff/store"],
  });

  const { data: orders, isLoading: ordersLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/staff/orders"],
    refetchInterval: 5000,
  });

  const { data: meals } = useQuery<Meal[]>({
    queryKey: ["/api/staff/meals"],
    enabled: !!store,
  });

  const { data: messages } = useQuery<MessageWithSender[]>({
    queryKey: ["/api/orders", selectedOrder?.id, "messages"],
    enabled: !!selectedOrder,
    refetchInterval: 3000,
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      return apiRequest("PATCH", `/api/staff/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      toast({ title: "Order updated!" });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/orders"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update order status.",
        variant: "destructive",
      });
    },
  });

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!selectedOrder) return;
      return apiRequest("POST", `/api/orders/${selectedOrder.id}/messages`, {
        content: message,
      });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({
        queryKey: ["/api/orders", selectedOrder?.id, "messages"],
      });
    },
  });

  const filteredOrders = orders?.filter((o) => o.status === selectedTab) || [];
  const groupedByTime: Record<string, OrderWithDetails[]> = {};
  filteredOrders.forEach((order) => {
    const time = order.pickupTime || "Unknown";
    if (!groupedByTime[time]) groupedByTime[time] = [];
    groupedByTime[time].push(order);
  });

  const defaultImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop";

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Store Assigned</h2>
          <p className="text-muted-foreground mb-6">
            You don't have a store assigned yet. Please contact an administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={store.logoUrl || undefined}
                alt={store.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {store.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">{store.name}</h1>
              <p className="text-sm text-muted-foreground">Staff Dashboard</p>
            </div>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" data-testid="button-manage-store">
                <Settings className="h-4 w-4 mr-2" />
                Manage Store
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>Store Settings</SheetTitle>
                <SheetDescription>
                  Manage your store details and menu items
                </SheetDescription>
              </SheetHeader>
              <StoreSettings store={store} meals={meals} />
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="w-full justify-start mb-4 overflow-x-auto flex-nowrap">
                {orderTabs.map((tab) => {
                  const count = orders?.filter((o) => o.status === tab.value).length || 0;
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="gap-2"
                      data-testid={`tab-${tab.value}`}
                    >
                      <tab.icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                      {count > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {count}
                        </Badge>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {orderTabs.map((tab) => (
                <TabsContent key={tab.value} value={tab.value}>
                  {ordersLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-lg" />
                      ))}
                    </div>
                  ) : Object.keys(groupedByTime).length > 0 ? (
                    <div className="space-y-6">
                      {Object.entries(groupedByTime).map(([time, timeOrders]) => (
                        <div key={time}>
                          <h3 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Pickup at {time}
                          </h3>
                          <div className="space-y-3">
                            {timeOrders.map((order) => (
                              <StaffOrderCard
                                key={order.id}
                                order={order}
                                onSelect={() => setSelectedOrder(order)}
                                onUpdateStatus={(status) =>
                                  updateOrderStatus.mutate({
                                    orderId: order.id,
                                    status,
                                  })
                                }
                                isUpdating={updateOrderStatus.isPending}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Card className="p-8 text-center">
                      <tab.icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No orders with this status
                      </p>
                    </Card>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <div className="lg:col-span-1">
            <Card className="h-[600px] flex flex-col">
              <div className="p-4 border-b border-border">
                {selectedOrder ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Order #{selectedOrder.id}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedOrder.student?.firstName}{" "}
                        {selectedOrder.student?.lastName}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedOrder(null)}
                    >
                      Close
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Messages</h3>
                  </div>
                )}
              </div>

              <ScrollArea className="flex-1 p-4">
                {selectedOrder ? (
                  messages && messages.length > 0 ? (
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <ChatBubble
                          key={msg.id}
                          message={msg}
                          isOwn={msg.senderId === user?.id}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        No messages with this customer yet
                      </p>
                    </div>
                  )
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Select an order to view messages
                    </p>
                  </div>
                )}
              </ScrollArea>

              {selectedOrder && (
                <div className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage.mutate()}
                    />
                    <Button
                      size="icon"
                      onClick={() => sendMessage.mutate()}
                      disabled={!message.trim() || sendMessage.isPending}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function StaffOrderCard({
  order,
  onSelect,
  onUpdateStatus,
  isUpdating,
}: {
  order: OrderWithDetails;
  onSelect: () => void;
  onUpdateStatus: (status: string) => void;
  isUpdating: boolean;
}) {
  const defaultImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=60&h=60&fit=crop";
  
  const getNextStatus = () => {
    switch (order.status) {
      case "pending_payment":
        return null;
      case "payment_submitted":
        return "confirmed";
      case "confirmed":
        return "ready";
      case "ready":
        return "claimed";
      case "claimed":
        return null;
      default:
        return null;
    }
  };

  const getActionLabel = () => {
    switch (order.status) {
      case "payment_submitted":
        return "Confirm Payment";
      case "confirmed":
        return "Mark Ready";
      case "ready":
        return "Mark Claimed";
      case "claimed":
        return null;
      default:
        return null;
    }
  };

  const nextStatus = getNextStatus();
  const actionLabel = getActionLabel();

  return (
    <Card className="p-4" data-testid={`staff-order-${order.id}`}>
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage
            src={order.student?.profileImageUrl ?? undefined}
            alt={order.student?.firstName ?? ""}
            className="object-cover"
          />
          <AvatarFallback>
            {order.student?.firstName?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="font-medium">
              {order.student?.firstName} {order.student?.lastName}
            </h4>
            <span className="text-sm font-semibold text-primary">
              ₱{parseFloat(order.totalAmount || "0").toFixed(2)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            {order.items?.slice(0, 2).map((item) => (
              <Badge key={item.id} variant="secondary" className="text-xs">
                {item.meal?.name} x{item.quantity}
              </Badge>
            ))}
            {order.items && order.items.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{order.items.length - 2} more
              </Badge>
            )}
          </div>

          {order.notes && (
            <div className="mb-2 p-2 bg-muted rounded text-sm">
              <p className="text-muted-foreground">
                <span className="font-medium">Special Request:</span> {order.notes}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="ghost"
              onClick={onSelect}
              data-testid={`button-view-order-${order.id}`}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Message
            </Button>

            {order.paymentProofUrl && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="ghost">
                    <Image className="h-4 w-4 mr-1" />
                    Payment Proof
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Payment Proof</DialogTitle>
                  </DialogHeader>
                  <img
                    src={order.paymentProofUrl}
                    alt="Payment proof"
                    className="w-full rounded-lg"
                  />
                </DialogContent>
              </Dialog>
            )}

            {nextStatus && actionLabel && (
              <Button
                size="sm"
                onClick={() => onUpdateStatus(nextStatus)}
                disabled={isUpdating}
                data-testid={`button-update-${order.id}`}
              >
                <Check className="h-4 w-4 mr-1" />
                {actionLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function StoreSettings({
  store,
  meals,
}: {
  store: StoreType;
  meals?: Meal[];
}) {
  const { toast } = useToast();
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadQr = async () => {
    if (!qrFile) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", qrFile);
      formData.append("type", "gcash_qr");
      formData.append("storeId", store.id.toString());

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      toast({ title: "QR Code updated!" });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/store"] });
      setQrFile(null);
    } catch {
      toast({
        title: "Error",
        description: "Failed to upload QR code.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="py-6 space-y-6">
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <QrCode className="h-4 w-4" />
          GCash QR Code
        </h4>
        {store.gcashQrUrl && (
          <div className="bg-white p-4 rounded-lg mb-4">
            <img
              src={store.gcashQrUrl}
              alt="Current QR"
              className="max-w-[200px] mx-auto"
            />
          </div>
        )}
        <div className="space-y-2">
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setQrFile(e.target.files?.[0] || null)}
          />
          <Button
            onClick={uploadQr}
            disabled={!qrFile || isUploading}
            className="w-full"
          >
            {isUploading ? "Uploading..." : "Update QR Code"}
          </Button>
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <UtensilsCrossed className="h-4 w-4" />
          Menu Items ({meals?.length || 0})
        </h4>
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {meals?.map((meal) => (
              <div
                key={meal.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
              >
                <img
                  src={
                    meal.imageUrl ||
                    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=40&h=40&fit=crop"
                  }
                  alt={meal.name}
                  className="w-10 h-10 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-1">{meal.name}</p>
                  <p className="text-xs text-muted-foreground">
                    ₱{parseFloat(meal.price).toFixed(2)}
                  </p>
                </div>
                <Badge
                  variant={meal.isAvailable ? "secondary" : "destructive"}
                  className="text-xs"
                >
                  {meal.isAvailable ? "Available" : "Out"}
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
