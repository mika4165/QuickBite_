import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getSupabase } from "@/lib/supabase";
import { Store, Check, X, Store as StoreIcon, Flag, Trash2 } from "lucide-react";
import { StarRating } from "@/components/StarRating";
import { format } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("pending");

  const { data: applications, isLoading } = useQuery<any[]>({
    queryKey: ["/api/merchant_applications"],
  });

  const { data: reportedReviews, isLoading: reportsLoading, error: reportsError } = useQuery<any[]>({
    queryKey: ["/api/admin/review-reports"],
    enabled: selectedTab === "reports" || selectedTab === "reviewed-reports",
    refetchInterval: 5000, // Refetch every 5 seconds to get new reports
    retry: 2,
  });
  
  // Filter reports by status
  const pendingReports = reportedReviews?.filter((r: any) => r.status === "pending") || [];
  const reviewedReports = reportedReviews?.filter((r: any) => r.status === "reviewed") || [];
  const dismissedReports = reportedReviews?.filter((r: any) => r.status === "dismissed") || [];

  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleApprove = async (app: any) => {
    try {
      setIsApproving(true);
      const email = app.email;
      const health = await fetch("/api/health").catch(() => null);
      if (health && health.ok) {
        try {
          const hjson = await health.json();
          if (!hjson.ok && Array.isArray(hjson.missing) && hjson.missing.length) {
            throw new Error(`Missing tables: ${hjson.missing.join(", ")}. Create them in Supabase.`);
          }
        } catch {}
      }
      const ping = await fetch("/api/ping").catch(() => null);
      if (!ping || !ping.ok) {
        throw new Error("Admin provisioning unavailable. Configure SUPABASE_SERVICE_KEY.");
      }
        const res = await fetch("/api/provision-staff", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        if ((res.status === 409) || /already registered/i.test(txt)) {
          throw new Error("Cannot approve: email already registered.");
        }
        throw new Error(txt || "Provisioning failed");
      }
      // Update status first
      await updateStatus.mutateAsync({ id: app.id, status: "approved" });
      
      // Then send email
      console.log("[Admin] Sending approval email to:", email);
          const mail = await fetch("/api/send-approval-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, storeName: app.store_name }),
      }).catch((err) => {
        console.error("[Admin] Email send request failed:", err);
        return null;
      });
      
      if (!mail) {
        toast({ 
          title: "Application approved", 
          description: "Application approved, but email service is unavailable. Check browser console (F12) for details.",
          variant: "destructive"
        });
        return;
      }
      
      if (!mail.ok) {
        const txt = await mail.text().catch(() => "");
        console.error("[Admin] Email send failed:", { status: mail.status, error: txt });
        toast({ 
          title: "Application approved", 
          description: `Application approved, but email failed: ${txt || "Unknown error"}. Make sure email is enabled in Supabase Dashboard → Authentication → Settings.`,
          variant: "destructive"
        });
      } else {
        const responseText = await mail.text().catch(() => "");
        console.log("[Admin] Email sent successfully:", responseText);
        toast({ 
          title: "Application approved", 
          description: "Application approved and notification email sent to merchant. Check spam folder if not received."
        });
      }
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (app: any, reason?: string) => {
    try {
      setIsRejecting(true);
      // Update status to rejected first
      await updateStatus.mutateAsync({ id: app.id, status: "rejected", reason: reason || undefined });
      // Try to send rejection email, but don't fail if it doesn't work
          const mail = await fetch("/api/send-rejection-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: app.email, storeName: app.store_name, reason: reason || undefined }),
      }).catch((err) => {
        console.error("Rejection email send request failed:", err);
        return null;
      });
      if (mail && !mail.ok) {
        const txt = await mail.text().catch(() => "");
        console.error("Rejection email send failed:", { status: mail.status, error: txt });
        toast({ 
          title: "Application rejected", 
          description: `Application rejected, but email failed: ${txt || "Unknown error"}. Check browser console (F12) for details.`,
          variant: "destructive"
        });
      } else if (mail && mail.ok) {
        toast({ 
          title: "Application rejected", 
          description: "Notification sent to merchant email. Check spam folder if not received."
        });
      } else {
        toast({ 
          title: "Application rejected", 
          description: "Application rejected. Email may not have been sent. Check browser console (F12) for details.",
          variant: "default"
        });
      }
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsRejecting(false);
    }
  };

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, reason }: { id: number; status: string; reason?: string }) => {
      return apiRequest("PATCH", `/api/merchant_applications/${id}/status`, { status, reason });
    },
    onSuccess: (_, variables) => {
      toast({ title: "Application updated!" });
      queryClient.invalidateQueries({ queryKey: ["/api/merchant_applications"] });
      // If rejected, invalidate stores query to remove store from user/student dashboard
      if (variables.status === "rejected") {
        queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update application status.",
        variant: "destructive",
      });
    },
  });

  const deleteApplication = useMutation({
    mutationFn: async ({ id, email }: { id: number; email: string }) => {
      return apiRequest("DELETE", `/api/merchant_applications/${id}`, { email });
    },
    onSuccess: () => {
      toast({ 
        title: "Account deleted", 
        description: "The account, store, and all related data have been permanently removed." 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/merchant_applications"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete application.", variant: "destructive" });
    },
  });

  const deleteReview = useMutation({
    mutationFn: async (reviewId: number) => {
      return apiRequest<{ message: string; storeId?: number; storeIdStr?: string }>("DELETE", `/api/admin/reviews/${reviewId}`);
    },
    onSuccess: async (data) => {
      toast({ title: "Review deleted", description: "The review has been removed." });
      // Invalidate admin reports
      queryClient.invalidateQueries({ queryKey: ["/api/admin/review-reports"] });
      
      // Invalidate store reviews so it's removed from user/merchant dashboards
      if (data?.storeId) {
        const storeId = data.storeId;
        const storeIdStr = data.storeIdStr || String(storeId);
        
        // Invalidate all possible query key formats for store reviews
        // Format 1: ["/api/stores/${storeId}/reviews"] (used in StaffDashboard)
        await queryClient.invalidateQueries({ queryKey: [`/api/stores/${storeId}/reviews`] });
        // Format 2: ["/api/stores", storeId, "reviews"] (used in StoreDetail with number)
        await queryClient.invalidateQueries({ queryKey: ["/api/stores", storeId, "reviews"] });
        // Format 3: ["/api/stores", storeIdStr, "reviews"] (used in StoreDetail with string)
        await queryClient.invalidateQueries({ queryKey: ["/api/stores", storeIdStr, "reviews"] });
        
        // Also invalidate the store query itself to update rating count
        await queryClient.invalidateQueries({ queryKey: ["/api/stores", storeId] });
        await queryClient.invalidateQueries({ queryKey: ["/api/stores", storeIdStr] });
        
        // Force immediate refetch of all store review queries
        await queryClient.refetchQueries({ 
          predicate: (query) => {
            const key = query.queryKey;
            if (Array.isArray(key)) {
              const keyStr = key.join("/");
              // Match any query that includes "stores" and "reviews"
              return keyStr.includes("stores") && keyStr.includes("reviews");
            }
            return false;
          }
        });
      }
      
      // Aggressively invalidate all store reviews queries to ensure consistency
      // This catches any other query key formats that might exist
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          if (Array.isArray(key)) {
            const keyStr = key.join("/");
            // Match any query that includes "stores" and "reviews"
            return keyStr.includes("stores") && keyStr.includes("reviews");
          }
          return false;
        }
      });
      
      // Also invalidate all store queries to refresh rating counts (including the main /api/stores query for home page)
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          if (Array.isArray(key) && key.length >= 2) {
            const keyStr = key.join("/");
            const firstPart = String(key[0]);
            // Match ["/api/stores", ...] queries but exclude reviews and meals
            return firstPart === "/api/stores" && !keyStr.includes("reviews") && !keyStr.includes("meals");
          }
          return false;
        }
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error)?.message || "Failed to delete review.",
        variant: "destructive",
      });
    },
  });

  const dismissReport = useMutation({
    mutationFn: async (reportId: number) => {
      return apiRequest("POST", `/api/admin/review-reports/${reportId}/dismiss`);
    },
    onSuccess: () => {
      toast({ title: "Report dismissed", description: "The report has been dismissed." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/review-reports"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error)?.message || "Failed to dismiss report.",
        variant: "destructive",
      });
    },
  });

  const filtered = (applications || []).filter((a: any) => a.status === selectedTab);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <StoreIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>

        <Card className="p-6">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="mb-4">
              {[
                { value: "pending", label: "Pending" },
                { value: "approved", label: "Approved" },
                { value: "rejected", label: "Rejected" },
                { value: "reports", label: "Reported Reviews", icon: Flag },
                { value: "reviewed-reports", label: "Reviewed Reports", icon: Flag },
              ].map((t) => (
                <TabsTrigger key={t.value} value={t.value} className="gap-2">
                  {t.icon && <t.icon className="h-4 w-4" />}
                  <span>{t.label}</span>
                  {t.value === "reports" ? (
                    <Badge variant="secondary">
                      {pendingReports.length > 0 ? pendingReports.length : 0}
                    </Badge>
                  ) : t.value === "reviewed-reports" ? (
                    <Badge variant="secondary">
                      {dismissedReports.length > 0 ? dismissedReports.length : 0}
                    </Badge>
                  ) : (
                  <Badge variant="secondary">
                    {(applications || []).filter((a: any) => a.status === t.value).length}
                  </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {selectedTab === "reports" || selectedTab === "reviewed-reports" ? (
              reportsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded" />
                  ))}
                </div>
              ) : reportsError ? (
                <Card className="p-8 text-center">
                  <p className="text-destructive">Error loading reports: {(reportsError as Error)?.message || "Unknown error"}</p>
                </Card>
              ) : (selectedTab === "reports" ? pendingReports : dismissedReports).length > 0 ? (
                <div className="space-y-4">
                  {/* Show pending reports for "reports" tab, dismissed reports for "reviewed-reports" tab */}
                  {(selectedTab === "reports" ? pendingReports : dismissedReports)
                    .filter((report: any) => {
                      // For pending reports, only show if review exists
                      if (selectedTab === "reports" && report.status === "pending" && !report.ratings) {
                        return false;
                      }
                      // For dismissed reports, show all (even if review was deleted)
                      return true;
                    })
                    .map((report: any) => {
                    const review = report.ratings;
                    const reviewUser = review?.users;
                    const reporter = report.reporter;
                    return (
                      <Card key={report.id} className={`p-4 ${report.status === "pending" ? "border-l-4 border-l-primary" : report.status === "reviewed" ? "opacity-75" : "opacity-50"}`}>
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage
                              src={reviewUser?.profileImageUrl || undefined}
                              alt={reviewUser?.firstName || "User"}
                            />
                            <AvatarFallback>
                              {reviewUser?.firstName?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium">
                                    {reviewUser?.firstName} {reviewUser?.lastName}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {review?.created_at ? format(new Date(review.created_at), "MMM d, yyyy") : ""}
                                  </span>
                                  {report.status === "pending" && (
                                    <Badge variant="destructive" className="text-xs">Pending</Badge>
                                  )}
                                  {report.status === "reviewed" && (
                                    <Badge variant="secondary" className="text-xs">Reviewed</Badge>
                                  )}
                                  {report.status === "dismissed" && (
                                    <Badge variant="outline" className="text-xs">Dismissed</Badge>
                                  )}
                                </div>
                                <StarRating
                                  rating={review?.rating || 0}
                                  size="sm"
                                  className="mt-1"
                                />
                                {review?.comment && (
                                  <p className="text-sm text-muted-foreground mt-2">
                                    {review.comment}
                                  </p>
                                )}
                                {review?.image_urls && Array.isArray(review.image_urls) && review.image_urls.length > 0 && (
                                  <div className="grid grid-cols-3 gap-2 mt-3">
                                    {review.image_urls.map((url: string, index: number) => (
                                      <img
                                        key={index}
                                        src={url}
                                        alt={`Review photo ${index + 1}`}
                                        className="w-full h-24 object-cover rounded-lg"
                                      />
                                    ))}
                                  </div>
                                )}
                                <div className="mt-3 pt-3 border-t border-border">
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Flag className="h-3 w-3" />
                                    <span>
                                      Reported by {reporter?.firstName} {reporter?.lastName} on{" "}
                                      {format(new Date(report.created_at), "MMM d, yyyy 'at' h:mm a")}
                                    </span>
                                  </div>
                                  {report.reason && (
                                    <p className="text-xs text-muted-foreground mt-1 italic">
                                      Reason: {report.reason}
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Store: {review?.stores?.name || "Unknown"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                {review ? (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => {
                                        if (confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
                                          deleteReview.mutate(review.id);
                                        }
                                      }}
                                      disabled={deleteReview.isPending}
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Delete Review
                                    </Button>
                                    {report.status === "pending" && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => dismissReport.mutate(report.id)}
                                        disabled={dismissReport.isPending}
                                      >
                                        Dismiss Report
                                      </Button>
                                    )}
                                    {report.status !== "pending" && (
                                      <span className="text-xs text-muted-foreground">
                                        {report.status === "reviewed" ? "Review was previously deleted" : "Report was dismissed"}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">
                                    Review already deleted
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <Flag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {selectedTab === "reviewed-reports" ? "No dismissed reports" : "No reported reviews"}
                  </p>
                </Card>
              )
            ) : isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded" />
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <div className="space-y-3">
                {filtered.map((app: any) => (
                  <Card key={app.id} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{app.store_name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{app.email}</p>
                        {app.category && (
                          <div className="mt-1"><Badge variant="secondary">{app.category}</Badge></div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedTab === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(app)}
                            disabled={isApproving || updateStatus.isPending}
                            data-testid={`admin-approve-${app.id}`}
                          >
                            <Check className="h-4 w-4 mr-1" /> Approve
                          </Button>
                        )}
                        {selectedTab === "approved" ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm(
                                `Are you sure you want to permanently delete this account?\n\n` +
                                `This will delete:\n` +
                                `- The user account (they will not be able to log in again)\n` +
                                `- All their stores\n` +
                                `- All their menu items\n` +
                                `- All orders and messages\n` +
                                `- All reviews and ratings\n\n` +
                                `This action cannot be undone.`
                              )) {
                                deleteApplication.mutate({ id: app.id, email: app.email });
                              }
                            }}
                            disabled={deleteApplication.isPending}
                            data-testid={`admin-delete-${app.id}`}
                          >
                            <X className="h-4 w-4 mr-1" /> Delete Account
                          </Button>
                        ) : selectedTab !== "rejected" ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(app)}
                            disabled={updateStatus.isPending || isRejecting}
                            data-testid={`admin-reject-${app.id}`}
                          >
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    {app.description && (
                      <p className="text-sm text-muted-foreground mt-2">{app.description}</p>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No applications in this status</p>
              </Card>
            )}
          </Tabs>
        </Card>

        

        <Card className="p-6 mt-6">
          <h2 className="text-lg font-semibold mb-2">How acceptance works</h2>
          <p className="text-sm text-muted-foreground">
            Approving an application lets the merchant register with this email. On successful sign up,
            their role is set to staff and a store is created from their application.
          </p>
        </Card>
      </main>
    </div>
  );
}
