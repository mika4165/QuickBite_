/**
 * Vercel serverless function: /api/__internal/confirm-admin
 * Creates/updates admin user for admin login
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
    const { email, password } = JSON.parse(body || "{}");
    
    if (!email || !password) {
      res.status(400).end("missing email or password");
      return;
    }

    const supabase = getSupabaseAdmin();
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
    await supabase.from("users").upsert({ id: userId, email, role: "admin" });
    
    res.status(200).end("ok");
  } catch (error: any) {
    res.status(500).end(String(error?.message || error));
  }
}

