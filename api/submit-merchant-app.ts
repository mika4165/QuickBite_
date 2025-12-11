/**
 * Vercel serverless function: /api/submit-merchant-app
 * Handles merchant application submission with email validation
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { randomBytes, scryptSync } from "node:crypto";

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
  if (req.method !== "POST") {
    res.status(405).end("Method not allowed");
    return;
  }

  try {
    const body = await readBody(req);
    const { email, storeName, description, password } = JSON.parse(body || "{}");
    
    if (!email || !storeName || !password) {
      res.status(400).end("missing email, storeName or password");
      return;
    }

    const supabase = getSupabaseAdmin();
    
    // Comprehensive check: Ensure email is not used anywhere
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
      res.status(400).end("This email is already registered as a user. Please use a different email or log in with your existing account.");
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
        res.status(400).end("This email already has an approved merchant application. Please use a different email.");
        return;
      } else {
        res.status(400).end("This email already has a pending merchant application. Please wait for approval or use a different email.");
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
      res.status(400).end("This email is already registered as staff. Please use a different email.");
      return;
    }
    
    // Store password hash in approved_staff for later use during approval
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(String(password), salt, 64).toString("hex");
    const { data: existingCred } = await supabase
      .from("approved_staff")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    
    if (existingCred) {
      console.log("Updating existing approved_staff credentials");
      const { error: updateErr } = await supabase
        .from("approved_staff")
        .update({ password_salt: salt, password_hash: hash })
        .eq("email", email);
      if (updateErr) {
        console.error("Error updating approved_staff:", updateErr);
        throw new Error(`Failed to update staff credentials: ${updateErr.message}`);
      }
      console.log("✓ Approved staff credentials updated");
    } else {
      console.log("Inserting new approved_staff credentials");
      const { data: staffData, error: insertErr } = await supabase
        .from("approved_staff")
        .insert({ email, password_salt: salt, password_hash: hash })
        .select();
      if (insertErr) {
        console.error("Error inserting approved_staff:", insertErr);
        throw new Error(`Failed to save staff credentials: ${insertErr.message}`);
      }
      console.log("✓ Approved staff credentials saved:", staffData);
    }
    
    // Create merchant application
    const payload = {
      email: String(email),
      store_name: String(storeName),
      category: null,
      description: description ? String(description) : null,
      status: "pending",
    } as any;
    
    console.log("Inserting merchant application:", payload);
    const { data: appData, error: appError } = await supabase
      .from("merchant_applications")
      .insert(payload)
      .select();
      
    if (appError) {
      console.error("Error inserting merchant application:", appError);
      throw new Error(`Failed to save merchant application: ${appError.message}`);
    }
    
    console.log("✓ Merchant application saved:", appData);
    res.status(200).end("ok");
  } catch (error: any) {
    res.status(500).end(String(error?.message || error));
  }
}

