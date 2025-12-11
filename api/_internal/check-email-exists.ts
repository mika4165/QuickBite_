/**
 * Vercel serverless function: /api/_internal/check-email-exists
 * Checks if an email exists in the system (for registration/merchant application validation)
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin, readBody } from "./_utils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers first
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Log for debugging - this will help us see what's happening
  console.log("[check-email-exists] Method:", req.method, "URL:", req.url, "Body type:", typeof req.body);

  // Accept both POST and GET (for testing)
  const method = req.method?.toUpperCase();
  if (method !== "POST" && method !== "GET") {
    console.log("[check-email-exists] Method not allowed. Received:", method, "Expected: POST or GET");
    res.status(405).json({ error: `Method not allowed. Received: ${method || 'undefined'}, Expected: POST` });
    return;
  }

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
      res.status(400).end("missing email");
      return;
    }

    const supabase = getSupabaseAdmin();
    const normalizedEmail = String(email).toLowerCase().trim();

    const result: { exists: boolean; type?: string; message?: string } = { exists: false };

    // 1. Check Supabase Auth
    const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existingAuthUser = list.data?.users?.find((u: any) => 
      u.email && String(u.email).toLowerCase().trim() === normalizedEmail
    );
    if (existingAuthUser) {
      result.exists = true;
      result.type = "auth";
      result.message = "This email is already registered in our authentication system.";
      res.status(200).json(result);
      return;
    }

    // 2. Check users table (any role)
    const { data: existingUser } = await supabase
      .from("users")
      .select("email, role")
      .eq("email", normalizedEmail)
      .maybeSingle();
    if (existingUser) {
      result.exists = true;
      result.type = "user";
      result.message = `This email is already registered as a ${existingUser.role || "user"}.`;
      res.status(200).json(result);
      return;
    }

    // 3. Check merchant_applications (pending/approved)
    const { data: existingApp } = await supabase
      .from("merchant_applications")
      .select("email, status")
      .eq("email", normalizedEmail)
      .in("status", ["pending", "approved"])
      .maybeSingle();
    if (existingApp) {
      result.exists = true;
      result.type = "merchant_application";
      result.message = `This email already has a ${existingApp.status} merchant application.`;
      res.status(200).json(result);
      return;
    }

    // 4. Check approved_staff
    const { data: existingStaff } = await supabase
      .from("approved_staff")
      .select("email")
      .eq("email", normalizedEmail)
      .maybeSingle();
    if (existingStaff) {
      result.exists = true;
      result.type = "approved_staff";
      result.message = "This email is already registered as approved staff.";
      res.status(200).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).end(String(error?.message || error));
  }
}

