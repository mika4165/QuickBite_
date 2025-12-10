import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle, Send, Phone, Clock, Store, Star, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { OrderStatusProgress } from "@/components/OrderStatusProgress";
import { ChatBubble } from "@/components/ChatBubble";
import { StarRating } from "@/components/StarRating";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getSupabase } from "@/lib/supabase";
import type { OrderWithDetails, MessageWithSender } from "@shared/schema";
import { format } from "date-fns";

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewImagePreviews, setReviewImagePreviews] = useState<string[]>([]);
  const reviewImageInputRef = useRef<HTMLInputElement>(null);

  const { data: order, isLoading } = useQuery<OrderWithDetails>({
    queryKey: ["/api/orders", id],
  });

  const { data: messages } = useQuery<MessageWithSender[]>({
    queryKey: ["/api/orders", id, "messages"],
    enabled: !!id,
    refetchInterval: 3000,
  });

  const sendMessage = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/orders/${id}/messages`, {
        content: message,
      });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/orders", id, "messages"] });
    },
    onError: (error) => {
      const errorMessage = (error as Error)?.message || "Failed to send message. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage.mutate();
  };

  // Check if user has already reviewed this specific order
  const { data: existingReview } = useQuery({
    queryKey: ["/api/orders", order?.id, "review"],
    enabled: !!order?.id && !!user?.id && order?.status === "claimed",
    queryFn: async () => {
      if (!order?.id || !user?.id) return null;
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("ratings")
        .select("*")
        .eq("order_id", order.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error || !data) return null;
      return {
        ...data,
        imageUrls: data.image_urls || [],
        userId: data.user_id,
        storeId: data.store_id,
        createdAt: data.created_at,
      };
    },
  });

  const handleReviewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + reviewImages.length > 3) {
      toast({
        title: "Too many images",
        description: "You can upload a maximum of 3 images.",
        variant: "destructive",
      });
      return;
    }
    const newFiles = files.slice(0, 3 - reviewImages.length);
    setReviewImages([...reviewImages, ...newFiles]);
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setReviewImagePreviews([...reviewImagePreviews, ...newPreviews]);
  };

  const removeReviewImage = (index: number) => {
    const newImages = reviewImages.filter((_, i) => i !== index);
    const newPreviews = reviewImagePreviews.filter((_, i) => i !== index);
    setReviewImages(newImages);
    setReviewImagePreviews(newPreviews);
    // Revoke object URLs to prevent memory leaks
    URL.revokeObjectURL(reviewImagePreviews[index]);
  };

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!order?.id) throw new Error("Order not found");
      return apiRequest("POST", `/api/orders/${order.id}/review`, {
        rating: reviewRating,
        comment: reviewComment,
        imageUrls: reviewImages,
      });
    },
    onSuccess: () => {
      toast({
        title: "Review submitted!",
        description: "Thank you for your feedback.",
      });
      setReviewRating(5);
      setReviewComment("");
      setReviewImages([]);
      reviewImagePreviews.forEach(url => URL.revokeObjectURL(url));
      setReviewImagePreviews([]);
      // Invalidate store reviews
      queryClient.invalidateQueries({ queryKey: ["/api/stores", order?.storeId, "reviews"] });
      // Invalidate the main stores query to update ratings on home page
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      // Invalidate order query
      queryClient.invalidateQueries({ queryKey: ["/api/orders", id] });
      // Invalidate the review check query
      queryClient.invalidateQueries({ queryKey: ["/api/orders", order?.id, "review"] });
    },
    onError: (error) => {
      const errorMessage = (error as Error)?.message || "Failed to submit review. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const defaultImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-48 rounded-lg mb-6" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Order not found</h2>
          <Link href="/orders">
            <Button>Go to My Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <Link href="/orders">
          <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to orders
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Order #{order.id}</h2>
                <span className="text-sm text-muted-foreground">
                  {order.createdAt
                    ? format(new Date(order.createdAt), "MMM d, yyyy 'at' h:mm a")
                    : ""}
                </span>
              </div>

              <OrderStatusProgress status={order.status || "pending_payment"} />
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={order.store?.logoUrl || undefined}
                    alt={order.store?.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {order.store?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{order.store?.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Pickup: {order.pickupTime}
                  </p>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.meal?.imageUrl || defaultImage}
                      alt={item.meal?.name || `Meal #${item.mealId}`}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.meal?.name || `Meal #${item.mealId}`}</h4>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity}
                        {item.meal?.description && (
                          <span className="block mt-1">{item.meal.description}</span>
                        )}
                      </p>
                    </div>
                    <p className="font-medium">
                      ₱{(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {order.notes && (
                <div className="border-t border-border mt-4 pt-4">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Notes:</span> {order.notes}
                  </p>
                </div>
              )}

              <div className="border-t border-border mt-4 pt-4 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg text-primary">
                  ₱{parseFloat(order.totalAmount || "0").toFixed(2)}
                </span>
              </div>
            </Card>

            {order.status === "claimed" && !existingReview && user && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Leave a Review</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Rating</label>
                    <StarRating
                      rating={reviewRating}
                      interactive
                      onRatingChange={setReviewRating}
                      size="lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Comment</label>
                    <Textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience..."
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Photos (optional, up to 3)
                    </label>
                    <div className="space-y-2">
                      {reviewImagePreviews.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {reviewImagePreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={preview}
                                alt={`Review ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => removeReviewImage(index)}
                                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {reviewImages.length < 3 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => reviewImageInputRef.current?.click()}
                          className="w-full"
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Add Photo ({reviewImages.length}/3)
                        </Button>
                      )}
                      <input
                        ref={reviewImageInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleReviewImageChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => submitReview.mutate()}
                    disabled={submitReview.isPending || !reviewRating}
                    className="w-full"
                  >
                    {submitReview.isPending ? "Submitting..." : "Submit Review"}
                  </Button>
                </div>
              </Card>
            )}
            
            {order.status === "claimed" && existingReview && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Your Review</h3>
                <div className="space-y-2">
                  <StarRating
                    rating={typeof existingReview.rating === 'string' ? parseInt(existingReview.rating) : existingReview.rating}
                    size="md"
                  />
                  {existingReview.comment && (
                    <p className="text-sm text-muted-foreground">{existingReview.comment}</p>
                  )}
                  {existingReview.imageUrls && Array.isArray(existingReview.imageUrls) && existingReview.imageUrls.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {existingReview.imageUrls.map((url: string, index: number) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Review photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="h-[500px] flex flex-col">
              <div className="p-4 border-b border-border flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Messages</h3>
              </div>

              <ScrollArea className="flex-1 p-4">
                {messages && messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <ChatBubble
                        key={msg.id}
                        message={msg}
                        isOwn={msg.senderId === user?.id}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No messages yet. Start a conversation with the store.
                    </p>
                  </div>
                )}
              </ScrollArea>

              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    data-testid="input-message"
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!message.trim() || sendMessage.isPending}
                    data-testid="button-send"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
