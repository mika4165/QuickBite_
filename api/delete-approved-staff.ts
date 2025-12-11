/**
 * Vercel serverless function: /api/delete-approved-staff
 * Deletes approved staff account and all associated data
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
    const { email } = JSON.parse(body || "{}");
    
    if (!email) {
      res.status(400).end("missing email");
      return;
    }

    const supabase = getSupabaseAdmin();
    const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = list.data?.users?.find((u: any) => u.email === email);
    const userId: string | undefined = existing?.id;
    
    if (userId) {
      // Get all stores owned by this user
      const { data: storesSnake } = await supabase.from("stores").select("id").eq("owner_id", userId);
      const storeIds = (storesSnake || []).map((s: any) => s.id);
      
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
    
    res.status(200).end("ok");
  } catch (error: any) {
    res.status(500).end(String(error?.message || error));
  }
}

