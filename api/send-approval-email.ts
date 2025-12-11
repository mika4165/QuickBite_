/**
 * Vercel serverless function: /api/send-approval-email
 * Sends approval email to merchant when admin approves their application
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
    const { email, storeName } = JSON.parse(body || "{}");
    
    if (!email) {
      res.status(400).end("missing email");
      return;
    }

    const supabase = getSupabaseAdmin();
    console.log("[Email] Attempting to send approval email to:", email);
    
    // Check if user already exists in auth
    const { data: usersList } = await supabase.auth.admin.listUsers();
    const existingUser = usersList?.users?.find((u: any) => u.email === email);
    
    let emailSent = false;
    
    if (existingUser) {
      // User already exists - use generateLink to send a magic link email
      console.log("[Email] User already exists, generating magic link...");
      const link = await supabase.auth.admin.generateLink({ 
        type: "magiclink", 
        email,
        options: {
          data: {
            storeName: storeName || "",
            message: `Your merchant application${storeName ? ` for ${storeName}` : ""} has been approved! You can now log in to your merchant dashboard.`
          }
        }
      });
      
      if (link.error) {
        console.error("[Email] Magic link generation failed:", link.error);
        throw new Error(`Failed to send email: ${link.error.message}`);
      }
      
      console.log("[Email] Magic link generated successfully");
      emailSent = true;
    } else {
      // User doesn't exist - use inviteUserByEmail
      console.log("[Email] User doesn't exist, sending invitation...");
      const invited = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { 
          storeName: storeName || "",
          message: `Your merchant application${storeName ? ` for ${storeName}` : ""} has been approved! You can now log in to your merchant dashboard.`
        }
      });
      
      if (invited.error) {
        console.error("[Email] Invitation failed:", invited.error);
        // Fallback: try generating a magic link
        console.log("[Email] Trying magic link as fallback...");
        const link = await supabase.auth.admin.generateLink({ 
          type: "magiclink", 
          email,
          options: {
            data: {
              storeName: storeName || "",
              message: `Your merchant application${storeName ? ` for ${storeName}` : ""} has been approved!`
            }
          }
        });
        
        if (link.error) {
          console.error("[Email] Magic link fallback also failed:", link.error);
          throw new Error(`Failed to send email: ${invited.error.message || link.error.message}`);
        }
        
        console.log("[Email] Magic link fallback succeeded");
        emailSent = true;
      } else {
        console.log("[Email] Invitation sent successfully");
        emailSent = true;
      }
    }
    
    if (emailSent) {
      res.status(200).end("ok");
    } else {
      throw new Error("Email sending failed - no method succeeded");
    }
  } catch (error: any) {
    console.error("[Email] Error sending approval email:", error);
    res.status(500).end(String(error?.message || error));
  }
}

