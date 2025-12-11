/**
 * Shared utilities for Vercel serverless functions
 */

import { createClient } from "@supabase/supabase-js";
import type { VercelRequest } from "@vercel/node";

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  }
  
  return createClient(url, key);
}

export async function readBody(req: VercelRequest): Promise<string> {
  // Vercel automatically parses JSON bodies, so check if it's already an object
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return JSON.stringify(req.body);
  }
  
  // If it's already a string, return it
  if (typeof req.body === 'string') {
    return req.body;
  }
  
  // If it's a Buffer, convert to string
  if (Buffer.isBuffer(req.body)) {
    return req.body.toString('utf-8');
  }
  
  // Fallback: return empty string
  return '';
}

