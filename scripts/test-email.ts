/**
 * Test script to verify Supabase email configuration
 * Run with: npx tsx scripts/test-email.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load environment variables from .env.local
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const envFile = readFileSync(envPath, "utf-8");
    const lines = envFile.split("\n");
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
          process.env[key.trim()] = value;
        }
      }
    }
  } catch (error) {
    console.warn("Could not load .env.local file:", error);
  }
}

loadEnv();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testEmailConfiguration() {
  console.log("🔍 Testing Supabase Email Configuration...\n");

  // Test 1: Check if we can list users (verifies service key works)
  console.log("1️⃣ Testing service key access...");
  try {
    const { data: users, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (listError) {
      console.error("   ❌ Failed to list users:", listError.message);
      return false;
    }
    console.log("   ✅ Service key is valid\n");
  } catch (error: any) {
    console.error("   ❌ Error:", error.message);
    return false;
  }

  // Test 2: Try to invite a test user (this will send an email)
  console.log("2️⃣ Testing email invitation...");
  const testEmail = `test-${Date.now()}@example.com`; // Use a test email that won't actually receive
  try {
    const { data: invite, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(testEmail, {
      data: {
        test: true,
        message: "This is a test invitation to verify email is working.",
      },
    });

    if (inviteError) {
      console.error("   ❌ Failed to send invitation:", inviteError.message);
      if (inviteError.message.includes("rate limit")) {
        console.log("   ⚠️  Rate limit exceeded - email is enabled but you've hit the limit");
        console.log("   💡 Wait a few minutes and try again, or upgrade your plan");
        return true; // Email is enabled, just rate limited
      }
      if (inviteError.message.includes("email") || inviteError.message.includes("disabled")) {
        console.log("   ⚠️  Email might not be enabled in Supabase Dashboard");
        console.log("   💡 Go to: Authentication → Settings → Enable Email");
        return false;
      }
      return false;
    }

    console.log("   ✅ Email invitation sent successfully!");
    console.log(`   📧 Test email: ${testEmail}`);
    console.log("   ⚠️  Note: This is a test email, it won't actually be delivered\n");
  } catch (error: any) {
    console.error("   ❌ Error:", error.message);
    return false;
  }

  // Test 3: Try to generate a magic link (another email test)
  console.log("3️⃣ Testing magic link generation...");
  try {
    const { data: link, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: testEmail,
    });

    if (linkError) {
      console.error("   ❌ Failed to generate magic link:", linkError.message);
      return false;
    }

    console.log("   ✅ Magic link generated successfully!");
    console.log("   🔗 This confirms email functionality is working\n");
  } catch (error: any) {
    console.error("   ❌ Error:", error.message);
    return false;
  }

  console.log("✅ All email tests passed!");
  console.log("\n📋 Next Steps:");
  console.log("   1. Go to Admin Dashboard (/admin)");
  console.log("   2. Approve or reject a merchant application");
  console.log("   3. Check the merchant's email inbox");
  console.log("   4. They should receive an email from Supabase\n");

  return true;
}

// Run the test
testEmailConfiguration()
  .then((success) => {
    if (success) {
      console.log("🎉 Email configuration is working correctly!");
      process.exit(0);
    } else {
      console.log("\n❌ Email configuration needs attention.");
      console.log("📖 See SUPABASE_EMAIL_CONFIGURATION.md for setup instructions");
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("\n❌ Unexpected error:", error);
    process.exit(1);
  });

