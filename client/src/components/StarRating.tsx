import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  count?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  showValue = false,
  count,
  interactive = false,
  onRatingChange,
  className,
}: StarRatingProps) {
  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const handleClick = (index: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(index + 1);
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex">
        {Array.from({ length: maxRating }).map((_, index) => {
          const filled = index < Math.floor(rating);
          const halfFilled = !filled && index < rating;

          return (
            <button
              key={index}
              type="button"
              disabled={!interactive}
              onClick={() => handleClick(index)}
              className={cn(
                "relative",
                interactive && "cursor-pointer hover-elevate"
              )}
              data-testid={`star-${index + 1}`}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  filled
                    ? "fill-yellow-400 text-yellow-400"
                    : halfFilled
                    ? "text-yellow-400"
                    : "text-muted-foreground/30"
                )}
              />
              {halfFilled && (
                <Star
                  className={cn(
                    sizeClasses[size],
                    "absolute inset-0 fill-yellow-400 text-yellow-400",
                    "clip-path-[inset(0_50%_0_0)]"
                  )}
                  style={{ clipPath: "inset(0 50% 0 0)" }}
                />
              )}
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm font-medium ml-1" data-testid="text-rating-value">
          {rating.toFixed(1)}
        </span>
      )}
      {count !== undefined && (
        <span className="text-sm text-muted-foreground" data-testid="text-rating-count">
          ({count})
        </span>
      )}
    </div>
  );
}
