import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_KEY || "";
const adminEmail = process.env.ADMIN_EMAIL || "mika@admin.com";
const adminPassword = process.env.ADMIN_PASSWORD || "mikaadmin";

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function main() {
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listErr) {
    console.error(listErr.message);
    process.exit(1);
  }
  const existing = list?.users?.find((u: any) => u.email === adminEmail);
  let userId: string | undefined;
  if (existing) {
    const { error: upErr } = await supabase.auth.admin.updateUserById(existing.id, { email_confirm: true });
    if (upErr) {
      console.error(upErr.message);
      process.exit(1);
    }
    userId = existing.id;
  } else {
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    });
    if (createErr) {
      console.error(createErr.message);
      process.exit(1);
    }
    userId = created.user?.id;
  }
  if (userId) {
    await supabase.from("users").upsert({ id: userId, email: adminEmail, role: "admin" });
  }
  console.log("Admin confirmed");
}

main();
