import { Link } from "wouter";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { StarRating } from "./StarRating";
import type { StoreWithRating } from "@shared/schema";

interface StoreCardProps {
  store: StoreWithRating;
}

export function StoreCard({ store }: StoreCardProps) {
  const defaultBanner = "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=800&h=400&fit=crop";
  
  return (
    <Link href={`/store/${store.id}`}>
      <Card 
        className="overflow-hidden cursor-pointer hover-elevate active-elevate-2 group"
        data-testid={`card-store-${store.id}`}
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={store.bannerImageUrl || defaultBanner}
            alt={store.name}
            className="w-full h-full object-cover"
            data-testid={`img-store-banner-${store.id}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          <div className="absolute bottom-3 left-3 flex items-end gap-3">
            <Avatar className="h-14 w-14 border-2 border-background shadow-lg">
              <AvatarImage 
                src={store.logoUrl || undefined} 
                alt={store.name}
                className="object-cover"
              />
              <AvatarFallback className="text-lg font-semibold bg-primary text-primary-foreground">
                {store.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
          
          {store.category && !String(store.category).startsWith("CFG:") && (
            <Badge 
              variant="secondary" 
              className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm"
              data-testid={`badge-category-${store.id}`}
            >
              {store.category}
            </Badge>
          )}
        </div>
        
        <div className="p-4">
          <h3 
            className="font-semibold text-lg mb-1 line-clamp-1"
            data-testid={`text-store-name-${store.id}`}
          >
            {store.name}
          </h3>
          
          <div className="flex items-center gap-2 mb-2">
            <StarRating 
              rating={store.averageRating || 0} 
              size="sm" 
              showValue 
              count={store.ratingCount || 0}
            />
          </div>
          
          {store.description && (
            <p 
              className="text-sm text-muted-foreground line-clamp-2"
              data-testid={`text-store-description-${store.id}`}
            >
              {store.description}
            </p>
          )}
        </div>
      </Card>
    </Link>
  );
}
