import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { MessageCircle, ChevronRight, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import type { OrderWithDetails } from "@shared/schema";
import { format } from "date-fns";

export default function Messages() {
  const { data: orders, isLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/orders"],
  });

  const ordersWithPotentialMessages = orders?.filter(
    (o) => !["cancelled"].includes(o.status || "")
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Messages</h1>
        <p className="text-muted-foreground mb-6">
          Chat with stores about your orders
        </p>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : ordersWithPotentialMessages && ordersWithPotentialMessages.length > 0 ? (
          <div className="space-y-4">
            {ordersWithPotentialMessages.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <Card
                  className="p-4 hover-elevate cursor-pointer"
                  data-testid={`message-card-${order.id}`}
                >
                  <div className="flex items-center gap-4">
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

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-semibold line-clamp-1">
                          {order.store?.name}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {order.createdAt
                            ? format(new Date(order.createdAt), "MMM d")
                            : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <OrderStatusBadge status={order.status || "pending_payment"} />
                        <span className="text-sm text-muted-foreground">
                          Order #{order.id}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No conversations</h3>
            <p className="text-muted-foreground mb-6">
              Place an order to start chatting with stores
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
