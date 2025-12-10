/**
 * Vercel serverless function: /api/__internal/provision-staff
 * Creates/updates staff user when admin approves merchant application
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin, readBody } from "./_utils";
import { randomBytes, scryptSync } from "node:crypto";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).end("Method not allowed");
    return;
  }

  try {
    const body = await readBody(req);
    const { email, password } = JSON.parse(body || "{}");
    
    if (!email) {
      res.status(400).end("missing email");
      return;
    }

    const supabase = getSupabaseAdmin();
    const passwordProvided = typeof password === "string" && password.length > 0;
    const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = list.data?.users?.find((u: any) => u.email === email);
    let userId: string | undefined = existing?.id;
    
    // If user doesn't exist, we can't approve without a password
    if (!existing) {
      if (!passwordProvided) {
        throw new Error("No password available for new staff user. The applicant should have provided a password during application.");
      }
      const created = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
      if (created.error) throw new Error(created.error.message);
      userId = created.data.user?.id;
    }
    
    if (userId) {
      await supabase.from("users").upsert({ id: userId, email, role: "staff" });
      
      // Retrieve existing password hash from approved_staff if it exists
      const { data: existingCred } = await supabase
        .from("approved_staff")
        .select("id, password_salt, password_hash")
        .eq("email", email)
        .maybeSingle();
      
      if (!existingCred) {
        // No existing credentials - create new ones
        const salt = randomBytes(16).toString("hex");
        const passwordToHash = passwordProvided ? password : randomBytes(32).toString("hex");
        const hash = scryptSync(passwordToHash, salt, 64).toString("hex");
        await supabase.from("approved_staff").insert({ email, password_salt: salt, password_hash: hash });
      } else if (passwordProvided) {
        // Update with provided password if admin wants to change it
        const salt = randomBytes(16).toString("hex");
        const hash = scryptSync(password, salt, 64).toString("hex");
        await supabase
          .from("approved_staff")
          .update({ password_salt: salt, password_hash: hash })
          .eq("email", email);
      }
      // If existingCred exists and no password provided, keep the existing credentials
    }
    
    const { data: app } = await supabase
      .from("merchant_applications")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (app) {
      await supabase
        .from("merchant_applications")
        .update({ status: "approved", user_id: userId ?? app.user_id ?? null })
        .eq("id", app.id);
      if (userId) {
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
    }
    
    res.status(200).end("ok");
  } catch (error: any) {
    res.status(500).end(String(error?.message || error));
  }
}

