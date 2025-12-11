import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
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
  LogOut,
  List,
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
import { ReviewCard } from "@/components/ReviewCard";
import { StarRating } from "@/components/StarRating";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getSupabase } from "@/lib/supabase";
import type { OrderWithDetails, Store as StoreType, Meal, MessageWithSender } from "@shared/schema";
import { format } from "date-fns";

const orderTabs = [
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const [storeSettingsOpen, setStoreSettingsOpen] = useState(false);
  useEffect(() => {
    (async () => {
      const supabase = getSupabase();
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        queryClient.setQueryData(["/api/auth/user"], null);
        setLocation("/login");
      }
    })();
  }, []);

  // Don't auto-mark notifications as read - only mark when bell is clicked
  // This allows staff to see notifications even after visiting the dashboard

  const { data: store, isLoading: storeLoading } = useQuery<StoreType>({
    queryKey: ["/api/staff/store"],
  });

  const { data: storeMetrics } = useQuery<any>({
    queryKey: store ? [`/api/stores/${store.id}`] : ["/api/stores/0"],
    enabled: !!store,
  });

  const { data: approved } = useQuery<any>({
    queryKey: ["approved_staff", user?.email || ""],
    enabled: !!user?.email,
    queryFn: async () => {
      const supabase = getSupabase();
      const { data } = await supabase
        .from("approved_staff")
        .select("*")
        .eq("email", String(user?.email))
        .maybeSingle();
      return data as any;
    },
    refetchOnWindowFocus: false,
  });

  const { data: orders, isLoading: ordersLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/staff/orders"],
    refetchInterval: 5000,
  });

  const { data: meals } = useQuery<Meal[]>({
    queryKey: ["/api/staff/meals"],
    enabled: !!store,
  });

  const { data: reviews } = useQuery<any[]>({
    queryKey: store ? [`/api/stores/${store.id}/reviews`] : ["/api/stores/0/reviews"],
    enabled: !!store,
  });

  const { data: applications, isLoading: appsLoading } = useQuery<any[]>({
    queryKey: ["/api/merchant_applications"],
  });

  const [provisionOpenFor, setProvisionOpenFor] = useState<number | null>(null);
  const [provisionEmail, setProvisionEmail] = useState<string>("");
  const [provisionPassword, setProvisionPassword] = useState<string>("");
  const [isProvisioning, setIsProvisioning] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [newMenuItem, setNewMenuItem] = useState<{ name: string; price: string; description: string; category?: string; image?: File | null }>({ name: "", price: "", description: "", category: "", image: null });
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);

  const handleProvisionAndApprove = async (app: any) => {
    try {
      setIsProvisioning(true);
      const email = provisionEmail || app.email;
      const payload = { email, password: provisionPassword };
      let ok = false;
      try {
        const ping = await fetch("/api/ping");
        if (ping.ok) {
          const res = await fetch("/api/provision-staff", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
          });
          ok = res.ok;
        }
      } catch {}
      await updateApplicationStatus.mutateAsync({ id: app.id, status: "approved" });
      setProvisionOpenFor(null);
      setProvisionPassword("");
      toast({ title: ok ? "Staff provisioned and approved" : "Application approved" });
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsProvisioning(false);
    }
  };

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
      // Also invalidate student orders query so notifications update immediately
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
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
    onError: (error) => {
      const errorMessage = (error as Error)?.message || "Failed to send message. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const updateApplicationStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/merchant_applications/${id}/status`, { status });
    },
    onSuccess: () => {
      toast({ title: "Application updated!" });
      queryClient.invalidateQueries({ queryKey: ["/api/merchant_applications"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update application status.",
        variant: "destructive",
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

  const createStoreIfMissing = async () => {
    try {
      const supabase = getSupabase();
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) return;
      if (!store) {
        const name = (approved as any)?.store_name || "Your Store";
        const description = (approved as any)?.store_description ?? null;
        const category = (approved as any)?.store_category ?? null;
        const { error } = await supabase
          .from("stores")
          .insert({ name, description, category, owner_id: userId });
        if (error) throw new Error(error.message);
        toast({ title: "Store created" });
        await queryClient.invalidateQueries({ queryKey: ["/api/staff/store"] });
      }
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  const openMenuManager = async () => {
    try {
      await createStoreIfMissing();
      setMenuOpen(true);
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

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

  const displayName = store?.name || approved?.store_name || "Your Store";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={store?.logoUrl || undefined}
                alt={displayName}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {displayName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                {displayName}
                {storeMetrics && (
                  <StarRating
                    rating={Number(storeMetrics.averageRating || 0)}
                    size="sm"
                    count={Number(storeMetrics.ratingCount || 0)}
                  />
                )}
              </h1>
              <p className="text-sm text-muted-foreground">Staff Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {store && (
              <Sheet open={storeSettingsOpen} onOpenChange={setStoreSettingsOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" data-testid="button-manage-store">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Store
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-lg flex flex-col">
                  <SheetHeader>
                    <SheetTitle>Store Settings</SheetTitle>
                    <SheetDescription>
                      Manage your store details and menu items
                    </SheetDescription>
                  </SheetHeader>
                  <ScrollArea className="flex-1 pr-4">
                    <StoreSettings store={store} meals={meals} />
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            )}
            <Button
              variant="default"
              onClick={() => {
                openMenuManager();
              }}
              disabled={false}
              data-testid="button-add-menu"
            >
              <UtensilsCrossed className="h-4 w-4 mr-2" />
              Add Menu
            </Button>
          </div>
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
          <ProvisionDialog
            open={provisionOpenFor !== null}
              onOpenChange={(o) => {
                if (!o) setProvisionOpenFor(null);
              }}
              email={provisionEmail}
              setEmail={setProvisionEmail}
              password={provisionPassword}
              setPassword={setProvisionPassword}
              onConfirm={() => {
                const app = (applications || []).find((a: any) => a.id === provisionOpenFor);
                if (app) handleProvisionAndApprove(app);
              }}
            isSaving={isProvisioning}
          />

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetContent className="w-full sm:max-w-lg flex flex-col">
                <SheetHeader>
                  <SheetTitle>Manage Menu</SheetTitle>
                  <SheetDescription>Add and edit menu items</SheetDescription>
                </SheetHeader>
                <ScrollArea className="flex-1 pr-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={newMenuItem.name} onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })} />
                    <Label>Price</Label>
                    <Input value={newMenuItem.price} onChange={(e) => setNewMenuItem({ ...newMenuItem, price: e.target.value })} />
                    <Label>Description</Label>
                    <Textarea value={newMenuItem.description} onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })} rows={3} />
                    <Label>Image</Label>
                    <Input type="file" accept="image/*" onChange={(e) => setNewMenuItem({ ...newMenuItem, image: e.target.files?.[0] || null })} />
                    <Button
                      onClick={async () => {
                        try {
                          const supabase = getSupabase();
                          let imageUrl: string | null = null;
                          if (newMenuItem.image && store) {
                            const fileName = `${Date.now()}-${newMenuItem.image.name}`.replace(/\s+/g, "-");
                            const filePath = `meal_images/${store.id}/${fileName}`;
                            const { error: uploadErr } = await supabase.storage.from("public").upload(filePath, newMenuItem.image, { upsert: true, cacheControl: "3600", contentType: newMenuItem.image.type });
                            if (uploadErr) throw new Error(uploadErr.message);
                            const { data: pub } = await supabase.storage.from("public").getPublicUrl(filePath);
                            imageUrl = pub.publicUrl;
                          }
                          if (store) {
                            const { error: insertErr } = await supabase.from("meals").insert({
                              store_id: store.id,
                              name: newMenuItem.name,
                              description: newMenuItem.description || null,
                              price: newMenuItem.price,
                              category: null,
                              image_url: imageUrl,
                              is_available: true,
                            });
                            if (insertErr) throw new Error(insertErr.message);
                            toast({ title: "Meal added" });
                            setNewMenuItem({ name: "", price: "", description: "", image: null });
                            queryClient.invalidateQueries({ queryKey: ["/api/staff/meals"] });
                          }
                        } catch (e) {
                          toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
                        }
                      }}
                      disabled={!newMenuItem.name || !newMenuItem.price}
                    >
                      Add
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Existing Items</Label>
                    <div className="space-y-2">
                      {meals?.map((meal) => (
                        <div key={meal.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                          <img src={meal.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=40&h=40&fit=crop"} alt={meal.name} className="w-10 h-10 rounded object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm line-clamp-1">{meal.name}</p>
                            <p className="text-xs text-muted-foreground">₱{parseFloat(meal.price).toFixed(2)}</p>
                          </div>
                          <Badge variant={meal.isAvailable ? "secondary" : "destructive"} className="text-xs">{meal.isAvailable ? "Available" : "Out"}</Badge>
                          <Button size="sm" onClick={() => {
                            setEditingMeal(meal);
                            setEditImageFile(null);
                          }}>Edit</Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {editingMeal && (
                    <div className="space-y-2">
                      <Label>Edit Item</Label>
                      <Input value={editingMeal.name} onChange={(e) => setEditingMeal({ ...editingMeal, name: e.target.value })} />
                      <Input value={String(editingMeal.price)} onChange={(e) => setEditingMeal({ ...editingMeal, price: e.target.value as any })} />
                      <Textarea value={editingMeal.description || ""} onChange={(e) => setEditingMeal({ ...editingMeal, description: e.target.value })} rows={3} />
                      <Input value={editingMeal.category || ""} onChange={(e) => setEditingMeal({ ...editingMeal, category: e.target.value })} />
                      <Input type="file" accept="image/*" onChange={(e) => setEditImageFile(e.target.files?.[0] || null)} />
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setEditingMeal(null)}>Cancel</Button>
                        <Button onClick={async () => {
                          try {
                            const supabase = getSupabase();
                            let imageUrl = editingMeal.imageUrl || null;
                            if (editImageFile && store) {
                              const fileName = `${Date.now()}-${editImageFile.name}`.replace(/\s+/g, "-");
                              const filePath = `meal_images/${store.id}/${fileName}`;
                              const { error: uploadErr } = await supabase.storage.from("public").upload(filePath, editImageFile, { upsert: true, cacheControl: "3600", contentType: editImageFile.type });
                              if (uploadErr) throw new Error(uploadErr.message);
                              const { data: pub } = await supabase.storage.from("public").getPublicUrl(filePath);
                              imageUrl = pub.publicUrl;
                            }
                            const payload: any = {
                              name: editingMeal.name,
                              description: editingMeal.description || null,
                              price: editingMeal.price as any,
                              category: editingMeal.category || null,
                              image_url: imageUrl,
                            };
                            const { error } = await supabase.from("meals").update(payload).eq("id", editingMeal.id);
                            if (error) throw new Error(error.message);
                            toast({ title: "Meal updated" });
                            setEditingMeal(null);
                            setEditImageFile(null);
                            queryClient.invalidateQueries({ queryKey: ["/api/staff/meals"] });
                          } catch (e) {
                            toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
                          }
                        }}>Save</Button>
                      </div>
                    </div>
                  )}
                </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
            <Card className="h-[600px] flex flex-col">
              <div className="p-4 border-b border-border">
                {selectedOrder ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Order #{selectedOrder.id}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedOrder.student?.firstName && selectedOrder.student?.lastName
                          ? `${selectedOrder.student.firstName} ${selectedOrder.student.lastName}`
                          : selectedOrder.student?.firstName
                          ? selectedOrder.student.firstName
                          : selectedOrder.student?.email
                          ? selectedOrder.student.email
                          : "Unknown User"}
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
                      <div ref={messagesEndRef} />
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
            <Card className="mt-6">
              <div className="p-4 border-b border-border flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Reviews</h3>
              </div>
              <div className="p-4">
                {reviews && reviews.length > 0 ? (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {reviews.map((rev) => (
                        <ReviewCard key={rev.id} review={rev} />
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No reviews yet
                  </div>
                )}
              </div>
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
              {order.student?.firstName && order.student?.lastName
                ? `${order.student.firstName} ${order.student.lastName}`
                : order.student?.firstName
                ? order.student.firstName
                : order.student?.email
                ? order.student.email
                : "Unknown User"}
            </h4>
            <span className="text-sm font-semibold text-primary">
              ₱{parseFloat(order.totalAmount || "0").toFixed(2)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            {order.items?.slice(0, 2).map((item) => (
              <Badge key={item.id} variant="secondary" className="text-xs">
                Meal #{item.mealId} x{item.quantity}
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

            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost">
                  <List className="h-4 w-4 mr-1" />
                  Order Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Order #{order.id} - Full Details</DialogTitle>
                  <DialogDescription>
                    Customer: {order.student?.firstName && order.student?.lastName
                      ? `${order.student.firstName} ${order.student.lastName}`
                      : order.student?.email || "Unknown User"}
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Order Items ({order.items?.length || 0} items)</h4>
                      <div className="space-y-2">
                        {order.items && order.items.length > 0 ? (
                          order.items.map((item: any) => (
                            <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                {item.meal?.imageUrl ? (
                                  <img
                                    src={item.meal.imageUrl}
                                    alt={item.meal.name || "Meal"}
                                    className="w-full h-full rounded-lg object-cover"
                                  />
                                ) : (
                                  <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium">
                                  {item.meal?.name || `Meal #${item.mealId}`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Quantity: {item.quantity} × ₱{parseFloat(item.price || "0").toFixed(2)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">
                                  ₱{(parseFloat(item.price || "0") * (item.quantity || 1)).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No items found</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Subtotal:</span>
                        <span className="font-semibold">
                          ₱{parseFloat(order.totalAmount || "0").toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-lg">Total:</span>
                        <span className="font-bold text-lg text-primary">
                          ₱{parseFloat(order.totalAmount || "0").toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {order.notes && (
                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-2">Special Request</h4>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                          {order.notes}
                        </p>
                      </div>
                    )}

                    <div className="border-t pt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pickup Time:</span>
                        <span className="font-medium">{order.pickupTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <OrderStatusBadge status={order.status || "pending_payment"} />
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>

            {order.paymentProofUrl && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="ghost">
                    <Image className="h-4 w-4 mr-1" />
                    Payment Proof
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Payment Proof</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="flex-1 pr-4">
                    <div className="flex justify-center">
                      <img
                        src={order.paymentProofUrl}
                        alt="Payment proof"
                        className="max-w-full h-auto rounded-lg object-contain"
                        style={{ maxHeight: '70vh' }}
                      />
                    </div>
                  </ScrollArea>
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
  const [storeName, setStoreName] = useState(store.name || "");
  const [storeDescription, setStoreDescription] = useState(store.description || "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newMeal, setNewMeal] = useState<{ name: string; price: string; description: string; category?: string; image?: File | null }>({ name: "", price: "", description: "", category: "", image: null });
  const [slots, setSlots] = useState<Array<{ time: string; limit: number }>>(() => {
    const cat = (store as any)?.category || "";
    if (typeof cat === "string" && cat.startsWith("CFG:")) {
      try {
        const cfg = JSON.parse(cat.slice(4));
        const arr = Array.isArray(cfg?.slots) ? cfg.slots : [];
        return arr.map((s: any) => ({ time: String(s.time), limit: Number(s.limit) || 0 }));
      } catch {
        return [];
      }
    }
    return [];
  });
  const [savingSlots, setSavingSlots] = useState(false);

  const uploadQr = async () => {
    if (!qrFile) return;
    setIsUploading(true);
    try {
      const supabase = getSupabase();
      const fileName = `${Date.now()}-${qrFile.name}`.replace(/\s+/g, "-");
      const filePath = `gcash_qr/${store.id}/${fileName}`;
      const { error: uploadErr } = await supabase.storage.from("public").upload(filePath, qrFile, {
        upsert: true,
        cacheControl: "3600",
        contentType: qrFile.type,
      });
      if (uploadErr) throw new Error(uploadErr.message);
      const { data: pub } = await supabase.storage.from("public").getPublicUrl(filePath);
      const publicUrl = pub.publicUrl;
      const { error: updateErr } = await supabase
        .from("stores")
        .update({ gcash_qr_url: publicUrl })
        .eq("id", store.id);
      if (updateErr) throw new Error(updateErr.message);
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

  const uploadLogo = async () => {
    if (!logoFile) return;
    setIsUploading(true);
    try {
      const supabase = getSupabase();
      const fileName = `${Date.now()}-${logoFile.name}`.replace(/\s+/g, "-");
      const filePath = `store_assets/${store.id}/logo-${fileName}`;
      const { error: uploadErr } = await supabase.storage.from("public").upload(filePath, logoFile, {
        upsert: true,
        cacheControl: "3600",
        contentType: logoFile.type,
      });
      if (uploadErr) throw new Error(uploadErr.message);
      const { data: pub } = await supabase.storage.from("public").getPublicUrl(filePath);
      const publicUrl = pub.publicUrl;
      const { error: updateErr } = await supabase
        .from("stores")
        .update({ logo_url: publicUrl })
        .eq("id", store.id);
      if (updateErr) throw new Error(updateErr.message);
      toast({ title: "Logo updated!" });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/store"] });
      setLogoFile(null);
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const uploadBanner = async () => {
    if (!bannerFile) return;
    setIsUploading(true);
    try {
      const supabase = getSupabase();
      const fileName = `${Date.now()}-${bannerFile.name}`.replace(/\s+/g, "-");
      const filePath = `store_assets/${store.id}/banner-${fileName}`;
      const { error: uploadErr } = await supabase.storage.from("public").upload(filePath, bannerFile, {
        upsert: true,
        cacheControl: "3600",
        contentType: bannerFile.type,
      });
      if (uploadErr) throw new Error(uploadErr.message);
      const { data: pub } = await supabase.storage.from("public").getPublicUrl(filePath);
      const publicUrl = pub.publicUrl;
      const { error: updateErr } = await supabase
        .from("stores")
        .update({ banner_image_url: publicUrl })
        .eq("id", store.id);
      if (updateErr) throw new Error(updateErr.message);
      toast({ title: "Banner updated!" });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/store"] });
      setBannerFile(null);
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const saveStoreBasics = async () => {
    try {
      const supabase = getSupabase();
      const payload: any = { name: storeName, description: storeDescription || null };
      const { error } = await supabase.from("stores").update(payload).eq("id", store.id);
      if (error) throw new Error(error.message);
      toast({ title: "Store details saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/store"] });
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  const addMeal = async () => {
    try {
      const supabase = getSupabase();
      let imageUrl: string | null = null;
      if (newMeal.image) {
        const fileName = `${Date.now()}-${newMeal.image.name}`.replace(/\s+/g, "-");
        const filePath = `meal_images/${store.id}/${fileName}`;
        const { error: uploadErr } = await supabase.storage.from("public").upload(filePath, newMeal.image, { upsert: true, cacheControl: "3600", contentType: newMeal.image.type });
        if (uploadErr) throw new Error(uploadErr.message);
        const { data: pub } = await supabase.storage.from("public").getPublicUrl(filePath);
        imageUrl = pub.publicUrl;
      }
      const { error: insertErr } = await supabase.from("meals").insert({
        store_id: store.id,
        name: newMeal.name,
        description: newMeal.description || null,
        price: newMeal.price,
        category: newMeal.category || null,
        image_url: imageUrl,
        is_available: true,
      });
      if (insertErr) throw new Error(insertErr.message);
      toast({ title: "Meal added" });
      setNewMeal({ name: "", price: "", description: "", category: "", image: null });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/meals"] });
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  const toggleAvailability = async (meal: Meal) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from("meals").update({ is_available: !meal.isAvailable }).eq("id", meal.id);
      if (error) throw new Error(error.message);
      queryClient.invalidateQueries({ queryKey: ["/api/staff/meals"] });
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  const saveSlots = async () => {
    setSavingSlots(true);
    try {
      const cfg = { slots: slots.map((s) => ({ time: s.time, limit: s.limit })) };
      const supabase = getSupabase();
      const { error } = await supabase.from("stores").update({ category: `CFG:${JSON.stringify(cfg)}` }).eq("id", store.id);
      if (error) throw new Error(error.message);
      toast({ title: "Pickup configuration saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/store"] });
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSavingSlots(false);
    }
  };

  return (
    <div className="py-6 space-y-6">
      <div>
        <h4 className="font-semibold mb-3">Store Details</h4>
        <div className="space-y-2">
          <Label>Store Name</Label>
          <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} />
          <Label>Description</Label>
          <Textarea value={storeDescription} onChange={(e) => setStoreDescription(e.target.value)} rows={3} />
          <Button onClick={saveStoreBasics} disabled={!storeName} className="w-full">Save Details</Button>
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Image className="h-4 w-4" />
          Store Images
        </h4>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Logo</Label>
            <Input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
            <Button onClick={uploadLogo} disabled={!logoFile || isUploading} className="w-full">
              {isUploading ? "Uploading..." : "Update Logo"}
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Banner</Label>
            <Input type="file" accept="image/*" onChange={(e) => setBannerFile(e.target.files?.[0] || null)} />
            <Button onClick={uploadBanner} disabled={!bannerFile || isUploading} className="w-full">
              {isUploading ? "Uploading..." : "Update Banner"}
            </Button>
          </div>
        </div>
      </div>
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
                <Button size="sm" variant="outline" onClick={() => toggleAvailability(meal)}>Toggle</Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

// Provisioning dialog for merchant applications
function ProvisionDialog({ open, onOpenChange, email, setEmail, password, setPassword, onConfirm, isSaving }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  onConfirm: () => void;
  isSaving: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Staff Password</DialogTitle>
          <DialogDescription>Set the initial password for this staff account. They can change it later.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={onConfirm} disabled={isSaving || !password}>
              {isSaving ? "Saving..." : "Save & Approve"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
