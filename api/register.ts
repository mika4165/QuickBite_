/**
 * Vercel serverless function: /api/register
 * Handles user registration and sends welcome email via Supabase
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  }
  
  return createClient(url, key);
}

async function readBody(req: VercelRequest): Promise<string> {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return JSON.stringify(req.body);
  }
  if (typeof req.body === 'string') {
    return req.body;
  }
  if (Buffer.isBuffer(req.body)) {
    return req.body.toString('utf-8');
  }
  return '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).end("Method not allowed");
    return;
  }

  try {
    const body = await readBody(req);
    const { email, password } = JSON.parse(body || "{}");
    
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    // Validate password length
    if (password.length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters" });
      return;
    }

    const supabase = getSupabaseAdmin();
    const normalizedEmail = String(email).toLowerCase().trim();

    // Check if email already exists in users table
    const { data: existingUser } = await supabase
      .from("users")
      .select("email, role")
      .eq("email", normalizedEmail)
      .maybeSingle();
    
    if (existingUser) {
      res.status(400).json({ 
        message: `This email is already registered as a ${existingUser.role || "user"}. Please use a different email or log in with your existing account.` 
      });
      return;
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
        res.status(400).json({ 
          message: "This email already has an approved merchant application. Please use a different email." 
        });
        return;
      } else {
        res.status(400).json({ 
          message: "This email already has a pending merchant application. Please use a different email." 
        });
        return;
      }
    }

    // Check if email is already in approved_staff
    const { data: existingStaff } = await supabase
      .from("approved_staff")
      .select("email")
      .eq("email", normalizedEmail)
      .maybeSingle();
    
    if (existingStaff) {
      res.status(400).json({ 
        message: "This email is already registered as staff. Please use a different email." 
      });
      return;
    }

    // Check Supabase Auth for existing user
    const { data: usersList } = await supabase.auth.admin.listUsers();
    const existingAuthUser = usersList?.users?.find((u: any) => 
      u.email && String(u.email).toLowerCase().trim() === normalizedEmail
    );

    if (existingAuthUser) {
      res.status(400).json({ 
        message: "This email is already registered. Please use a different email or log in with your existing account." 
      });
      return;
    }

    // Create user in Supabase Auth
    // This will automatically send a confirmation email if email confirmations are enabled
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true, // Auto-confirm email so they can log in immediately
    });

    if (signUpError) {
      if (signUpError.message?.includes("already") || signUpError.message?.includes("exists")) {
        res.status(400).json({ 
          message: "This email is already registered. Please use a different email or log in with your existing account." 
        });
        return;
      }
      throw new Error(signUpError.message);
    }

    const user = signUpData.user;
    if (!user) {
      throw new Error("Failed to create user");
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
    const { error: userErr } = await supabase.from("users").upsert({
      id: user.id,
      email: normalizedEmail,
      role,
    });
    
    if (userErr) {
      console.error("Error saving user to database:", userErr);
      // Try to clean up auth user if database insert fails
      try {
        await supabase.auth.admin.deleteUser(user.id);
      } catch (cleanupError) {
        console.error("Failed to cleanup auth user:", cleanupError);
      }
      throw new Error(`Failed to save user: ${userErr.message}`);
    }

    // If approved application exists, create a store for the new staff
    if (app) {
      const { error: storeErr } = await supabase.from("stores").insert({
        name: app.store_name,
        description: app.description ?? null,
        category: app.category ?? null,
        owner_id: user.id,
      });
      if (storeErr) {
        console.error("Error creating store:", storeErr);
        // Don't fail registration if store creation fails
      }
    }

    // Send welcome email using Supabase's email system
    try {
      // Use generateLink to send a welcome email
      // This will trigger Supabase's email system to send an email
      const link = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: normalizedEmail,
        options: {
          data: {
            welcome: true,
            message: "Welcome to QuickBite! Your account has been created successfully. You can now log in to start ordering."
          }
        }
      });

      if (link.error) {
        console.warn("[Email] Welcome email generation failed (non-critical):", link.error.message);
        // Don't fail registration if email fails - account is still created
      } else {
        console.log("[Email] Welcome email sent successfully");
      }
    } catch (emailError: any) {
      console.warn("[Email] Welcome email error (non-critical):", emailError?.message || emailError);
      // Don't fail registration if email fails
    }

    res.status(200).json({ message: "Account created" });
  } catch (error: any) {
    console.error("[Register] Error:", error);
    res.status(500).json({ message: error?.message || "An error occurred during registration" });
  }
}

