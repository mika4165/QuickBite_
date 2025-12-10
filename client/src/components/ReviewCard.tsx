import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StarRating } from "./StarRating";
import { Flag } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Rating, User } from "@shared/schema";
import { format } from "date-fns";

interface ReviewCardProps {
  review: Rating & { user?: User };
  showReportButton?: boolean;
}

export function ReviewCard({ review, showReportButton = true }: ReviewCardProps) {
  const reviewUser = review.user;
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");
  
  // Don't show report button for staff/merchants
  const isStaff = currentUser?.role === "staff" || currentUser?.role === "admin";
  const canReport = showReportButton && !isStaff;
  
  const reportReview = useMutation({
    mutationFn: async (reason: string) => {
      return apiRequest("POST", `/api/reviews/${review.id}/report`, { reason });
    },
    onSuccess: () => {
      toast({
        title: "Review reported",
        description: "Thank you for your report. We will review it shortly.",
      });
      setReportDialogOpen(false);
      setSelectedReason("");
      setCustomReason("");
    },
    onError: (error) => {
      const errorMessage = (error as Error)?.message || "Failed to report review. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleReportClick = () => {
    if (!currentUser) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to report a review.",
        variant: "destructive",
      });
      return;
    }
    if (currentUser.id === review.userId || currentUser.id === (review as any).user_id) {
      toast({
        title: "Cannot report",
        description: "You cannot report your own review.",
        variant: "destructive",
      });
      return;
    }
    setReportDialogOpen(true);
  };

  const handleSubmitReport = () => {
    if (!selectedReason) {
      toast({
        title: "Please select a reason",
        description: "You must select a reason for reporting this review.",
        variant: "destructive",
      });
      return;
    }
    
    let reason = "";
    switch (selectedReason) {
      case "offensive":
        reason = "Offensive, hateful, or sexual content";
        break;
      case "spam":
        reason = "Spam or advertisement";
        break;
      case "irrelevant":
        reason = "Irrelevant or False information";
        break;
      case "personal":
        reason = "Personal or restricted information";
        break;
      case "something_else":
        if (!customReason.trim()) {
          toast({
            title: "Please specify a reason",
            description: "You must provide a reason when selecting 'Something else'.",
            variant: "destructive",
          });
          return;
        }
        reason = `Something else: ${customReason.trim()}`;
        break;
      default:
        reason = selectedReason;
    }
    
    reportReview.mutate(reason);
  };
  
  return (
    <Card className="p-4" data-testid={`review-${review.id}`}>
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage 
            src={reviewUser?.profileImageUrl || undefined}
            alt={reviewUser?.firstName || "User"}
            className="object-cover"
          />
          <AvatarFallback>
            {reviewUser?.firstName?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="font-medium">
              {reviewUser?.firstName && reviewUser?.lastName 
                ? `${reviewUser.firstName} ${reviewUser.lastName}`
                : reviewUser?.firstName || reviewUser?.email || "Anonymous User"}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {review.createdAt ? format(new Date(review.createdAt), "MMM d, yyyy") : ""}
              </span>
              {canReport && currentUser && currentUser.id !== review.userId && currentUser.id !== (review as any).user_id && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleReportClick}
                    className="h-6 px-2 text-xs"
                    title="Report this review"
                  >
                    <Flag className="h-3 w-3 mr-1" />
                    Report
                  </Button>
                  <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                    <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Report Review</DialogTitle>
                      <DialogDescription>
                        Please select a reason for reporting this review. This helps us review the content more effectively.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
                        <div className="flex items-start space-x-2 space-y-0">
                          <RadioGroupItem value="offensive" id="offensive" className="mt-1" />
                          <Label htmlFor="offensive" className="font-normal cursor-pointer">
                            Offensive, hateful, or sexual content
                          </Label>
                        </div>
                        <div className="flex items-start space-x-2 space-y-0">
                          <RadioGroupItem value="spam" id="spam" className="mt-1" />
                          <Label htmlFor="spam" className="font-normal cursor-pointer">
                            Spam or advertisement
                          </Label>
                        </div>
                        <div className="flex items-start space-x-2 space-y-0">
                          <RadioGroupItem value="irrelevant" id="irrelevant" className="mt-1" />
                          <Label htmlFor="irrelevant" className="font-normal cursor-pointer">
                            Irrelevant or False information
                          </Label>
                        </div>
                        <div className="flex items-start space-x-2 space-y-0">
                          <RadioGroupItem value="personal" id="personal" className="mt-1" />
                          <Label htmlFor="personal" className="font-normal cursor-pointer">
                            Personal or restricted information
                          </Label>
                        </div>
                        <div className="flex items-start space-x-2 space-y-0">
                          <RadioGroupItem value="something_else" id="something_else" className="mt-1" />
                          <Label htmlFor="something_else" className="font-normal cursor-pointer">
                            Something else: specify
                          </Label>
                        </div>
                      </RadioGroup>
                      {selectedReason === "something_else" && (
                        <div className="space-y-2">
                          <Label htmlFor="custom-reason">Please specify the reason</Label>
                          <Textarea
                            id="custom-reason"
                            placeholder="Enter your reason for reporting this review..."
                            value={customReason}
                            onChange={(e) => setCustomReason(e.target.value)}
                            rows={3}
                          />
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setReportDialogOpen(false);
                          setSelectedReason("");
                          setCustomReason("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubmitReport}
                        disabled={reportReview.isPending || !selectedReason}
                      >
                        {reportReview.isPending ? "Submitting..." : "Submit Report"}
                      </Button>
                    </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          </div>
          
          <StarRating rating={typeof review.rating === 'string' ? parseInt(review.rating) : review.rating} size="sm" className="mt-1" />
          
          {review.comment && (
            <p className="text-sm text-muted-foreground mt-2">
              {review.comment}
            </p>
          )}
          
          {(review.imageUrls || (review as any).image_urls) && 
           Array.isArray(review.imageUrls || (review as any).image_urls) && 
           (review.imageUrls || (review as any).image_urls).length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {(review.imageUrls || (review as any).image_urls).map((url: string, index: number) => (
                <img
                  key={index}
                  src={url}
                  alt={`Review photo ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => window.open(url, '_blank')}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
