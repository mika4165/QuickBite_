/**
 * Vercel serverless function: /api/__internal/ping
 * Checks if admin client is configured
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
    // If we can create the client, admin is configured
    res.status(200).end("ok");
  } catch (error: any) {
    res.status(404).end("no-admin");
  }
}

