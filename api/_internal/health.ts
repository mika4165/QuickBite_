/**
 * Vercel serverless function: /api/__internal/health
 * Checks if required database tables exist
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin } from "./_utils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

