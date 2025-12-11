import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { createClient } from "@supabase/supabase-js";
import { randomBytes, scryptSync } from "node:crypto";

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const getEnv = (key: string) => env[key] || process.env[key] || "";

  return {
    plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
      {
        name: "internal-routes",
        configureServer(server) {
          let warnedMissing = false;
          function getAdmin() {
            const url = getEnv("SUPABASE_URL") || getEnv("VITE_SUPABASE_URL") || "";
            const key = getEnv("SUPABASE_SERVICE_KEY") || getEnv("SUPABASE_SERVICE_ROLE_KEY") || "";
            if (!url || !key) {
              if (!warnedMissing) {
                console.warn("[internal-routes] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY; provisioning disabled");
                warnedMissing = true;
              }
              return null;
            }
            return createClient(url, key);
          }
          async function readBody(req: any) {
            return await new Promise<string>((resolve) => {
              let data = "";
              req.on("data", (c: any) => (data += c));
              req.on("end", () => resolve(data));
            });
          }
          async function sendEmail(to: string, subject: string, html: string, text?: string) {
            const apiKey = getEnv("RESEND_API_KEY");
            const from = getEnv("RESEND_FROM_EMAIL") || "no-reply@example.com";
            if (!apiKey) {
              throw new Error("Missing RESEND_API_KEY");
            }
            console.log("[Resend] Attempting to send email:", { from, to, subject });
            const resp = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "content-type": "application/json",
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                from,
                to,
                subject,
                html,
                text: text || html.replace(/<[^>]+>/g, ""),
              }),
            });
            if (!resp.ok) {
              const msg = await resp.text().catch(() => resp.statusText);
              console.error("[Resend] Email send failed:", { status: resp.status, statusText: resp.statusText, error: msg });
              throw new Error(`Resend API error (${resp.status}): ${msg}`);
            }
            const result = await resp.json().catch(() => ({}));
            console.log("[Resend] Email sent successfully:", result);
            return result;
          }
          server.middlewares.use(async (req, res, next) => {
            const supabase = getAdmin();
            if (!supabase) return next();
          if ((req.url === "/__internal/ping" || req.url === "/api/_internal/ping" || req.url === "/api/ping") && req.method === "GET") {
            try {
              // Return 200 only if admin client is configured
              res.statusCode = 200;
              res.end("ok");
              return;
            } catch {
              res.statusCode = 404;
              res.end("no-admin");
              return;
            }
          }
          if ((req.url === "/__internal/check-email-exists" || req.url === "/api/_internal/check-email-exists" || req.url === "/api/check-email-exists") && req.method === "POST") {
            try {
              const raw = await readBody(req);
              const { email } = JSON.parse(raw || "{}");
              if (!email) {
                res.statusCode = 400;
                res.end("missing email");
                return;
              }
              const normalizedEmail = String(email).toLowerCase().trim();
              
              // Check Supabase Auth - this is the source of truth
              const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
              const existingAuthUser = list.data?.users?.find((u: any) => 
                u.email && String(u.email).toLowerCase().trim() === normalizedEmail
              );
              
              // Check users table (any role)
              const { data: allUsers } = await supabase
                .from("users")
                .select("email, role");
              
              const existingUser = allUsers?.find((u: any) => 
                u.email && String(u.email).toLowerCase().trim() === normalizedEmail
              );
              
              // Check merchant_applications (pending/approved)
              const { data: existingApp } = await supabase
                .from("merchant_applications")
                .select("email, status")
                .eq("email", normalizedEmail)
                .in("status", ["pending", "approved"])
                .maybeSingle();
              
              // Check approved_staff
              const { data: existingStaff } = await supabase
                .from("approved_staff")
                .select("email")
                .eq("email", normalizedEmail)
                .maybeSingle();
              
              // Return result - match the format from api/check-email-exists.ts
              const result: { exists: boolean; type?: string; message?: string; inUsers?: boolean; userRole?: string; inAuth?: boolean; inApplications?: boolean; appStatus?: string; inApprovedStaff?: boolean } = { exists: false };
              
              // Prioritize users table check (source of truth)
              if (existingUser) {
                result.exists = true;
                result.type = "user";
                result.inUsers = true;
                result.userRole = existingUser.role || "user";
                result.message = `This email is already registered as a ${existingUser.role || "user"}.`;
              } else if (existingApp) {
                result.exists = true;
                result.type = "merchant_application";
                result.inApplications = true;
                result.appStatus = existingApp.status || null;
                result.message = existingApp.status === "approved" 
                  ? "This email already has an approved merchant application."
                  : "This email already has a pending merchant application.";
              } else if (existingStaff) {
                result.exists = true;
                result.type = "approved_staff";
                result.inApprovedStaff = true;
                result.message = "This email is already registered as staff.";
              } else if (existingAuthUser) {
                // Email in Auth but not in users table - log but don't block
                result.inAuth = true;
                // Don't set exists = true here - only block if in users table
              }
              
              res.statusCode = 200;
              res.setHeader("content-type", "application/json");
              res.end(JSON.stringify(result));
              return;
            } catch (e: any) {
              res.statusCode = 500;
              res.end(String(e?.message || e));
              return;
            }
          }
          if ((req.url === "/__internal/health" || req.url === "/api/_internal/health" || req.url === "/api/health") && req.method === "GET") {
            try {
              const tables = ["users", "stores", "merchant_applications", "approved_staff"];
              const missing: string[] = [];
              for (const t of tables) {
                const { error } = await supabase.from(t).select("id").limit(1);
                if (error) missing.push(t);
              }
              res.statusCode = 200;
              res.setHeader("content-type", "application/json");
              res.end(JSON.stringify({ ok: missing.length === 0, missing }));
              return;
            } catch (e: any) {
              res.statusCode = 500;
              res.end(String(e?.message || e));
              return;
            }
          }
          if ((req.url === "/__internal/provision-staff" || req.url === "/api/_internal/provision-staff" || req.url === "/api/provision-staff") && req.method === "POST") {
            try {
              const raw = await readBody(req);
              const { email, password } = JSON.parse(raw || "{}");
              if (!email) {
                res.statusCode = 400;
                res.end("missing email");
                return;
              }
              const passwordProvided = typeof password === "string" && password.length > 0;
              const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
              const existing = list.data?.users?.find((u: any) => u.email === email);
              let userId: string | undefined = existing?.id;
              
              // If user doesn't exist, we can't approve without a password
              // The password should have been set when they applied
              if (!existing) {
                if (!passwordProvided) {
                  throw new Error("No password available for new staff user. The applicant should have provided a password during application.");
                }
                const created = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
                if (created.error) throw new Error(created.error.message);
                userId = created.data.user?.id;
              }
              
              if (userId) {
                await supabase.from("users").upsert({ id: userId, email, role: "staff" });
                
                // The password hash should already be in approved_staff from when they applied
                // If it exists, keep it (so they can log in with their original password)
                // If it doesn't exist and password is provided, create it
                // If it doesn't exist and no password, generate a random one
                const { data: existingCred } = await supabase
                  .from("approved_staff")
                  .select("id, password_salt, password_hash")
                  .eq("email", email)
                  .maybeSingle();
                
                if (!existingCred) {
                  // No existing credentials - create new ones
                  const salt = randomBytes(16).toString("hex");
                  const passwordToHash = passwordProvided ? password : randomBytes(32).toString("hex");
                  const hash = scryptSync(passwordToHash, salt, 64).toString("hex");
                  await supabase.from("approved_staff").insert({ email, password_salt: salt, password_hash: hash });
                } else if (passwordProvided) {
                  // Update with provided password if admin wants to change it
                  const salt = randomBytes(16).toString("hex");
                  const hash = scryptSync(password, salt, 64).toString("hex");
                  await supabase
                    .from("approved_staff")
                    .update({ password_salt: salt, password_hash: hash })
                    .eq("email", email);
                }
                // If existingCred exists and no password provided, keep the existing credentials
              }
              const { data: app } = await supabase
                .from("merchant_applications")
                .select("*")
                .eq("email", email)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();
              if (app) {
                await supabase
                  .from("merchant_applications")
                  .update({ status: "approved", user_id: userId ?? app.user_id ?? null })
                  .eq("id", app.id);
                if (userId) {
                  const { data: existingStore } = await supabase
                    .from("stores")
                    .select("id")
                    .eq("owner_id", userId)
                    .limit(1)
                    .maybeSingle();
                  if (!existingStore) {
                    await supabase.from("stores").insert({ name: app.store_name, description: app.description ?? null, category: app.category ?? null, owner_id: userId });
                  }
                }
              }
              res.statusCode = 200;
              res.end("ok");
              return;
            } catch (e: any) {
              res.statusCode = 500;
              res.end(String(e?.message || e));
              return;
            }
          }
          if ((req.url === "/__internal/submit-merchant-app" || req.url === "/api/_internal/submit-merchant-app" || req.url === "/api/submit-merchant-app") && req.method === "POST") {
            try {
              const raw = await readBody(req);
              const { email, storeName, description, password } = JSON.parse(raw || "{}");
              if (!email || !storeName || !password) {
                res.statusCode = 400;
                res.end("missing email, storeName or password");
                return;
              }
              
              // Comprehensive check: Ensure email is not used anywhere
              // FIRST: Check Supabase Auth - this is the source of truth for registered emails
              const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
              const existingAuthUser = list.data?.users?.find((u: any) => u.email === email);
              
              // Check if email exists in users table (any role)
              const { data: existingUser } = await supabase
                .from("users")
                .select("email, role")
                .eq("email", email)
                .maybeSingle();
              
              // If email exists in Auth OR users table, block the application
              if (existingAuthUser || existingUser) {
                res.statusCode = 400;
                res.end("This email is already registered as a user. Please use a different email or log in with your existing account.");
                return;
              }
              
              // Check if email already has a pending or approved merchant application
              const { data: existingApp } = await supabase
                .from("merchant_applications")
                .select("email, status")
                .eq("email", email)
                .in("status", ["pending", "approved"])
                .maybeSingle();
              
              if (existingApp) {
                if (existingApp.status === "approved") {
                  res.statusCode = 400;
                  res.end("This email already has an approved merchant application. Please use a different email.");
                  return;
                } else {
                  res.statusCode = 400;
                  res.end("This email already has a pending merchant application. Please wait for approval or use a different email.");
                  return;
                }
              }
              
              // Check if email is already in approved_staff
              const { data: existingStaff } = await supabase
                .from("approved_staff")
                .select("email")
                .eq("email", email)
                .maybeSingle();
              
              if (existingStaff) {
                res.statusCode = 400;
                res.end("This email is already registered as staff. Please use a different email.");
                return;
              }
              
              // At this point, we've verified the email doesn't exist in users table or auth
              // Create new auth user
              let userId: string | undefined = existingAuthUser?.id;
              if (existingAuthUser) {
                // This shouldn't happen due to the check above, but handle it just in case
                res.statusCode = 400;
                res.end("This email is already registered. Please use a different email.");
                return;
              } else {
                const created = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
                if (created.error) {
                  // If creation fails due to email already existing, provide clear error
                  if (created.error.message?.includes("already") || created.error.message?.includes("exists")) {
                    res.statusCode = 400;
                    res.end("This email is already registered. Please use a different email or log in with your existing account.");
                    return;
                  }
                  throw new Error(created.error.message);
                }
                userId = created.data.user?.id;
              }
              if (!userId) throw new Error("no user id");
              await supabase.from("users").upsert({ id: userId, email, role: "student" });
              // Store password hash temporarily in approved_staff for later use during approval
              // This will be used when admin approves the application
              // If application is rejected, this entry will be removed
              const salt = randomBytes(16).toString("hex");
              const hash = scryptSync(String(password), salt, 64).toString("hex");
              const { data: existingCred } = await supabase
                .from("approved_staff")
                .select("id")
                .eq("email", email)
                .maybeSingle();
              if (existingCred) {
                await supabase
                  .from("approved_staff")
                  .update({ password_salt: salt, password_hash: hash })
                  .eq("email", email);
              } else {
                await supabase.from("approved_staff").insert({ email, password_salt: salt, password_hash: hash });
              }
              const payload = {
                email: String(email),
                store_name: String(storeName),
                category: null,
                description: description ? String(description) : null,
                status: "pending",
              } as any;
              const { error } = await supabase
                .from("merchant_applications")
                .insert(payload);
              if (error) throw new Error(error.message);
              res.statusCode = 200;
              res.end("ok");
              return;
            } catch (e: any) {
              res.statusCode = 500;
              res.end(String(e?.message || e));
              return;
            }
          }
          if ((req.url === "/__internal/login-approved-staff" || req.url === "/api/_internal/login-approved-staff" || req.url === "/api/login-approved-staff") && req.method === "POST") {
            try {
              const raw = await readBody(req);
              const { email, password } = JSON.parse(raw || "{}");
              if (!email || !password) {
                res.statusCode = 400;
                res.end("missing email or password");
                return;
              }
              
              // Check for rejected applications FIRST - block login if rejected
              const { data: rejectedApp } = await supabase
                .from("merchant_applications")
                .select("status")
                .eq("email", email)
                .eq("status", "rejected")
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();
              
              if (rejectedApp) {
                res.statusCode = 403;
                res.end("application rejected");
                return;
              }
              
              const { data: cred } = await supabase
                .from("approved_staff")
                .select("*")
                .eq("email", email)
                .maybeSingle();
              if (!cred) {
                res.statusCode = 404;
                res.end("not approved");
                return;
              }
              const check = scryptSync(String(password), String(cred.password_salt), 64).toString("hex");
              if (check !== cred.password_hash) {
                res.statusCode = 401;
                res.end("invalid password");
                return;
              }
              const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
              const existing = list.data?.users?.find((u: any) => u.email === email);
              let userId: string | undefined = existing?.id;
              if (existing) {
                const up = await supabase.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
                if (up.error) throw new Error(up.error.message);
              } else {
                const created = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
                if (created.error) throw new Error(created.error.message);
                userId = created.data.user?.id;
              }
              if (!userId) throw new Error("no user id");
              await supabase.from("users").upsert({ id: userId, email, role: "staff" });
              const { data: app } = await supabase
                .from("merchant_applications")
                .select("*")
                .eq("email", email)
                .eq("status", "approved")
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();
              if (app) {
                const { data: existingStore } = await supabase
                  .from("stores")
                  .select("id")
                  .eq("owner_id", userId)
                  .limit(1)
                  .maybeSingle();
                if (!existingStore) {
                  await supabase.from("stores").insert({ name: app.store_name, description: app.description ?? null, category: app.category ?? null, owner_id: userId });
                }
              }
              res.statusCode = 200;
              res.end("ok");
              return;
            } catch (e: any) {
              res.statusCode = 500;
              res.end(String(e?.message || e));
              return;
            }
          }
          if ((req.url === "/__internal/confirm-admin" || req.url === "/api/_internal/confirm-admin" || req.url === "/api/confirm-admin") && req.method === "POST") {
            try {
              const raw = await readBody(req);
              const { email, password } = JSON.parse(raw || "{}");
              if (!email || !password) {
                res.statusCode = 400;
                res.end("missing email or password");
                return;
              }
              const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
              const existing = list.data?.users?.find((u: any) => u.email === email);
              let userId: string | undefined = existing?.id;
              if (existing) {
                const up = await supabase.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
                if (up.error) throw new Error(up.error.message);
              } else {
                const created = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
                if (created.error) throw new Error(created.error.message);
                userId = created.data.user?.id;
              }
              if (!userId) throw new Error("no user id");
              await supabase.from("users").upsert({ id: userId, email, role: "admin" });
              res.statusCode = 200;
              res.end("ok");
              return;
            } catch (e: any) {
              res.statusCode = 500;
              res.end(String(e?.message || e));
              return;
            }
          }
          if ((req.url === "/__internal/send-approval-email" || req.url === "/api/_internal/send-approval-email" || req.url === "/api/send-approval-email") && req.method === "POST") {
            try {
              const raw = await readBody(req);
              const { email, storeName } = JSON.parse(raw || "{}");
              if (!email) {
                res.statusCode = 400;
                res.end("missing email");
                return;
              }
              
              console.log("[Email] Attempting to send approval email to:", email);
              
              // Check if user already exists in auth
              const { data: usersList } = await supabase.auth.admin.listUsers();
              const existingUser = usersList?.users?.find((u: any) => u.email === email);
              
              let emailSent = false;
              
              if (existingUser) {
                // User already exists - use generateLink to send a magic link email
                console.log("[Email] User already exists, generating magic link...");
                const link = await supabase.auth.admin.generateLink({ 
                  type: "magiclink", 
                  email,
                  options: {
                    data: {
                      storeName: storeName || "",
                      message: `Your merchant application${storeName ? ` for ${storeName}` : ""} has been approved! You can now log in to your merchant dashboard.`
                    }
                  }
                });
                
                if (link.error) {
                  console.error("[Email] Magic link generation failed:", link.error);
                  throw new Error(`Failed to send email: ${link.error.message}`);
                }
                
                console.log("[Email] Magic link generated successfully");
                emailSent = true;
              } else {
                // User doesn't exist - use inviteUserByEmail
                console.log("[Email] User doesn't exist, sending invitation...");
                const invited = await supabase.auth.admin.inviteUserByEmail(email, {
                  data: { 
                    storeName: storeName || "",
                    message: `Your merchant application${storeName ? ` for ${storeName}` : ""} has been approved! You can now log in to your merchant dashboard.`
                  }
                });
                
                if (invited.error) {
                  console.error("[Email] Invitation failed:", invited.error);
                  // Fallback: try generating a magic link
                  console.log("[Email] Trying magic link as fallback...");
                  const link = await supabase.auth.admin.generateLink({ 
                    type: "magiclink", 
                    email,
                    options: {
                      data: {
                        storeName: storeName || "",
                        message: `Your merchant application${storeName ? ` for ${storeName}` : ""} has been approved!`
                      }
                    }
                  });
                  
                  if (link.error) {
                    console.error("[Email] Magic link fallback also failed:", link.error);
                    throw new Error(`Failed to send email: ${invited.error.message || link.error.message}`);
                  }
                  
                  console.log("[Email] Magic link fallback succeeded");
                  emailSent = true;
                } else {
                  console.log("[Email] Invitation sent successfully");
                  emailSent = true;
                }
              }
              
              if (emailSent) {
                res.statusCode = 200;
                res.end("ok");
                return;
              } else {
                throw new Error("Email sending failed - no method succeeded");
              }
            } catch (e: any) {
              console.error("[Email] Error sending approval email:", e);
              res.statusCode = 500;
              res.end(String(e?.message || e));
              return;
            }
          }
          if ((req.url === "/__internal/revoke-staff-access" || req.url === "/api/_internal/revoke-staff-access" || req.url === "/api/revoke-staff-access") && req.method === "POST") {
            try {
              const raw = await readBody(req);
              const { email } = JSON.parse(raw || "{}");
              if (!email) {
                res.statusCode = 400;
                res.end("missing email");
                return;
              }
              // Find the user by email in auth
              const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
              const existing = list.data?.users?.find((u: any) => u.email === email);
              
              // Also check if user exists in users table (in case auth user doesn't exist)
              const { data: userInTable } = await supabase
                .from("users")
                .select("id")
                .eq("email", email)
                .maybeSingle();
              
              if (existing) {
                const userId = existing.id;
                
                // Find all stores owned by this user
                const { data: storesSnake } = await supabase
                  .from("stores")
                  .select("id")
                  .eq("owner_id", userId);
                const storeIds = (storesSnake || []).map((s: any) => s.id);
                
                // Delete all data related to each store
                for (const storeId of Array.from(new Set(storeIds))) {
                  // Get all orders for this store
                  const { data: ordersSnake } = await supabase
                    .from("orders")
                    .select("id")
                    .eq("store_id", storeId);
                  const orderIds = (ordersSnake || []).map((o: any) => o.id);
                  
                  if (orderIds.length > 0) {
                    // Delete messages for these orders
                    await supabase.from("messages").delete().in("order_id", orderIds);
                    // Delete order items for these orders
                    await supabase.from("order_items").delete().in("order_id", orderIds);
                    // Delete the orders
                    await supabase.from("orders").delete().in("id", orderIds);
                  }
                  
                  // Get all ratings for this store
                  const { data: ratings } = await supabase
                    .from("ratings")
                    .select("id")
                    .eq("store_id", storeId);
                  const ratingIds = (ratings || []).map((r: any) => r.id);
                  
                  if (ratingIds.length > 0) {
                    // Delete review reports for these ratings
                    await supabase.from("review_reports").delete().in("review_id", ratingIds);
                    // Delete the ratings
                    await supabase.from("ratings").delete().in("id", ratingIds);
                  }
                  
                  // Delete meals for this store
                  await supabase.from("meals").delete().eq("store_id", storeId);
                }
                
                // Delete all stores owned by this user
                await supabase.from("stores").delete().eq("owner_id", userId);
                
                // Delete user from users table (don't keep them as student)
                await supabase
                  .from("users")
                  .delete()
                  .eq("id", userId);
                
                // Delete the auth user to prevent login
                await supabase.auth.admin.deleteUser(userId);
              } else if (userInTable) {
                // Edge case: User exists in users table but not in auth
                // Delete from users table
                await supabase
                  .from("users")
                  .delete()
                  .eq("id", userInTable.id);
              }
              res.statusCode = 200;
              res.end("ok");
              return;
            } catch (e: any) {
              res.statusCode = 500;
              res.end(String(e?.message || e));
              return;
            }
          }
          if ((req.url === "/__internal/send-rejection-email" || req.url === "/api/_internal/send-rejection-email" || req.url === "/api/send-rejection-email") && req.method === "POST") {
            try {
              const raw = await readBody(req);
              const { email, storeName, reason } = JSON.parse(raw || "{}");
              if (!email) {
                res.statusCode = 400;
                res.end("missing email");
                return;
              }
              // Note: Supabase doesn't have a direct rejection email function
              // We'll use a magic link with rejection message in metadata
              // The user will receive an email, but they won't be able to sign in
              const link = await supabase.auth.admin.generateLink({ 
                type: "magiclink", 
                email,
                options: {
                  data: {
                    storeName: storeName || "",
                    rejected: true,
                    reason: reason || "Application not approved at this time.",
                    message: `Your merchant application${storeName ? ` for ${storeName}` : ""} has been rejected.${reason ? ` Reason: ${reason}` : ""}`
                  }
                }
              });
              if (link.error) {
                // If magic link fails, we'll just log it but not fail the rejection
                console.warn("Could not send rejection email:", link.error.message);
                res.statusCode = 200;
                res.end("ok");
                return;
              }
              res.statusCode = 200;
              res.end("ok");
              return;
            } catch (e: any) {
              // Don't fail rejection if email fails
              console.warn("Rejection email error:", e?.message || e);
              res.statusCode = 200;
              res.end("ok");
              return;
            }
          }
          if ((req.url === "/__internal/delete-approved-staff" || req.url === "/api/_internal/delete-approved-staff" || req.url === "/api/delete-approved-staff") && req.method === "POST") {
            try {
              const raw = await readBody(req);
              const { email } = JSON.parse(raw || "{}");
              if (!email) {
                res.statusCode = 400;
                res.end("missing email");
                return;
              }
              const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
              const existing = list.data?.users?.find((u: any) => u.email === email);
              const userId: string | undefined = existing?.id;
              if (userId) {
                // Get all stores owned by this user
                const { data: storesSnake } = await supabase.from("stores").select("id").eq("owner_id", userId);
                const { data: storesCamel } = await supabase.from("stores").select("id").eq("ownerId", userId);
                const storeIds = [
                  ...((storesSnake || []).map((s: any) => s.id)),
                  ...((storesCamel || []).map((s: any) => s.id)),
                ];
                
                // Delete all data related to each store
                for (const storeId of Array.from(new Set(storeIds))) {
                  // Get all orders for this store
                  const { data: ordersSnake } = await supabase.from("orders").select("id").eq("store_id", storeId);
                  const orderIds = (ordersSnake || []).map((o: any) => o.id);
                  
                  if (orderIds.length > 0) {
                    // Delete messages for these orders
                    await supabase.from("messages").delete().in("order_id", orderIds);
                    // Delete order items for these orders
                    await supabase.from("order_items").delete().in("order_id", orderIds);
                    // Delete the orders
                    await supabase.from("orders").delete().in("id", orderIds);
                  }
                  
                  // Get all ratings for this store
                  const { data: ratings } = await supabase.from("ratings").select("id").eq("store_id", storeId);
                  const ratingIds = (ratings || []).map((r: any) => r.id);
                  
                  if (ratingIds.length > 0) {
                    // Delete review reports for these ratings
                    await supabase.from("review_reports").delete().in("review_id", ratingIds);
                    // Delete the ratings
                    await supabase.from("ratings").delete().in("id", ratingIds);
                  }
                  
                  // Delete meals for this store
                  await supabase.from("meals").delete().eq("store_id", storeId);
                }
                
                // Delete all stores owned by this user
                await supabase.from("stores").delete().eq("owner_id", userId);
                
                // Delete user from users table
                await supabase.from("users").delete().eq("id", userId);
                
                // Delete auth user to prevent them from logging in again
                try {
                  await supabase.auth.admin.deleteUser(userId);
                } catch (authErr: any) {
                  console.warn("Failed to delete auth user:", authErr);
                  // Continue even if auth deletion fails
                }
              }
              
              // Delete from approved_staff table
              await supabase.from("approved_staff").delete().eq("email", email);
              
              // Delete from merchant_applications table
              await supabase.from("merchant_applications").delete().eq("email", email);
              
              res.statusCode = 200;
              res.end("ok");
              return;
            } catch (e: any) {
              res.statusCode = 500;
              res.end(String(e?.message || e));
              return;
            }
          }
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  };
});
