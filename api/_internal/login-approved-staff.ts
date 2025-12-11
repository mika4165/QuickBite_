/**
 * Vercel serverless function: /api/__internal/login-approved-staff
 * Handles staff login authentication using approved_staff credentials
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin, readBody } from "./_utils";
import { scryptSync } from "node:crypto";

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

