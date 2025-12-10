import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Bell, Check, ChefHat, ShoppingBag, Clock, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/Header";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import type { OrderWithDetails } from "@shared/schema";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import { useEffect } from "react";

export default function Notifications() {
  const { user } = useAuth();
  const { data: orders, isLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/orders"],
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Mark all notifications as read when the page loads
  useEffect(() => {
    if (user?.id) {
      const lastReadKey = `notifications_last_read_${user.id}`;
      localStorage.setItem(lastReadKey, Date.now().toString());
      // Invalidate the query to update the badge count immediately
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    }
  }, [user?.id]);

  // Filter orders that have status updates (confirmed, ready, claimed)
  const notifications = orders?.filter((o) =>
    ["confirmed", "ready", "claimed"].includes(o.status || "")
  ) || [];

  const getNotificationIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return Check;
      case "ready":
        return ChefHat;
      case "claimed":
        return ShoppingBag;
      default:
        return Bell;
    }
  };

  const getNotificationMessage = (order: OrderWithDetails) => {
    switch (order.status) {
      case "confirmed":
        return `Your order from ${order.store?.name} has been confirmed!`;
      case "ready":
        return `Your order from ${order.store?.name} is ready for pickup!`;
      case "claimed":
        return `You have claimed your order from ${order.store?.name}.`;
      default:
        return `Update on your order from ${order.store?.name}`;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Notifications</h1>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((order) => {
              const Icon = getNotificationIcon(order.status || "");
              return (
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <Card className="p-4 hover-elevate cursor-pointer transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold">
                            {getNotificationMessage(order)}
                          </h3>
                          <OrderStatusBadge status={order.status || "pending_payment"} />
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Order #{order.id} • {order.store?.name}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Pickup: {order.pickupTime}
                          </span>
                          <span>
                            {order.createdAt
                              ? format(new Date(order.createdAt), "MMM d, yyyy 'at' h:mm a")
                              : ""}
                          </span>
                        </div>
                        <div className="mt-2">
                          <span className="text-sm font-semibold text-primary">
                            ₱{parseFloat(order.totalAmount || "0").toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No notifications</h3>
            <p className="text-muted-foreground mb-6">
              You'll receive notifications when your orders are confirmed or ready for pickup.
            </p>
            <Link href="/orders">
              <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium">
                View My Orders
              </button>
            </Link>
          </Card>
        )}
      </main>
    </div>
  );
}

