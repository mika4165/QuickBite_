import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ShoppingBag, ChevronRight, Clock, Store } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Header } from "@/components/Header";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import type { OrderWithDetails } from "@shared/schema";
import { format } from "date-fns";

export default function Orders() {
  const { data: orders, isLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/orders"],
  });

  const activeOrders = orders?.filter(
    (o) => !["claimed", "cancelled"].includes(o.status || "")
  );
  const pastOrders = orders?.filter((o) =>
    ["claimed", "cancelled"].includes(o.status || "")
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Orders</h1>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-8">
            {activeOrders && activeOrders.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Active Orders</h2>
                <div className="space-y-4">
                  {activeOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </div>
            )}

            {pastOrders && pastOrders.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Past Orders</h2>
                <div className="space-y-4">
                  {pastOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-6">
              Start ordering from your favorite stores
            </p>
            <Link href="/">
              <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium">
                Browse Stores
              </button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

function OrderCard({ order }: { order: OrderWithDetails }) {
  const defaultImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=80&h=80&fit=crop";

  return (
    <Link href={`/orders/${order.id}`}>
      <Card
        className="p-4 hover-elevate cursor-pointer"
        data-testid={`order-card-${order.id}`}
      >
        <div className="flex gap-4">
          <Avatar className="h-16 w-16 rounded-lg">
            <AvatarImage
              src={order.store?.logoUrl || undefined}
              alt={order.store?.name}
              className="object-cover"
            />
            <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-lg">
              {order.store?.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold line-clamp-1">{order.store?.name}</h3>
              <OrderStatusBadge status={order.status || "pending_payment"} />
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {order.pickupTime}
              </span>
              <span>
                {order.createdAt
                  ? format(new Date(order.createdAt), "MMM d, yyyy")
                  : ""}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {order.items?.slice(0, 3).map((item) => (
                  <img
                    key={item.id}
                    src={item.meal?.imageUrl || defaultImage}
                    alt={item.meal?.name}
                    className="w-8 h-8 rounded object-cover"
                  />
                ))}
                {order.items && order.items.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{order.items.length - 3} more
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-primary">
                  ₱{parseFloat(order.totalAmount || "0").toFixed(2)}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
