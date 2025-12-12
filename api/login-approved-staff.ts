/**
 * Vercel serverless function: /api/login-approved-staff
 * Handles staff login authentication using approved_staff credentials
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { scryptSync } from "node:crypto";

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
      res.status(400).end("missing email or password");
      return;
    }

    const supabase = getSupabaseAdmin();
    
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
      res.status(403).end("application rejected");
      return;
    }
    
    // Check if application is approved - block login if pending or rejected
    const { data: app } = await supabase
      .from("merchant_applications")
      .select("status")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (app) {
      if (app.status === "rejected") {
        res.status(403).end("application rejected");
        return;
      }
      if (app.status === "pending") {
        res.status(403).end("application pending approval");
        return;
      }
      // Only allow login if status is "approved"
      if (app.status !== "approved") {
        res.status(403).end("application not approved");
        return;
      }
    } else {
      // No application found - check if they're in approved_staff (legacy or manually added)
      // But still require approval
      res.status(403).end("no approved application found");
      return;
    }
    
    const { data: cred } = await supabase
      .from("approved_staff")
      .select("*")
      .eq("email", email)
      .maybeSingle();
      
    if (!cred) {
      res.status(404).end("not approved");
      return;
    }
    
    const check = scryptSync(String(password), String(cred.password_salt), 64).toString("hex");
    if (check !== cred.password_hash) {
      res.status(401).end("invalid password");
      return;
    }
    
    // Create or update auth user
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
    
    // Create store if approved application exists
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
        await supabase.from("stores").insert({ 
          name: app.store_name, 
          description: app.description ?? null, 
          category: app.category ?? null, 
          owner_id: userId 
        });
      }
    }
    
    res.status(200).end("ok");
  } catch (error: any) {
    res.status(500).end(String(error?.message || error));
  }
}

