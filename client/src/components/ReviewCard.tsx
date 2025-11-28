import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { StarRating } from "./StarRating";
import type { Rating, User } from "@shared/schema";
import { format } from "date-fns";

interface ReviewCardProps {
  review: Rating & { user?: User };
}

export function ReviewCard({ review }: ReviewCardProps) {
  const user = review.user;
  
  return (
    <Card className="p-4" data-testid={`review-${review.id}`}>
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage 
            src={user?.profileImageUrl || undefined}
            alt={user?.firstName || "User"}
            className="object-cover"
          />
          <AvatarFallback>
            {user?.firstName?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="font-medium">
              {user?.firstName} {user?.lastName?.charAt(0)}.
            </span>
            <span className="text-xs text-muted-foreground">
              {review.createdAt ? format(new Date(review.createdAt), "MMM d, yyyy") : ""}
            </span>
          </div>
          
          <StarRating rating={review.rating} size="sm" className="mt-1" />
          
          {review.comment && (
            <p className="text-sm text-muted-foreground mt-2">
              {review.comment}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
