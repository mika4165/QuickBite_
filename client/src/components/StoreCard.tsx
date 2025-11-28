import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import type { StoreWithRating } from "@shared/schema";

interface StoreCardProps {
  store: StoreWithRating;
}

export function StoreCard({ store }: StoreCardProps) {
  return (
    <Link href={`/store/${store.id}`}>
      <Card className="overflow-hidden hover-elevate cursor-pointer transition-all" data-testid={`card-store-${store.id}`}>
        {store.bannerImageUrl && (
          <div className="aspect-video overflow-hidden bg-muted">
            <img
              src={store.bannerImageUrl}
              alt={store.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg">{store.name}</h3>
            {store.category && (
              <Badge variant="outline" data-testid={`badge-category-${store.id}`}>
                {store.category}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {store.description}
          </p>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium" data-testid={`text-rating-${store.id}`}>
              {store.averageRating}
            </span>
            <span className="text-xs text-muted-foreground">
              ({store.ratingCount} reviews)
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
