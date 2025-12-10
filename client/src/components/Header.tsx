import { Link, useLocation } from "wouter";
import { ShoppingCart, MessageCircle, Bell, User, Menu, LogOut, LayoutDashboard, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./ThemeToggle";
import { getSupabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { useQuery } from "@tanstack/react-query";

function NotificationBadge() {
  const { user } = useAuth();
  const { data: newNotificationCount } = useQuery({
    queryKey: ["/api/orders"],
    enabled: !!user && user.role !== "staff" && user.role !== "admin",
    select: (orders: any[]) => {
      if (!orders || orders.length === 0) return 0;
      
      // Get the last read timestamp from localStorage
      const lastReadKey = `notifications_last_read_${user?.id}`;
      const lastReadTimestamp = localStorage.getItem(lastReadKey);
      const lastRead = lastReadTimestamp ? parseInt(lastReadTimestamp, 10) : 0;
      
      // Count only NEW notifications (orders with notification statuses that were updated after last read)
      const newNotifications = orders.filter((o: any) => {
        // Only count orders with notification statuses
        const isNotificationStatus = o.status === "confirmed" || o.status === "ready" || o.status === "claimed";
        if (!isNotificationStatus) return false;
        
        // If never read, count all notification status orders
        if (lastRead === 0) return true;
        
        // Check if order was updated after last read (use updatedAt, fallback to createdAt)
        const updatedAt = o.updatedAt ? new Date(o.updatedAt).getTime() : 0;
        const createdAt = o.createdAt ? new Date(o.createdAt).getTime() : 0;
        const orderTimestamp = updatedAt > 0 ? updatedAt : createdAt;
        
        return orderTimestamp > lastRead;
      });
      
      return newNotifications.length;
    },
    refetchInterval: 5000, // Refetch every 5 seconds to check for new notifications
  });

  if (!newNotificationCount || newNotificationCount === 0) return null;

  return (
    <Badge
      className="absolute top-0 right-0 h-4 min-w-4 flex items-center justify-center p-0 text-[10px] font-semibold translate-x-1/2 -translate-y-1/2"
      data-testid="badge-notification-count"
    >
      {newNotificationCount}
    </Badge>
  );
}

function StaffNotificationBadge() {
  const { user } = useAuth();
  const { data: newNotificationCount } = useQuery({
    queryKey: ["/api/staff/orders"],
    enabled: !!user && user.role === "staff",
    select: (orders: any[]) => {
      if (!orders || orders.length === 0) return 0;
      
      // Get the last read timestamp from localStorage for staff
      const lastReadKey = `staff_notifications_last_read_${user?.id}`;
      const lastReadTimestamp = localStorage.getItem(lastReadKey);
      const lastRead = lastReadTimestamp ? parseInt(lastReadTimestamp, 10) : 0;
      
      // Count NEW orders that are:
      // 1. Newly placed orders (created after last read) - any status
      // 2. Orders with "payment_submitted" status that were updated after last read
      const newOrders = orders.filter((o: any) => {
        // Get timestamps - handle both string and Date objects
        let updatedAt = 0;
        let createdAt = 0;
        
        try {
          if (o.updatedAt) {
            updatedAt = typeof o.updatedAt === 'string' 
              ? new Date(o.updatedAt).getTime() 
              : o.updatedAt instanceof Date 
              ? o.updatedAt.getTime() 
              : Number(o.updatedAt) || 0;
          }
          
          if (o.createdAt) {
            createdAt = typeof o.createdAt === 'string' 
              ? new Date(o.createdAt).getTime() 
              : o.createdAt instanceof Date 
              ? o.createdAt.getTime() 
              : Number(o.createdAt) || 0;
          }
        } catch (e) {
          // If timestamp parsing fails, skip this order
          return false;
        }
        
        // If never read, count all orders that are payment_submitted or pending_payment
        if (lastRead === 0) {
          return o.status === "payment_submitted" || o.status === "pending_payment";
        }
        
        // Count if:
        // 1. Order was created after last read (new order placed - regardless of status)
        if (createdAt > 0 && createdAt > lastRead) {
          return true;
        }
        
        // 2. Order status is "payment_submitted" and was updated after last read
        // This catches cases where order was created before last read but payment was submitted after
        if (o.status === "payment_submitted" && updatedAt > 0 && updatedAt > lastRead) {
          return true;
        }
        
        return false;
      });
      
      return newOrders.length;
    },
    refetchInterval: 3000, // Refetch every 3 seconds for faster notifications
  });

  if (!newNotificationCount || newNotificationCount === 0) return null;

  return (
    <Badge
      className="absolute top-0 right-0 h-4 min-w-4 flex items-center justify-center p-0 text-[10px] font-semibold translate-x-1/2 -translate-y-1/2"
      data-testid="badge-staff-notification-count"
    >
      {newNotificationCount}
    </Badge>
  );
}

export function Header() {
  const { user, isAuthenticated } = useAuth();
  const { getTotalItems } = useCart();
  const [location, setLocation] = useLocation();
  const totalItems = getTotalItems();
  const isStaff = user?.role === "staff";
  const isAdmin = user?.role === "admin";

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-xl hidden sm:block" data-testid="text-logo">
            QuickBite
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {isAuthenticated ? (
            <>
              {!isStaff && !isAdmin && (
                <Link href="/cart">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="relative"
                    data-testid="button-cart"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {totalItems > 0 && (
                      <Badge
                        className="absolute top-0 right-0 h-4 min-w-4 flex items-center justify-center p-0 text-[10px] font-semibold translate-x-1/2 -translate-y-1/2"
                        data-testid="badge-cart-count"
                      >
                        {totalItems}
                      </Badge>
                    )}
                  </Button>
                </Link>
              )}

              {isStaff && !isAdmin && (
                <Link href="/notifications">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    data-testid="button-notifications" 
                    className="relative"
                    onClick={() => {
                      // Mark all current notifications as read when clicking the bell
                      if (user?.id) {
                        const lastReadKey = `staff_notifications_last_read_${user.id}`;
                        localStorage.setItem(lastReadKey, Date.now().toString());
                        // Invalidate the query to update the badge count immediately
                        queryClient.invalidateQueries({ queryKey: ["/api/staff/orders"] });
                      }
                    }}
                  >
                    <Bell className="h-5 w-5" />
                    <StaffNotificationBadge />
                  </Button>
                </Link>
              )}

              {!isStaff && !isAdmin && (
                <>
                  <Link href="/notifications">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      data-testid="button-notifications" 
                      className="relative"
                      onClick={() => {
                        // Mark all current notifications as read when clicking the bell
                        if (user?.id) {
                          const lastReadKey = `notifications_last_read_${user.id}`;
                          localStorage.setItem(lastReadKey, Date.now().toString());
                          // Invalidate the query to update the badge count immediately
                          queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
                        }
                      }}
                    >
                      <Bell className="h-5 w-5" />
                      <NotificationBadge />
                    </Button>
                  </Link>
                  <Link href="/messages">
                    <Button size="icon" variant="ghost" data-testid="button-messages" className="relative">
                      <MessageCircle className="h-5 w-5" />
                    </Button>
                  </Link>
                </>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full"
                    data-testid="button-user-menu"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user?.profileImageUrl || undefined}
                        alt={user?.firstName || "User"}
                        className="object-cover"
                      />
                      <AvatarFallback>
                        {user?.firstName?.charAt(0) || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="font-medium" data-testid="text-user-name">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid="text-user-email">
                      {user?.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  {isAdmin ? (
                    <Link href="/admin">
                      <DropdownMenuItem className="cursor-pointer" data-testid="menu-item-admin">
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Admin Dashboard
                      </DropdownMenuItem>
                    </Link>
                  ) : isStaff ? (
                    <Link href="/staff">
                      <DropdownMenuItem className="cursor-pointer" data-testid="menu-item-dashboard">
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Staff Dashboard
                      </DropdownMenuItem>
                    </Link>
                  ) : (
                    <Link href="/orders">
                      <DropdownMenuItem className="cursor-pointer" data-testid="menu-item-orders">
                        <Menu className="h-4 w-4 mr-2" />
                        My Orders
                      </DropdownMenuItem>
                    </Link>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive"
                    data-testid="menu-item-logout"
                    onClick={async () => {
                      const supabase = getSupabase();
                      await supabase.auth.signOut();
                      for (let i = 0; i < 5; i++) {
                        const { data } = await supabase.auth.getSession();
                        if (!data.session) break;
                        await new Promise((r) => setTimeout(r, 200));
                      }
                      queryClient.setQueryData(["/api/auth/user"], null);
                      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
                      queryClient.clear();
                      try {
                        Object.keys(localStorage).forEach((k) => {
                          if (k.startsWith("sb-")) localStorage.removeItem(k);
                        });
                        Object.keys(sessionStorage).forEach((k) => {
                          if (k.startsWith("sb-")) sessionStorage.removeItem(k);
                        });
                      } catch {}
                      window.location.replace("/login");
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex gap-2">
              <Link href="/merchant">
                <Button variant="outline" data-testid="button-be-merchant">Be a Merchant</Button>
              </Link>
              <Link href="/login">
                <Button data-testid="button-login">Log In</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
