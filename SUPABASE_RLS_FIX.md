# 🔧 Fix: Data Not Saving to Supabase

If data isn't saving to Supabase, it's likely due to **Row Level Security (RLS) policies**. Here's how to fix it:

## ✅ Check RLS Policies in Supabase

### 1. Go to Supabase Dashboard
- Visit: https://supabase.com/dashboard
- Select your project
- Go to **Authentication** → **Policies**

### 2. Check `users` Table Policies

The `users` table needs policies that allow:
- **INSERT**: Users should be able to insert their own record
- **SELECT**: Users should be able to read their own record
- **UPDATE**: Users should be able to update their own record

#### Create/Update Policy for `users` table:

1. Go to **Table Editor** → `users` table
2. Click **"Policies"** tab
3. Click **"New Policy"**

**Policy Name:** `Users can insert their own record`
**Allowed Operation:** `INSERT`
**Policy Definition:**
```sql
auth.uid() = id
```

**Policy Name:** `Users can read their own record`
**Allowed Operation:** `SELECT`
**Policy Definition:**
```sql
auth.uid() = id
```

**Policy Name:** `Users can update their own record`
**Allowed Operation:** `UPDATE`
**Policy Definition:**
```sql
auth.uid() = id
```

**Policy Name:** `Service role can do everything` (for serverless functions)
**Allowed Operation:** `ALL`
**Policy Definition:**
```sql
true
```
**Note:** This policy uses the service role key (which bypasses RLS), so it's safe.

### 3. Check `merchant_applications` Table Policies

**Policy Name:** `Anyone can insert merchant applications`
**Allowed Operation:** `INSERT`
**Policy Definition:**
```sql
true
```

**Policy Name:** `Service role can do everything`
**Allowed Operation:** `ALL`
**Policy Definition:**
```sql
true
```

### 4. Check `approved_staff` Table Policies

**Policy Name:** `Service role can do everything`
**Allowed Operation:** `ALL`
**Policy Definition:**
```sql
true
```

## 🔍 Verify Environment Variables

Make sure these are set in **Vercel Dashboard** → **Settings** → **Environment Variables**:

- ✅ `SUPABASE_URL` or `VITE_SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `VITE_SUPABASE_ANON_KEY`

## 🧪 Test After Fix

1. **Try registering a new user**
2. **Check Vercel Logs** for any errors
3. **Check Supabase Dashboard** → **Table Editor** → `users` table to see if data appears

## 📝 Important Notes

- **Serverless functions** use the **service key** which bypasses RLS
- **Frontend code** uses the **anon key** which is subject to RLS policies
- Make sure RLS policies allow the operations you need

## 🚨 Common Issues

1. **RLS is enabled but no policies exist** → Data won't save
2. **Policies are too restrictive** → Check policy definitions
3. **Wrong environment variables** → Verify keys are correct
4. **Service key not set** → Serverless functions won't work

