import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Home from "@/pages/Home";
import StoreDetail from "@/pages/StoreDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import Messages from "@/pages/Messages";
import Notifications from "@/pages/Notifications";
import StaffNotifications from "@/pages/StaffNotifications";
import StaffDashboard from "@/pages/StaffDashboard";
import StaffSignup from "@/pages/StaffSignup";
import MerchantApply from "@/pages/MerchantApply";
import AdminDashboard from "@/pages/AdminDashboard";

function Router() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/merchant" component={MerchantApply} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/staff-signup" component={StaffSignup} />
        <Route component={Landing} />
      </Switch>
    );
  }

  const isStaff = user?.role === "staff";
  const isAdmin = user?.role === "admin";

  return (
    <Switch>
      <Route path="/" component={isAdmin ? AdminDashboard : isStaff ? StaffDashboard : Home} />
      <Route path="/merchant" component={isAdmin ? AdminDashboard : isStaff ? StaffDashboard : MerchantApply} />
      <Route path="/store/:id" component={StoreDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/orders" component={Orders} />
      <Route path="/orders/:id" component={OrderDetail} />
      <Route path="/messages" component={Messages} />
      <Route path="/notifications" component={isStaff ? StaffNotifications : Notifications} />
      <Route path="/staff" component={StaffDashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/staff-signup" component={StaffSignup} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CartProvider>
          <Toaster />
          <Router />
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
