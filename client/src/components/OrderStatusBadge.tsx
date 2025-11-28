import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface OrderStatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending_payment: { label: "Pending Payment", variant: "secondary" },
  payment_submitted: { label: "Payment Submitted", variant: "outline" },
  confirmed: { label: "Confirmed", variant: "default" },
  ready: { label: "Ready for Pickup", variant: "default" },
  claimed: { label: "Claimed", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: "secondary" as const };
  
  return (
    <Badge 
      variant={config.variant} 
      className={cn(
        status === "ready" && "bg-green-600 hover:bg-green-700",
        status === "confirmed" && "bg-blue-600 hover:bg-blue-700",
        className
      )}
      data-testid={`badge-status-${status}`}
    >
      {config.label}
    </Badge>
  );
}
