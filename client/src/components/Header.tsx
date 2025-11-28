import { Link, useLocation } from "wouter";
import { ShoppingCart, MessageCircle, User, Menu, LogOut, LayoutDashboard, UtensilsCrossed } from "lucide-react";
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
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";

export function Header() {
  const { user, isAuthenticated } = useAuth();
  const { getTotalItems } = useCart();
  const [location] = useLocation();
  const totalItems = getTotalItems();
  const isStaff = user?.role === "staff";

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
              {!isStaff && (
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
                        className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
                        data-testid="badge-cart-count"
                      >
                        {totalItems}
                      </Badge>
                    )}
                  </Button>
                </Link>
              )}

              <Link href="/messages">
                <Button size="icon" variant="ghost" data-testid="button-messages">
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </Link>

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
                  {isStaff ? (
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
                  <a href="/api/logout">
                    <DropdownMenuItem className="cursor-pointer text-destructive" data-testid="menu-item-logout">
                      <LogOut className="h-4 w-4 mr-2" />
                      Log Out
                    </DropdownMenuItem>
                  </a>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex gap-2">
              <a href="https://forms.gle/QotJYMzE85Lqe1Xj6" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" data-testid="button-be-merchant">Be a Merchant</Button>
              </a>
              <a href="/api/login">
                <Button data-testid="button-login">Log In</Button>
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
