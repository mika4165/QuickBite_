/**
 * Vercel serverless function: /api/health
 * Checks if required database tables exist
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).end("Method not allowed");
    return;
  }

  try {
    const supabase = getSupabaseAdmin();
    const tables = ["users", "stores", "merchant_applications", "approved_staff"];
    const missing: string[] = [];
    
    for (const t of tables) {
      const { error } = await supabase.from(t).select("id").limit(1);
      if (error) missing.push(t);
    }
    
    res.status(200).json({ ok: missing.length === 0, missing });
  } catch (error: any) {
    res.status(500).end(String(error?.message || error));
  }
}

