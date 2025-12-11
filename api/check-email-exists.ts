/**
 * Vercel serverless function: /api/check-email-exists
 * Checks if an email exists in the system (for registration/merchant application validation)
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  
  console.log("=== Supabase Connection Check ===");
  console.log("SUPABASE_URL present:", !!process.env.SUPABASE_URL);
  console.log("VITE_SUPABASE_URL present:", !!process.env.VITE_SUPABASE_URL);
  console.log("SUPABASE_SERVICE_KEY present:", !!process.env.SUPABASE_SERVICE_KEY);
  console.log("SUPABASE_SERVICE_ROLE_KEY present:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log("Using URL:", url ? `${url.substring(0, 30)}...` : "NOT FOUND");
  console.log("Using Key:", key ? `${key.substring(0, 20)}...` : "NOT FOUND");
  
  if (!url || !key) {
    const missing = [];
    if (!url) missing.push("SUPABASE_URL or VITE_SUPABASE_URL");
    if (!key) missing.push("SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY");
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
  
  try {
    const client = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    console.log("✓ Supabase client created successfully");
    return client;
  } catch (error: any) {
    console.error("✗ Failed to create Supabase client:", error.message);
    throw new Error(`Failed to connect to Supabase: ${error.message}`);
  }
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
  // CRITICAL: Log immediately to confirm function is called
  console.log("=== check-email-exists FUNCTION EXECUTING ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  
  // Set CORS headers first
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    console.log("OPTIONS request - returning 200");
    res.status(200).end();
    return;
  }

  // Accept both POST and GET (for testing)
  const method = (req.method || "").toUpperCase();
  console.log("Normalized method:", method);
  
  if (method !== "POST" && method !== "GET") {
    console.log("Method not allowed:", method);
    res.status(405).json({ error: `Method not allowed. Received: ${method || 'undefined'}, Expected: POST` });
    return;
  }
  
  console.log("Method accepted:", method);

  try {
    // Handle both POST and GET requests
    let email: string | undefined;
    
    if (method === "POST") {
      const body = await readBody(req);
      const parsed = JSON.parse(body || "{}");
      email = parsed.email;
    } else if (method === "GET") {
      email = req.query.email as string;
    }
    
    if (!email) {
      console.log("Missing email parameter");
      res.status(400).end("missing email");
      return;
    }

    console.log("Checking email:", email);
    
    // Initialize Supabase connection
    console.log("Initializing Supabase connection...");
    const supabase = getSupabaseAdmin();
    console.log("✓ Supabase connection established");
    
    const normalizedEmail = String(email).toLowerCase().trim();

    const result: { exists: boolean; type?: string; message?: string; inUsers?: boolean; userRole?: string; inAuth?: boolean } = { exists: false };

    // 1. Check users table FIRST (this is the source of truth)
    // Only block if email exists in users table, not just in Auth
    console.log("Checking users table (source of truth)...");
    const { data: existingUser, error: usersError } = await supabase
      .from("users")
      .select("email, role")
      .eq("email", normalizedEmail)
      .maybeSingle();
    
    if (usersError) {
      console.error("Error querying users table:", usersError.message);
      throw new Error(`Database error: ${usersError.message}`);
    }
    
    if (existingUser) {
      console.log("Email found in users table - BLOCKING registration");
      result.exists = true;
      result.type = "user";
      result.inUsers = true;
      result.userRole = existingUser.role || "user";
      result.message = `This email is already registered as a ${existingUser.role || "user"}.`;
      res.status(200).json(result);
      return;
    }
    console.log("✓ Email not found in users table - allowing registration");

    // 2. Check Supabase Auth (for informational purposes, but don't block based on this alone)
    // An email might exist in Auth from a failed/incomplete registration
    console.log("Checking Supabase Auth (informational only)...");
    try {
      const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (list.error) {
        console.warn("Warning: Could not query Supabase Auth:", list.error.message);
        // Don't throw error, just log warning - we already checked users table
      } else {
        console.log(`✓ Auth query successful, checked ${list.data?.users?.length || 0} users`);
        
        const existingAuthUser = list.data?.users?.find((u: any) => 
          u.email && String(u.email).toLowerCase().trim() === normalizedEmail
        );
        if (existingAuthUser) {
          console.log("⚠ Email found in Auth but NOT in users table - allowing registration (incomplete registration)");
          result.inAuth = true;
          // Don't set exists = true here - we only block if in users table
        } else {
          console.log("✓ Email not found in Auth");
        }
      }
    } catch (authError: any) {
      console.warn("Warning: Auth check failed (non-blocking):", authError.message);
      // Don't throw error - we already checked users table which is the source of truth
    }

    // 3. Check merchant_applications (pending/approved)
    console.log("Checking merchant_applications...");
    const { data: existingApp, error: appError } = await supabase
      .from("merchant_applications")
      .select("email, status")
      .eq("email", normalizedEmail)
      .in("status", ["pending", "approved"])
      .maybeSingle();
    
    if (appError) {
      console.error("Error querying merchant_applications:", appError.message);
      throw new Error(`Database error: ${appError.message}`);
    }
    
    if (existingApp) {
      console.log("Email found in merchant_applications - BLOCKING registration");
      result.exists = true;
      result.type = "merchant_application";
      result.message = `This email already has a ${existingApp.status} merchant application.`;
      res.status(200).json(result);
      return;
    }
    console.log("✓ Email not found in merchant_applications");

    // 4. Check approved_staff
    console.log("Checking approved_staff...");
    const { data: existingStaff, error: staffError } = await supabase
      .from("approved_staff")
      .select("email")
      .eq("email", normalizedEmail)
      .maybeSingle();
    
    if (staffError) {
      console.error("Error querying approved_staff:", staffError.message);
      throw new Error(`Database error: ${staffError.message}`);
    }
    
    if (existingStaff) {
      console.log("Email found in approved_staff - BLOCKING registration");
      result.exists = true;
      result.type = "approved_staff";
      result.message = "This email is already registered as approved staff.";
      res.status(200).json(result);
      return;
    }
    console.log("✓ Email not found in approved_staff");

    console.log("✓ Email not found anywhere - available for registration");
    res.status(200).json(result);
  } catch (error: any) {
    console.error("Error in check-email-exists:", error);
    res.status(500).json({ error: String(error?.message || error) });
  }
}

