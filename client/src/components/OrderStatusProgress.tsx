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

  // Calculate progress percentage
  const progressPercentage = currentIndex >= 0 ? (currentIndex / (steps.length - 1)) * 100 : 0;

  return (
    <div className="w-full py-8 -mx-6 px-6">
      <div className="flex items-start relative w-full">
        {/* Background progress line - spans from first to last step center */}
        <div 
          className="absolute top-5 h-1.5 bg-muted/20 rounded-full"
          style={{ 
            left: '2.5rem',
            right: '2.5rem'
          }}
        />
        {/* Active progress line - connects step centers */}
        {currentIndex >= 0 && (
          <div 
            className="absolute top-5 h-1.5 bg-primary rounded-full transition-all duration-700 ease-out shadow-sm"
            style={{ 
              left: '2.5rem',
              width: currentIndex === steps.length - 1 
                ? 'calc(100% - 5rem)'
                : `calc(${progressPercentage}% * (100% - 5rem) / 100%)`
            }}
          />
        )}
        
        {steps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = step.icon;
          
          return (
            <div 
              key={step.key} 
              className="flex flex-col items-center z-10 flex-1"
              data-testid={`step-${step.key}`}
              style={{ 
                position: 'relative',
                flex: '1 1 0%'
              }}
            >
              {/* Step circle */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative",
                  isCompleted
                    ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "bg-background border-muted-foreground/30 text-muted-foreground",
                  isCurrent && "ring-4 ring-primary/20 scale-110"
                )}
              >
                {isCompleted && index < currentIndex ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Icon className={cn(
                    "h-5 w-5",
                    isCurrent && "text-primary-foreground"
                  )} />
                )}
              </div>
              
              {/* Step label */}
              <span
                className={cn(
                  "text-xs mt-3 font-medium text-center whitespace-nowrap transition-colors duration-300",
                  isCompleted ? "text-foreground font-semibold" : "text-muted-foreground"
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
