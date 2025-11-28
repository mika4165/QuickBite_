import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, MessageCircle, ShoppingCart, Star } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { MealCard } from "@/components/MealCard";
import { StarRating } from "@/components/StarRating";
import { ReviewCard } from "@/components/ReviewCard";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { StoreWithRating, Meal, Rating, User } from "@shared/schema";

export default function StoreDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { getTotalItems, getTotalAmount } = useCart();
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  
  const { data: store, isLoading: storeLoading } = useQuery<StoreWithRating>({
    queryKey: ["/api/stores", id],
  });

  const { data: meals, isLoading: mealsLoading } = useQuery<Meal[]>({
    queryKey: ["/api/stores", id, "meals"],
    enabled: !!id,
  });

  const { data: reviews } = useQuery<(Rating & { user?: User })[]>({
    queryKey: ["/api/stores", id, "reviews"],
    enabled: !!id,
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/stores/${id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment || undefined,
      });
    },
    onSuccess: () => {
      toast({ title: "Review submitted!", description: "Thank you for your feedback." });
      setReviewRating(0);
      setReviewComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/stores", id, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stores", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in to leave a review.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    },
  });

  const totalItems = getTotalItems();
  const totalAmount = getTotalAmount();
  const mealCategories = meals
    ? [...new Set(meals.map((m) => m.category).filter(Boolean))]
    : [];

  const defaultBanner = "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=1200&h=400&fit=crop";

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="aspect-[3/1] rounded-xl mb-6" />
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Store not found</h2>
          <Link href="/">
            <Button>Go back home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to stores
          </Button>
        </Link>

        <div className="relative rounded-xl overflow-hidden mb-6">
          <img
            src={store.bannerImageUrl || defaultBanner}
            alt={store.name}
            className="w-full aspect-[3/1] object-cover"
            data-testid="img-store-banner"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
            <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
              <AvatarImage 
                src={store.logoUrl || undefined} 
                alt={store.name}
                className="object-cover"
              />
              <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                {store.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-white">
              <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-store-name">
                {store.name}
              </h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {store.category && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-0">
                    {store.category}
                  </Badge>
                )}
                <StarRating
                  rating={store.averageRating || 0}
                  size="md"
                  showValue
                  count={store.ratingCount || 0}
                  className="text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {store.description && (
          <p className="text-muted-foreground mb-6" data-testid="text-store-description">
            {store.description}
          </p>
        )}

        <Tabs defaultValue="menu" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="menu" data-testid="tab-menu">Menu</TabsTrigger>
            <TabsTrigger value="reviews" data-testid="tab-reviews">
              Reviews ({store.ratingCount || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="menu">
            {mealsLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-square rounded-lg" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : meals && meals.length > 0 ? (
              <div className="space-y-8">
                {mealCategories.length > 0 ? (
                  mealCategories.map((category) => (
                    <div key={category}>
                      <h3 className="text-lg font-semibold mb-4">{category}</h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {meals
                          .filter((meal) => meal.category === category)
                          .map((meal) => (
                            <MealCard key={meal.id} meal={meal} store={store} />
                          ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {meals.map((meal) => (
                      <MealCard key={meal.id} meal={meal} store={store} />
                    ))}
                  </div>
                )}
                
                {meals.filter((m) => !m.category).length > 0 && mealCategories.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Other</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {meals
                        .filter((meal) => !meal.category)
                        .map((meal) => (
                          <MealCard key={meal.id} meal={meal} store={store} />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No meals available at the moment</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews">
            <div className="space-y-6">
              {isAuthenticated && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Leave a Review</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Your Rating</label>
                      <StarRating
                        rating={reviewRating}
                        size="lg"
                        interactive
                        onRatingChange={setReviewRating}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Comment (optional)</label>
                      <Textarea
                        placeholder="Share your experience..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        rows={3}
                        data-testid="input-review-comment"
                      />
                    </div>
                    <Button
                      onClick={() => submitReview.mutate()}
                      disabled={reviewRating === 0 || submitReview.isPending}
                      data-testid="button-submit-review"
                    >
                      {submitReview.isPending ? "Submitting..." : "Submit Review"}
                    </Button>
                  </div>
                </Card>
              )}

              {reviews && reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">No reviews yet. Be the first!</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
          <div className="container mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">{totalItems} item{totalItems > 1 ? "s" : ""}</p>
              <p className="text-primary font-semibold">₱{totalAmount.toFixed(2)}</p>
            </div>
            <Link href="/cart">
              <Button data-testid="button-view-cart">
                <ShoppingCart className="h-4 w-4 mr-2" />
                View Cart
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
