/**
 * Vercel serverless function: /api/ping
 * Checks if admin client is configured
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
  if (req.method !== "GET") {
    res.status(405).end("Method not allowed");
    return;
  }

  try {
    const supabase = getSupabaseAdmin();
    // If we can create the client, admin is configured
    res.status(200).end("ok");
  } catch (error: any) {
    res.status(404).end("no-admin");
  }
}

