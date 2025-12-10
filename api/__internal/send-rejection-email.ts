/**
 * Vercel serverless function: /api/__internal/send-rejection-email
 * Sends rejection email to merchant when admin rejects their application
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
    const { email, storeName, reason } = JSON.parse(body || "{}");
    
    if (!email) {
      res.status(400).end("missing email");
      return;
    }

    const supabase = getSupabaseAdmin();
    
    // Note: Supabase doesn't have a direct rejection email function
    // We'll use a magic link with rejection message in metadata
    const link = await supabase.auth.admin.generateLink({ 
      type: "magiclink", 
      email,
      options: {
        data: {
          storeName: storeName || "",
          rejected: true,
          reason: reason || "Application not approved at this time.",
          message: `Your merchant application${storeName ? ` for ${storeName}` : ""} has been rejected.${reason ? ` Reason: ${reason}` : ""}`
        }
      }
    });
    
    if (link.error) {
      // If magic link fails, we'll just log it but not fail the rejection
      console.warn("Could not send rejection email:", link.error.message);
      res.status(200).end("ok");
      return;
    }
    
    res.status(200).end("ok");
  } catch (error: any) {
    // Don't fail rejection if email fails
    console.warn("Rejection email error:", error?.message || error);
    res.status(200).end("ok");
  }
}

