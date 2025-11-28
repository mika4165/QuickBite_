import { Check, CreditCard, Clock, ChefHat, Package, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderStatusProgressProps {
  status: string;
}

const steps = [
  { key: "pending_payment", label: "Payment", icon: CreditCard },
  { key: "payment_submitted", label: "Submitted", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: Check },
  { key: "ready", label: "Ready", icon: ChefHat },
  { key: "claimed", label: "Claimed", icon: ShoppingBag },
];

const statusOrder = ["pending_payment", "payment_submitted", "confirmed", "ready", "claimed"];

export function OrderStatusProgress({ status }: OrderStatusProgressProps) {
  const currentIndex = statusOrder.indexOf(status);

  if (status === "cancelled") {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg font-medium">
          Order Cancelled
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-muted mx-8" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary mx-8"
          style={{ width: `calc(${(currentIndex / (steps.length - 1)) * 100}% - 4rem)` }}
        />
        
        {steps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = step.icon;
          
          return (
            <div 
              key={step.key} 
              className="flex flex-col items-center z-10"
              data-testid={`step-${step.key}`}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2",
                  isCompleted
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-background border-muted text-muted-foreground"
                )}
              >
                {isCompleted && index < currentIndex ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <span
                className={cn(
                  "text-xs mt-2 font-medium text-center",
                  isCompleted ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
