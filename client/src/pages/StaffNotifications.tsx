import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Bell, Package, Clock, ShoppingBag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/Header";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import type { OrderWithDetails } from "@shared/schema";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import { useEffect } from "react";

export default function StaffNotifications() {
  const { user } = useAuth();
  const { data: orders, isLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/staff/orders"],
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Mark all notifications as read when the page loads
  useEffect(() => {
    if (user?.id) {
      const lastReadKey = `staff_notifications_last_read_${user.id}`;
      localStorage.setItem(lastReadKey, Date.now().toString());
      // Invalidate the query to update the badge count immediately
      queryClient.invalidateQueries({ queryKey: ["/api/staff/orders"] });
    }
  }, [user?.id]);

  // Filter orders that are new (created after last read) or have payment submitted
  const lastReadKey = `staff_notifications_last_read_${user?.id}`;
  const lastReadTimestamp = localStorage.getItem(lastReadKey);
  const lastRead = lastReadTimestamp ? parseInt(lastReadTimestamp, 10) : 0;

  const notifications = orders?.filter((o) => {
    const updatedAt = o.updatedAt ? new Date(o.updatedAt).getTime() : 0;
    const createdAt = o.createdAt ? new Date(o.createdAt).getTime() : 0;

    // If never read, show all orders that are payment_submitted or pending_payment
    if (lastRead === 0) {
      return o.status === "payment_submitted" || o.status === "pending_payment";
    }

    // Show if:
    // 1. Order was created after last read (new order placed)
    if (createdAt > 0 && createdAt > lastRead) {
      return true;
    }

    // 2. Order status is "payment_submitted" and was updated after last read
    if (o.status === "payment_submitted" && updatedAt > 0 && updatedAt > lastRead) {
      return true;
    }

    return false;
  }) || [];

  const getNotificationIcon = (status: string) => {
    switch (status) {
      case "payment_submitted":
        return Package;
      case "pending_payment":
        return Clock;
      default:
        return Bell;
    }
  };

  const getNotificationMessage = (order: OrderWithDetails) => {
    switch (order.status) {
      case "payment_submitted":
        return `New payment submitted for Order #${order.id}`;
      case "pending_payment":
        return `New order placed - Order #${order.id}`;
      default:
        return `New order - Order #${order.id}`;
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
                <Link key={order.id} href={`/staff`}>
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
                          Customer: {order.student?.firstName && order.student?.lastName
                            ? `${order.student.firstName} ${order.student.lastName}`
                            : order.student?.email || "Unknown User"}
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
                          <span className="text-sm text-muted-foreground ml-2">
                            • {order.items?.length || 0} item(s)
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
            <h3 className="font-semibold text-lg mb-2">No new notifications</h3>
            <p className="text-muted-foreground mb-6">
              You'll receive notifications when new orders are placed or payments are submitted.
            </p>
            <Link href="/staff">
              <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium">
                Back to Dashboard
              </button>
            </Link>
          </Card>
        )}
      </main>
    </div>
  );
}

