/**
 * Vercel serverless function: /api/__internal/check-email-exists
 * Checks if an email exists in the system (for registration/merchant application validation)
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin, readBody } from "./_utils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

