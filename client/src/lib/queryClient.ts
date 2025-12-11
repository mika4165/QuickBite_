import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getSupabase } from "./supabase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: any,
): Promise<T> {
  // Map legacy API endpoints to Supabase operations
  if (url === "/api/login" && method === "POST") {
    const supabase = getSupabase();
    const { email, password } = data || {};
    const admins = (import.meta.env.VITE_ADMIN_EMAILS as string | undefined)?.split(",").map(s => s.trim()).filter(Boolean) || [];
    
    // Check for rejected applications BEFORE attempting login
    if (email && !admins.includes(email)) {
      const { data: rejectedApp } = await supabase
        .from("merchant_applications")
        .select("status")
        .eq("email", email)
        .eq("status", "rejected")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (rejectedApp) {
        throw new Error("Your merchant application has been rejected. You cannot log in with this account.");
      }
    }
    
    let { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      if (email && admins.includes(email)) {
        const res = await fetch("/api/confirm-admin", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        await throwIfResNotOk(res);
        const retry = await supabase.auth.signInWithPassword({ email, password });
        if (retry.error) throw new Error(retry.error.message);
        authData = retry.data;
      } else {
        // Check if user exists in users table but Auth login failed
        // This could mean password is wrong or Auth user doesn't exist
        const { data: existingUser } = await supabase
          .from("users")
          .select("email, role")
          .eq("email", email)
          .maybeSingle();
        
        if (existingUser) {
          // User exists in database but Auth failed - likely wrong password
          throw new Error("Invalid email or password. Please check your credentials and try again.");
        } else {
          // User doesn't exist at all
          throw new Error("Invalid email or password. Please check your credentials and try again.");
        }
      }
    }
    
    // Double-check for rejected applications after successful auth (in case they somehow got through)
    if (email && !admins.includes(email) && authData?.user) {
      const { data: rejectedApp } = await supabase
        .from("merchant_applications")
        .select("status")
        .eq("email", email)
        .eq("status", "rejected")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (rejectedApp) {
        // Sign them out immediately
        await supabase.auth.signOut();
        throw new Error("Your merchant application has been rejected. You cannot log in with this account.");
      }
    }
    
    let isApprovedStaff = false;
    if (email && !admins.includes(email)) {
      // Check approved_staff for staff login
      try {
        const res = await fetch("/api/login-approved-staff", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        isApprovedStaff = res.ok;
      } catch {}
    }
    const userId = authData.user?.id as string | undefined;
    let role = "student";
    if (email && admins.includes(email)) {
      role = "admin";
    } else if (email) {
      role = isApprovedStaff ? "staff" : "student";
    }
    if (userId) {
      const { error: upErr } = await supabase.from("users").upsert({ id: userId, email, role });
      if (upErr) throw new Error(upErr.message);
    }
    return { message: "Login successful", user: authData.user } as any;
  }

  if (url === "/api/register" && method === "POST") {
    const supabase = getSupabase();
    const { email, password } = data || {};
    
    if (!email || !password) {
      throw new Error("Email and password are required");
    }
    
    // Normalize email to lowercase for consistent checking
    const normalizedEmail = String(email).toLowerCase().trim();
    
    // CRITICAL CHECK: Use internal endpoint with service key to bypass RLS
    // This ensures we can check email existence even when not authenticated
    try {
      const checkRes = await fetch("/api/check-email-exists", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        
        // If email exists anywhere, block registration
        if (checkData.exists) {
          console.error("BLOCKING REGISTRATION - Email found:", checkData);
          
          // Provide specific error message based on where email was found
          if (checkData.inUsers && checkData.userRole) {
            const errorMsg = `This email is already registered as a ${checkData.userRole}. Please use a different email or log in with your existing account.`;
            console.error("THROWING ERROR - Email already has role:", errorMsg);
            throw new Error(errorMsg);
          } else if (checkData.type === "merchant_application") {
            if (checkData.appStatus === "approved") {
              throw new Error("This email already has an approved merchant application. Please use a different email.");
            } else {
              throw new Error("This email already has a pending merchant application. Please use a different email.");
            }
          } else if (checkData.inApprovedStaff) {
            throw new Error("This email is already registered as staff. Please use a different email.");
          } else {
            throw new Error("This email is already registered. Please use a different email or log in with your existing account.");
          }
        }
        
        console.log("Email check passed - no existing user found for:", normalizedEmail);
      } else {
        // If check endpoint fails, log but continue (fallback to old method)
        console.warn("Email check endpoint failed, falling back to direct query");
        const checkText = await checkRes.text().catch(() => "");
        throw new Error(`Unable to verify email availability: ${checkText || checkRes.statusText}`);
      }
    } catch (error: any) {
      // If it's already an Error with a message, re-throw it
      if (error instanceof Error) {
        throw error;
      }
      // Otherwise, wrap it
      throw new Error(error?.message || "Unable to verify email availability. Please try again later.");
    }
    
    // Check if email is already used for merchant/staff application (any status except rejected)
    const { data: existingApp } = await supabase
      .from("merchant_applications")
      .select("email, status")
      .eq("email", normalizedEmail)
      .in("status", ["pending", "approved"])
      .maybeSingle();
    
    if (existingApp) {
      if (existingApp.status === "approved") {
        throw new Error("This email is already registered for an approved merchant application. Please use a different email.");
      } else {
        throw new Error("This email already has a pending merchant application. Please use a different email.");
      }
    }
    
    // Check if email is already in approved_staff
    const { data: existingStaff } = await supabase
      .from("approved_staff")
      .select("email")
      .eq("email", normalizedEmail)
      .maybeSingle();
    
    if (existingStaff) {
      throw new Error("This email is already registered as staff. Please use a different email.");
    }
    
    // Supabase Auth will also check if email exists, but we check our tables first for better error messages
    // Use normalized email for signup
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    });
    if (error) {
      // If email already exists in auth, provide a clearer message
      if (error.message.includes("already registered") || error.message.includes("already exists") || error.message.includes("User already registered")) {
        throw new Error("This email is already registered. Please use a different email or log in with your existing account.");
      }
      throw new Error(error.message);
    }
    const user = signUpData.user;
    if (user) {
      // DOUBLE-CHECK: Verify email still doesn't exist in users table before creating
      // This prevents race conditions where user might have been created between checks
      const { data: doubleCheckUser } = await supabase
        .from("users")
        .select("email, role")
        .eq("email", normalizedEmail)
        .maybeSingle();
      
      if (doubleCheckUser) {
        // User was created between our initial check and now - block registration
        if (doubleCheckUser.role && (doubleCheckUser.role === "student" || doubleCheckUser.role === "staff" || doubleCheckUser.role === "admin")) {
          throw new Error(`This email is already registered as a ${doubleCheckUser.role}. Please use a different email or log in with your existing account.`);
        }
        throw new Error("This email is already registered. Please use a different email or log in with your existing account.");
      }
      
      // Determine role based on approved merchant application
      const { data: app } = await supabase
        .from("merchant_applications")
        .select("*")
        .eq("email", normalizedEmail)
        .eq("status", "approved")
        .limit(1)
        .maybeSingle();

      const role = app ? "staff" : "student";

      // Insert user into users table
      const { error: userErr, data: userData } = await supabase.from("users").upsert({
        id: user.id,
        email: normalizedEmail,
        role,
      });
      
      if (userErr) {
        console.error("Error saving user to database:", userErr);
        throw new Error(`Failed to save user: ${userErr.message}`);
      }
      console.log("✓ User saved to database successfully");

      // If approved application exists, create a store for the new staff
      if (app) {
        const { error: storeErr, data: storeData } = await supabase.from("stores").insert({
          name: app.store_name,
          description: app.description ?? null,
          category: app.category ?? null,
          owner_id: user.id,
        });
        if (storeErr) {
          console.error("Error creating store:", storeErr);
          throw new Error(`Failed to create store: ${storeErr.message}`);
        }
        console.log("✓ Store created successfully");
      }
    }
    return { message: "Account created" } as any;
  }

  if (url === "/api/merchant_applications" && method === "POST") {
    const supabase = getSupabase();
    const { email, storeName, description, phone } = data || {};
    if (!email || !storeName) throw new Error("Email and store name required");
    
    // Comprehensive check: Ensure email is not used anywhere
    // FIRST: Check if email exists in users table (any role) - this catches student/user accounts
    const { data: existingUser } = await supabase
      .from("users")
      .select("email, role")
      .eq("email", email)
      .maybeSingle();
    
    if (existingUser) {
      throw new Error("This email is already registered as a user. Please use a different email or log in with your existing account.");
    }
    
    // Also check Supabase Auth to catch any registered emails
    // Note: This requires admin access, so we'll rely on the users table check above
    // The internal endpoint handles Auth checks more thoroughly
    
    // Check if email already has a pending or approved merchant application
    const { data: existingApp } = await supabase
      .from("merchant_applications")
      .select("email, status")
      .eq("email", email)
      .in("status", ["pending", "approved"])
      .maybeSingle();
    
    if (existingApp) {
      if (existingApp.status === "approved") {
        throw new Error("This email already has an approved merchant application. Please use a different email.");
      } else {
        throw new Error("This email already has a pending merchant application. Please wait for approval or use a different email.");
      }
    }
    
    // Check if email is already in approved_staff
    const { data: existingStaff } = await supabase
      .from("approved_staff")
      .select("email")
      .eq("email", email)
      .maybeSingle();
    
    if (existingStaff) {
      throw new Error("This email is already registered as staff. Please use a different email.");
    }
    
    const payload = {
      email: String(email),
      store_name: String(storeName),
      category: null,
      description: description ? String(description) : null,
      phone: phone ? String(phone) : null,
      status: "pending",
    } as any;
    const { error } = await supabase
      .from("merchant_applications")
      .insert(payload);
    if (error) throw new Error(error.message);
    return { message: "Application submitted" } as any;
  }

  if (url.match(/^\/api\/staff\/orders\/\d+\/status$/) && method === "PATCH") {
    const supabase = getSupabase();
    const orderId = parseInt(url.split("/")[4]);
    const { status } = data || {};
    // Update status and updated_at timestamp to ensure notifications work correctly
    const { error } = await supabase
      .from("orders")
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId);
    if (error) throw new Error(error.message);
    return { message: "Order updated" } as any;
  }

  if (url.match(/^\/api\/orders\/\d+\/messages$/) && method === "POST") {
    const supabase = getSupabase();
    const orderId = parseInt(url.split("/")[3]);
    
    // Get session - use same pattern as other endpoints
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) {
      throw new Error("401: Unauthorized - Please log in");
    }
    
    const { content } = data || {};
    if (!content || !content.trim()) {
      throw new Error("Message content is required");
    }
    
    // Verify the order exists
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id")
      .eq("id", orderId)
      .single();
    if (orderErr || !order) {
      throw new Error("Order not found");
    }
    
    // Insert message - RLS will handle permission check
    const { data: inserted, error } = await supabase
      .from("messages")
      .insert({ order_id: orderId, sender_id: userId, content: content.trim() })
      .select()
      .single();
    if (error) {
      console.error("Message insert error:", error);
      // Provide more specific error messages
      if (error.code === "42501" || error.message?.includes("permission") || error.message?.includes("policy")) {
        throw new Error("You don't have permission to send messages for this order. Make sure you're the customer or the store owner.");
      }
      throw new Error(error.message || "Failed to send message. Please try again.");
    }
    return { message: "Message sent", id: inserted?.id } as any;
  }

  if (url === "/api/orders" && method === "POST") {
    const supabase = getSupabase();
    const { data: auth } = await supabase.auth.getUser();
    const studentId = auth.user?.id;
    if (!studentId) throw new Error("401: Unauthorized");
    const { storeId, pickupTime, notes, totalAmount, paymentProofUrl, items } = data || {};
    if (!storeId || !pickupTime) throw new Error("Store and pickup time required");
    const { data: store } = await supabase.from("stores").select("*").eq("id", storeId).single();
    const cat = (store as any)?.category || "";
    if (typeof cat === "string" && cat.startsWith("CFG:")) {
      try {
        const cfg = JSON.parse(cat.slice(4));
        const slots = Array.isArray(cfg?.slots) ? cfg.slots : [];
        const slotCfg = slots.find((s: any) => String(s.time) === String(pickupTime));
        if (slotCfg && slotCfg.limit) {
          const { data: existing } = await supabase
            .from("orders")
            .select("id,status")
            .eq("store_id", storeId)
            .eq("pickup_time", pickupTime);
          const activeCount = (existing || []).filter((o: any) => !["cancelled"].includes(o.status || "")).length;
          if (activeCount >= Number(slotCfg.limit)) {
            throw new Error("Pickup slot is full. Please choose another time.");
          }
        }
      } catch {
        // ignore malformed config
      }
    }
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        student_id: studentId,
        store_id: storeId,
        status: paymentProofUrl ? "payment_submitted" : "pending_payment",
        total_amount: totalAmount,
        pickup_time: pickupTime,
        notes: notes ?? null,
        payment_proof_url: paymentProofUrl ?? null,
      })
      .select("*")
      .single();
    if (orderErr) throw new Error(orderErr.message);
    if (Array.isArray(items) && items.length) {
      const payload = items.map((it: any) => ({
        order_id: order.id,
        meal_id: it.mealId,
        quantity: it.quantity,
        price: it.price,
      }));
      const { error: itemsErr } = await supabase.from("order_items").insert(payload);
      if (itemsErr) throw new Error(itemsErr.message);
    }
    return order as any;
  }

  if (url.match(/^\/api\/merchant_applications\/\d+\/status$/) && method === "PATCH") {
    const supabase = getSupabase();
    const id = parseInt(url.split("/")[3]);
    const { status, reason } = data || {};
    
    // Get the application details
    const { data: app } = await supabase
      .from("merchant_applications")
      .select("email, store_name, description, phone, category")
      .eq("id", id)
      .single();
    
    if (!app) {
      throw new Error("Application not found");
    }
    
    // Get current user (admin) who is rejecting
    const { data: auth } = await supabase.auth.getSession();
    const rejectedBy = auth.session?.user?.id || null;
    
    // Update the status
    const { error } = await supabase
      .from("merchant_applications")
      .update({ status })
      .eq("id", id);
    if (error) throw new Error(error.message);
    
    // If status is "rejected", add to rejected_staff table and revoke access
    if (status === "rejected" && app?.email) {
      // Insert into rejected_staff table
      const { error: insertError } = await supabase
        .from("rejected_staff")
        .insert({
          email: app.email,
          store_name: app.store_name,
          description: app.description || null,
          phone: app.phone || null,
          category: app.category || null,
          reason: reason || null,
          rejected_by: rejectedBy,
          original_application_id: id,
        });
      if (insertError) {
        console.warn("Failed to insert into rejected_staff:", insertError.message);
      }
      
      // Remove from approved_staff to prevent login
      await supabase
        .from("approved_staff")
        .delete()
        .eq("email", app.email);
      
      // Update user role to "student" if they exist (using internal endpoint)
      try {
        const res = await fetch("/api/revoke-staff-access", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: app.email }),
        }).catch(() => null);
        // Don't fail if this doesn't work, just log
        if (res && !res.ok) {
          console.warn("Failed to revoke staff access:", await res.text().catch(() => ""));
        }
      } catch (e) {
        console.warn("Error revoking staff access:", e);
      }
    }
    
    return { message: "Application updated" } as any;
  }

  if (url.match(/^\/api\/merchant_applications\/\d+$/) && method === "DELETE") {
    const supabase = getSupabase();
    const id = parseInt(url.split("/")[3]);
    const email = (data?.email as string | undefined) || undefined;
    if (email) {
      const ping = await fetch("/api/ping").catch(() => null);
      if (!ping || !ping.ok) {
        throw new Error("Admin provisioning unavailable. Configure SUPABASE_SERVICE_KEY.");
      }
        const res = await fetch("/api/delete-approved-staff", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Failed to cascade delete");
      }
    }
    const { error } = await supabase
      .from("merchant_applications")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { message: "Application deleted" } as any;
  }

  if (url.match(/^\/api\/stores\/\d+\/reviews$/) && method === "POST") {
    const supabase = getSupabase();
    const storeId = parseInt(url.split("/")[3]);
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) throw new Error("401: Unauthorized");
    const { rating, comment, imageUrls, orderId } = data || {};
    
    // Upload images if provided
    let uploadedImageUrls: string[] = [];
    if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
      for (const imageFile of imageUrls.slice(0, 3)) { // Limit to 3 images
        if (imageFile instanceof File) {
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${imageFile.name}`.replace(/\s+/g, "-");
          const filePath = `review_images/${storeId}/${userId}/${fileName}`;
          const { error: uploadErr } = await supabase.storage.from("public").upload(filePath, imageFile, {
            upsert: true,
            cacheControl: "3600",
            contentType: imageFile.type,
          });
          if (uploadErr) {
            console.error("Image upload error:", uploadErr);
            continue; // Skip failed uploads but continue with others
          }
          const { data: pub } = await supabase.storage.from("public").getPublicUrl(filePath);
          if (pub?.publicUrl) {
            uploadedImageUrls.push(pub.publicUrl);
          }
        } else if (typeof imageFile === "string") {
          // Already a URL
          uploadedImageUrls.push(imageFile);
        }
      }
    }
    
    const { error } = await supabase.from("ratings").insert({
      store_id: storeId,
      user_id: userId,
      rating: rating,
      comment: comment ?? null,
      image_urls: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
    });
    if (error) throw new Error(error.message);
    return { message: "Review created" } as any;
  }
  
  if (url.match(/^\/api\/orders\/\d+\/review$/) && method === "POST") {
    const supabase = getSupabase();
    const orderId = parseInt(url.split("/")[3]);
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) throw new Error("401: Unauthorized");
    
    // Get order to find store
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("store_id, status")
      .eq("id", orderId)
      .single();
    if (orderErr || !order) {
      throw new Error("Order not found");
    }
    if ((order as any).status !== "claimed") {
      throw new Error("You can only review orders that have been claimed");
    }
    
    // Check if user already reviewed this specific order
    const { data: existing } = await supabase
      .from("ratings")
      .select("id")
      .eq("order_id", orderId)
      .eq("user_id", userId)
      .maybeSingle();
    if (existing) {
      throw new Error("You have already reviewed this order");
    }
    
    const { rating, comment, imageUrls } = data || {};
    const storeId = (order as any).store_id;
    
    // Upload images if provided
    let uploadedImageUrls: string[] = [];
    if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
      for (const imageFile of imageUrls.slice(0, 3)) { // Limit to 3 images
        if (imageFile instanceof File) {
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${imageFile.name}`.replace(/\s+/g, "-");
          const filePath = `review_images/${storeId}/${userId}/${orderId}/${fileName}`;
          const { error: uploadErr } = await supabase.storage.from("public").upload(filePath, imageFile, {
            upsert: true,
            cacheControl: "3600",
            contentType: imageFile.type,
          });
          if (uploadErr) {
            console.error("Image upload error:", uploadErr);
            continue;
          }
          const { data: pub } = await supabase.storage.from("public").getPublicUrl(filePath);
          if (pub?.publicUrl) {
            uploadedImageUrls.push(pub.publicUrl);
          }
        } else if (typeof imageFile === "string") {
          uploadedImageUrls.push(imageFile);
        }
      }
    }
    
    const { error } = await supabase.from("ratings").insert({
      store_id: storeId,
      user_id: userId,
      order_id: orderId,
      rating: rating,
      comment: comment ?? null,
      image_urls: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
    });
    if (error) throw new Error(error.message);
    return { message: "Review created" } as any;
  }

  if (url.match(/^\/api\/reviews\/\d+\/report$/) && method === "POST") {
    const supabase = getSupabase();
    const reviewId = parseInt(url.split("/")[3]);
    const { data: auth } = await supabase.auth.getSession();
    const userId = auth.session?.user?.id;
    if (!userId) throw new Error("401: Unauthorized");
    
    const { reason } = data || {};
    
    // Check if user already reported this review
    const { data: existing } = await supabase
      .from("review_reports")
      .select("id")
      .eq("review_id", reviewId)
      .eq("reporter_id", userId)
      .maybeSingle();
    if (existing) {
      throw new Error("You have already reported this review");
    }
    
    const { error } = await supabase.from("review_reports").insert({
      review_id: reviewId,
      reporter_id: userId,
      reason: reason || null,
      status: "pending",
    });
    if (error) throw new Error(error.message);
    return { message: "Review reported" } as any;
  }

  if (url === "/api/admin/review-reports" && method === "GET") {
    const supabase = getSupabase();
    const { data: auth } = await supabase.auth.getSession();
    const userId = auth.session?.user?.id;
    if (!userId) throw new Error("401: Unauthorized");
    
    // Check if user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();
    if (!userData || userData.role !== "admin") {
      throw new Error("403: Forbidden - Admin access required");
    }
    
    // Get all reports (pending, reviewed, dismissed) - admin can see all
    const { data: reports, error } = await supabase
      .from("review_reports")
      .select("*, ratings:ratings(*, stores:stores(name))")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    
    // Get user details for reviews and reporters
    const reviewUserIds = Array.from(new Set((reports || []).map((r: any) => r.ratings?.user_id).filter(Boolean)));
    const reporterIds = Array.from(new Set((reports || []).map((r: any) => r.reporter_id).filter(Boolean)));
    const allUserIds = Array.from(new Set([...reviewUserIds, ...reporterIds]));
    
    let usersById: Record<string, any> = {};
    if (allUserIds.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, firstName, lastName, email, profileImageUrl")
        .in("id", allUserIds);
      (users || []).forEach((u: any) => {
        usersById[u.id] = u;
      });
    }
    
    const data = (reports || []).map((r: any) => ({
      ...r,
      ratings: r.ratings ? {
        ...r.ratings,
        users: usersById[r.ratings.user_id] || null,
      } : null,
      reporter: usersById[r.reporter_id] || null,
    }));
    return data as any;
  }

  if (url.match(/^\/api\/admin\/reviews\/\d+$/) && method === "DELETE") {
    const supabase = getSupabase();
    const reviewId = parseInt(url.split("/")[4]);
    const { data: auth } = await supabase.auth.getSession();
    const userId = auth.session?.user?.id;
    if (!userId) throw new Error("401: Unauthorized");
    
    // Check if user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();
    if (!userData || userData.role !== "admin") {
      throw new Error("403: Forbidden - Admin access required");
    }
    
    // Get the review first to get store_id before deleting
    const { data: reviewData, error: fetchError } = await supabase
      .from("ratings")
      .select("store_id, id")
      .eq("id", reviewId)
      .single();
    
    if (fetchError || !reviewData) {
      throw new Error(`Review not found: ${fetchError?.message || "Review does not exist"}`);
    }
    
    const storeId = reviewData.store_id;
    
    // Delete the review from ratings table
    // This will cascade delete related review_reports due to ON DELETE CASCADE
    const { data: deleteData, error: deleteError } = await supabase
      .from("ratings")
      .delete()
      .eq("id", reviewId)
      .select();
    
    if (deleteError) {
      throw new Error(`Failed to delete review: ${deleteError.message}`);
    }
    
    // Verify the deletion succeeded
    if (!deleteData || deleteData.length === 0) {
      throw new Error("Review deletion failed: No rows were deleted. The review may not exist or you may not have permission.");
    }
    
    // Update all reports for this review to "reviewed" (in case cascade didn't work or we want to keep the report record)
    // Note: With ON DELETE CASCADE, this might not be necessary, but we do it anyway for consistency
    await supabase
      .from("review_reports")
      .update({ 
        status: "reviewed",
        reviewed_at: new Date().toISOString(),
        reviewed_by: userId,
      })
      .eq("review_id", reviewId);
    
    // Return store_id as both number and string for query invalidation
    return { message: "Review deleted successfully", storeId: storeId, storeIdStr: String(storeId) } as any;
  }

  if (url.match(/^\/api\/admin\/review-reports\/\d+\/dismiss$/) && method === "POST") {
    const supabase = getSupabase();
    const reportId = parseInt(url.split("/")[4]);
    const { data: auth } = await supabase.auth.getSession();
    const userId = auth.session?.user?.id;
    if (!userId) throw new Error("401: Unauthorized");
    
    // Check if user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();
    if (!userData || userData.role !== "admin") {
      throw new Error("403: Forbidden - Admin access required");
    }
    
    const { error } = await supabase
      .from("review_reports")
      .update({ 
        status: "dismissed",
        reviewed_at: new Date().toISOString(),
        reviewed_by: userId,
      })
      .eq("id", reportId);
    if (error) throw new Error(error.message);
    return { message: "Report dismissed" } as any;
  }

  

  throw new Error(`Unsupported API request: ${method} ${url}`);
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.map(String).join("/");
    const supabase = getSupabase();

    if (url === "/api/auth/user") {
      const { data: sessionData } = await supabase.auth.getSession();
      const authUser = sessionData.session?.user || null;
      if (!authUser) return unauthorizedBehavior === "returnNull" ? (null as any) : (() => { throw new Error("401: Unauthorized"); })();
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();
      const admins = (import.meta.env.VITE_ADMIN_EMAILS as string | undefined)?.split(",").map(s => s.trim()).filter(Boolean) || [];
      if (authUser.email && admins.includes(authUser.email)) {
        if (!profile || profile.role !== "admin") {
          await supabase.from("users").upsert({ id: authUser.id, email: authUser.email, role: "admin" });
          return ({ id: authUser.id, email: authUser.email, role: "admin" } as any);
        }
      }
      // Check if user has a rejected merchant application - if so, sign them out and block access
      if (authUser.email && !admins.includes(authUser.email)) {
        const { data: rejectedApp } = await supabase
          .from("merchant_applications")
          .select("status")
          .eq("email", authUser.email)
          .eq("status", "rejected")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (rejectedApp) {
          // Sign them out immediately and throw error
          await supabase.auth.signOut();
          throw new Error("403: Your merchant application has been rejected. Access denied.");
        }
      }
      return (profile || { id: authUser.id, email: authUser.email, role: "student" }) as any;
    }

    if (url === "/api/staff/store") {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) return unauthorizedBehavior === "returnNull" ? (null as any) : (() => { throw new Error("401: Unauthorized"); })();
      const { data: store } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", userId)
        .single();
      if (!store) return null as any;
      // Transform snake_case to camelCase for consistency
      return {
        ...store,
        logoUrl: store.logo_url || store.logoUrl,
        bannerImageUrl: store.banner_image_url || store.bannerImageUrl,
        gcashQrUrl: store.gcash_qr_url || store.gcashQrUrl,
        ownerId: store.owner_id || store.ownerId,
        isActive: store.is_active !== undefined ? store.is_active : store.isActive,
        createdAt: store.created_at || store.createdAt,
        updatedAt: store.updated_at || store.updatedAt,
      } as any;
    }

    if (url === "/api/staff/meals") {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) return unauthorizedBehavior === "returnNull" ? (null as any) : (() => { throw new Error("401: Unauthorized"); })();
      const { data: store } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", userId)
        .single();
      if (!store) return [] as any;
      const { data: meals, error } = await supabase
        .from("meals")
        .select("*")
        .eq("store_id", (store as any).id);
      if (error) throw new Error(error.message);
      // Transform snake_case to camelCase for consistency
      return (meals || []).map((meal: any) => ({
        ...meal,
        storeId: meal.store_id || meal.storeId,
        imageUrl: meal.image_url || meal.imageUrl,
        isAvailable: meal.is_available !== undefined ? meal.is_available : meal.isAvailable,
        createdAt: meal.created_at || meal.createdAt,
        updatedAt: meal.updated_at || meal.updatedAt,
      })) as any;
    }

    if (url === "/api/staff/orders") {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) return unauthorizedBehavior === "returnNull" ? (null as any) : (() => { throw new Error("401: Unauthorized"); })();
      const { data: store } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", userId)
        .single();
      if (!store) return [] as any;
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("store_id", (store as any).id)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      const orderIds = (orders || []).map((o: any) => o.id);
      const { data: items } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", orderIds.length ? orderIds : [-1]);
      
      // Get meal details for each order item
      const mealIds = Array.from(new Set((items || []).map((item: any) => item.meal_id || item.mealId).filter(Boolean)));
      let mealsById: Record<number, any> = {};
      if (mealIds.length > 0) {
        const { data: meals } = await supabase
          .from("meals")
          .select("*")
          .in("id", mealIds);
        (meals || []).forEach((meal: any) => {
          mealsById[meal.id] = {
            ...meal,
            storeId: meal.store_id || meal.storeId,
            imageUrl: meal.image_url || meal.imageUrl,
            isAvailable: meal.is_available !== undefined ? meal.is_available : meal.isAvailable,
            createdAt: meal.created_at || meal.createdAt,
            updatedAt: meal.updated_at || meal.updatedAt,
          };
        });
      }
      
      const groupedItems: Record<number, any[]> = {};
      (items || []).forEach((it: any) => {
        const key = (it.order_id || it.orderId) as number;
        groupedItems[key] = groupedItems[key] || [];
        // Include meal details in each item
        groupedItems[key].push({
          ...it,
          mealId: it.meal_id || it.mealId,
          orderId: it.order_id || it.orderId,
          quantity: it.quantity,
          price: it.price,
          meal: mealsById[it.meal_id || it.mealId] || null,
        });
      });
      const studentIds = Array.from(new Set((orders || []).map((o: any) => o.student_id || o.studentId).filter(Boolean)));
      const { data: students } = await supabase
        .from("users")
        .select("*")
        .in("id", studentIds.length ? studentIds : ["-"]);
      const byId: Record<string, any> = {};
      (students || []).forEach((u: any) => { 
        byId[u.id] = {
          ...u,
          firstName: u.first_name || u.firstName,
          lastName: u.last_name || u.lastName,
          profileImageUrl: u.profile_image_url || u.profileImageUrl,
        };
      });
      const mapped = (orders || []).map((o: any) => ({
        ...o,
        studentId: o.student_id || o.studentId,
        storeId: o.store_id || o.storeId,
        totalAmount: o.total_amount || o.totalAmount,
        pickupTime: o.pickup_time || o.pickupTime,
        paymentProofUrl: o.payment_proof_url || o.paymentProofUrl,
        createdAt: o.created_at || o.createdAt,
        updatedAt: o.updated_at || o.updatedAt,
        items: groupedItems[o.id] || [],
        store: store || null,
        student: byId[o.student_id || o.studentId] || null,
      }));
      return mapped as any;
    }

    if (url.match(/^\/api\/orders\/\d+\/messages$/)) {
      const id = parseInt(url.split("/")[3]);
      const { data, error } = await supabase
        .from("messages")
        .select("*, users:users(*)")
        .eq("order_id", id)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      const mapped = (data || []).map((m: any) => ({
        ...m,
        orderId: m.order_id || m.orderId,
        senderId: m.sender_id || m.senderId,
        createdAt: m.created_at || m.createdAt,
        sender: m.users,
      }));
      return mapped as any;
    }

    if (url === "/api/orders") {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return unauthorizedBehavior === "returnNull" ? ([] as any) : (() => { throw new Error("401: Unauthorized"); })();
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("student_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      const orderIds = (orders || []).map((o: any) => o.id);
      const { data: items } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", orderIds.length ? orderIds : [-1]);
      const groupedItems: Record<number, any[]> = {};
      (items || []).forEach((it: any) => {
        const key = (it.order_id || it.orderId) as number;
        groupedItems[key] = groupedItems[key] || [];
        groupedItems[key].push(it);
      });
      const storeIds = Array.from(new Set((orders || []).map((o: any) => o.store_id || o.storeId).filter(Boolean)));
      const { data: stores } = await supabase
        .from("stores")
        .select("*")
        .in("id", storeIds.length ? storeIds : [-1]);
      const storeById: Record<number, any> = {};
      (stores || []).forEach((s: any) => { storeById[s.id] = s; });
      const mapped = (orders || []).map((o: any) => ({
        ...o,
        studentId: o.student_id || o.studentId,
        storeId: o.store_id || o.storeId,
        totalAmount: o.total_amount || o.totalAmount,
        pickupTime: o.pickup_time || o.pickupTime,
        paymentProofUrl: o.payment_proof_url || o.paymentProofUrl,
        createdAt: o.created_at || o.createdAt,
        updatedAt: o.updated_at || o.updatedAt,
        items: groupedItems[o.id] || [],
        store: storeById[o.store_id || o.storeId] || null,
        student: null,
      }));
      return mapped as any;
    }

    if (url.match(/^\/api\/orders\/\d+$/)) {
      const id = parseInt(url.split("/")[3]);
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();
      if (orderErr) throw new Error(orderErr.message);
      if (!order) throw new Error("Order not found");
      
      // Transform order to camelCase
      const orderTransformed = {
        ...order,
        studentId: (order as any).student_id || (order as any).studentId,
        storeId: (order as any).store_id || (order as any).storeId,
        totalAmount: (order as any).total_amount || (order as any).totalAmount,
        pickupTime: (order as any).pickup_time || (order as any).pickupTime,
        paymentProofUrl: (order as any).payment_proof_url || (order as any).paymentProofUrl,
        createdAt: (order as any).created_at || (order as any).createdAt,
        updatedAt: (order as any).updated_at || (order as any).updatedAt,
      };
      
      const { data: items } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", id);
      
      // Get meal details for each order item
      const mealIds = Array.from(new Set((items || []).map((item: any) => item.meal_id || item.mealId).filter(Boolean)));
      let mealsById: Record<number, any> = {};
      if (mealIds.length > 0) {
        const { data: meals } = await supabase
          .from("meals")
          .select("*")
          .in("id", mealIds);
        (meals || []).forEach((meal: any) => {
          mealsById[meal.id] = {
            ...meal,
            storeId: meal.store_id || meal.storeId,
            imageUrl: meal.image_url || meal.imageUrl,
            isAvailable: meal.is_available !== undefined ? meal.is_available : meal.isAvailable,
            createdAt: meal.created_at || meal.createdAt,
            updatedAt: meal.updated_at || meal.updatedAt,
          };
        });
      }
      
      // Transform order items to camelCase and include meal details
      const itemsTransformed = (items || []).map((item: any) => ({
        ...item,
        orderId: item.order_id || item.orderId,
        mealId: item.meal_id || item.mealId,
        meal: mealsById[item.meal_id || item.mealId] || null,
      }));
      
      const storeId = orderTransformed.storeId;
      const studentId = orderTransformed.studentId;
      
      let store = null;
      if (storeId) {
        const { data: storeData } = await supabase
          .from("stores")
          .select("*")
          .eq("id", storeId)
          .single();
        if (storeData) {
          store = {
            ...storeData,
            logoUrl: (storeData as any).logo_url || (storeData as any).logoUrl,
            bannerImageUrl: (storeData as any).banner_image_url || (storeData as any).bannerImageUrl,
            gcashQrUrl: (storeData as any).gcash_qr_url || (storeData as any).gcashQrUrl,
            ownerId: (storeData as any).owner_id || (storeData as any).ownerId,
            isActive: (storeData as any).is_active !== undefined ? (storeData as any).is_active : (storeData as any).isActive,
            createdAt: (storeData as any).created_at || (storeData as any).createdAt,
            updatedAt: (storeData as any).updated_at || (storeData as any).updatedAt,
          };
        }
      }
      
      let student = null;
      if (studentId) {
        const { data: studentData } = await supabase
          .from("users")
          .select("*")
          .eq("id", studentId)
          .single();
        student = studentData || null;
      }
      
      return ({ ...orderTransformed, items: itemsTransformed, store, student } as any);
    }

    if (url === "/api/merchant_applications") {
      const { data: apps, error } = await supabase
        .from("merchant_applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return apps as any;
    }

    if (url === "/api/stores") {
      const { data: stores, error } = await supabase.from("stores").select("*");
      if (error) throw new Error(error.message);
      const { data: ratings } = await supabase.from("ratings").select("store_id, rating");
      const grouped: Record<number, { sum: number; count: number }> = {};
      (ratings || []).forEach(r => {
        const key = (r.store_id || (r as any).storeId) as number;
        grouped[key] = grouped[key] || { sum: 0, count: 0 };
        grouped[key].sum += (r.rating as number) || 0;
        grouped[key].count += 1;
      });
      const withMetrics = (stores || []).map((s: any) => ({
        ...s,
        logoUrl: s.logo_url || s.logoUrl,
        bannerImageUrl: s.banner_image_url || s.bannerImageUrl,
        gcashQrUrl: s.gcash_qr_url || s.gcashQrUrl,
        ownerId: s.owner_id || s.ownerId,
        isActive: s.is_active !== undefined ? s.is_active : s.isActive,
        createdAt: s.created_at || s.createdAt,
        updatedAt: s.updated_at || s.updatedAt,
        averageRating: grouped[s.id]?.sum ? grouped[s.id].sum / grouped[s.id].count : 0,
        ratingCount: grouped[s.id]?.count || 0,
      }));
      return withMetrics as any;
    }

    if (url.match(/^\/api\/stores\/\d+$/)) {
      const id = parseInt(url.split("/")[3]);
      const { data: store, error } = await supabase.from("stores").select("*").eq("id", id).single();
      if (error) throw new Error(error.message);
      const { data: ratings } = await supabase.from("ratings").select("rating").eq("store_id", id);
      const sum = (ratings || []).reduce((a: number, r: any) => a + (r.rating || 0), 0);
      const count = (ratings || []).length;
      return ({
        ...store,
        logoUrl: (store as any).logo_url || (store as any).logoUrl,
        bannerImageUrl: (store as any).banner_image_url || (store as any).bannerImageUrl,
        gcashQrUrl: (store as any).gcash_qr_url || (store as any).gcashQrUrl,
        ownerId: (store as any).owner_id || (store as any).ownerId,
        isActive: (store as any).is_active !== undefined ? (store as any).is_active : (store as any).isActive,
        createdAt: (store as any).created_at || (store as any).createdAt,
        updatedAt: (store as any).updated_at || (store as any).updatedAt,
        averageRating: count ? sum / count : 0,
        ratingCount: count,
      } as any);
    }

    if (url.match(/^\/api\/stores\/\d+\/meals$/)) {
      const id = parseInt(url.split("/")[3]);
      const { data: meals, error } = await supabase.from("meals").select("*").eq("store_id", id);
      if (error) throw new Error(error.message);
      // Transform snake_case to camelCase for consistency
      return (meals || []).map((meal: any) => ({
        ...meal,
        storeId: meal.store_id || meal.storeId,
        imageUrl: meal.image_url || meal.imageUrl,
        isAvailable: meal.is_available !== undefined ? meal.is_available : meal.isAvailable,
        createdAt: meal.created_at || meal.createdAt,
        updatedAt: meal.updated_at || meal.updatedAt,
      })) as any;
    }

    if (url.match(/^\/api\/stores\/\d+\/reviews$/)) {
      const id = parseInt(url.split("/")[3]);
      const { data, error } = await supabase
        .from("ratings")
        .select("*, users:users(*)")
        .eq("store_id", id)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      const mapped = (data || []).map((r: any) => ({
        ...r,
        storeId: r.store_id || r.storeId,
        userId: r.user_id || r.userId,
        orderId: r.order_id || r.orderId,
        imageUrls: r.image_urls || r.imageUrls || [],
        createdAt: r.created_at || r.createdAt,
        user: r.users,
      }));
      return mapped as any;
    }

    if (url === "/api/admin/review-reports") {
      const { data: auth } = await supabase.auth.getSession();
      const userId = auth.session?.user?.id;
      if (!userId) return unauthorizedBehavior === "returnNull" ? ([] as any) : (() => { throw new Error("401: Unauthorized"); })();
      
      // Check if user is admin
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();
      if (!userData || userData.role !== "admin") {
        throw new Error("403: Forbidden - Admin access required");
      }
      
      // Get all reports (pending, reviewed, dismissed) - admin can see all
      const { data: reports, error } = await supabase
        .from("review_reports")
        .select("*, ratings:ratings(*, stores:stores(name))")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      
      // Get user details for reviews and reporters
      const reviewUserIds = Array.from(new Set((reports || []).map((r: any) => r.ratings?.user_id).filter(Boolean)));
      const reporterIds = Array.from(new Set((reports || []).map((r: any) => r.reporter_id).filter(Boolean)));
      const allUserIds = Array.from(new Set([...reviewUserIds, ...reporterIds]));
      
      let usersById: Record<string, any> = {};
      if (allUserIds.length > 0) {
        const { data: users } = await supabase
          .from("users")
          .select("id, firstName, lastName, email, profileImageUrl")
          .in("id", allUserIds);
        (users || []).forEach((u: any) => {
          usersById[u.id] = u;
        });
      }
      
      const data = (reports || []).map((r: any) => ({
        ...r,
        ratings: r.ratings ? {
          ...r.ratings,
          users: usersById[r.ratings.user_id] || null,
        } : null,
        reporter: usersById[r.reporter_id] || null,
      }));
      return data as any;
    }

    throw new Error(`Unsupported GET: ${url}`);
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
