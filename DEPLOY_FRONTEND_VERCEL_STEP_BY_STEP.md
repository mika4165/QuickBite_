# 🚀 Step-by-Step: Deploy Frontend to Vercel

## ✅ Prerequisites

- ✅ Code is committed to GitHub
- ✅ You have a Vercel account (sign up at vercel.com)
- ✅ You have your Supabase credentials

---

## 📋 Step 1: Prepare Your Code

1. **Make sure all changes are committed:**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push
   ```

---

## 📋 Step 2: Deploy to Vercel

### 2.1: Go to Vercel Dashboard

1. Visit: https://vercel.com
2. Sign in (use GitHub for easier setup)
3. Click **"Add New..."** → **"Project"**

### 2.2: Import Your Repository

1. **Connect GitHub** (if not already connected):
   - Click "Import Git Repository"
   - Authorize Vercel to access your GitHub
   - Select your **QuickBite** repository
   - Click **"Import"**

### 2.3: Configure Project Settings

Vercel should auto-detect Vite, but verify:

- **Framework Preset:** `Vite` ✅
- **Root Directory:** `./` ✅
- **Build Command:** `npm run build` ✅
- **Output Directory:** `dist/public` ✅
- **Install Command:** `npm install` ✅

### 2.4: Add Environment Variables

**This is critical!** Click **"Environment Variables"** and add:

1. **`VITE_SUPABASE_URL`**
   - Value: Your Supabase project URL
   - Example: `https://iotluyleerimuoioattt.supabase.co`
   - Environments: ☑ Production ☑ Preview ☑ Development

2. **`VITE_SUPABASE_ANON_KEY`**
   - Value: Your Supabase anon key
   - Find it in: Supabase Dashboard → Settings → API → anon/public key
   - Environments: ☑ Production ☑ Preview ☑ Development

3. **`SUPABASE_URL`**
   - Value: Same as `VITE_SUPABASE_URL`
   - Environments: ☑ Production ☑ Preview ☑ Development

4. **`SUPABASE_SERVICE_KEY`**
   - Value: Your Supabase service role key
   - Find it in: Supabase Dashboard → Settings → API → service_role key
   - ⚠️ **Keep this secret!** Never expose it in frontend code
   - Environments: ☑ Production ☑ Preview ☑ Development

5. **`VITE_ADMIN_EMAILS`**
   - Value: Your admin email(s), comma-separated
   - Example: `admin@example.com,manager@example.com`
   - Environments: ☑ Production ☑ Preview ☑ Development

6. **Click "Save"** after adding each variable

### 2.5: Deploy!

1. Click **"Deploy"** button
2. Wait 2-5 minutes for build to complete
3. You'll get a URL like: `https://your-app.vercel.app`

---

## 📋 Step 3: Configure Supabase

### 3.1: Apply RLS Policies

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project
   - Go to **SQL Editor**

2. **Run the Migration:**
   - Click **"New Query"**
   - Copy contents from: `supabase/migrations/20251209000007_add_users_and_merchant_apps_rls.sql`
   - Paste into SQL Editor
   - Click **"Run"** (or press Ctrl+Enter)

### 3.2: Configure Authentication URLs

1. **Go to:** Authentication → URL Configuration
2. **Set Site URL:**
   - Value: `https://your-app.vercel.app` (your Vercel URL)
3. **Add Redirect URLs:**
   - Click **"Add URL"**
   - Add: `https://your-app.vercel.app/**`
   - Click **"Save"**

### 3.3: Enable Email

1. **Go to:** Authentication → Settings
2. **Enable:**
   - ☑ **"Enable Email Signup"** - ON
   - ☑ **"Enable Email Invitations"** - ON
3. **Click "Save"**

---

## 📋 Step 4: Verify Deployment

### 4.1: Check Functions Are Deployed

1. **Go to Vercel Dashboard:**
   - Your Project → Deployments → Latest Deployment
   - Look for **"Functions"** tab/section
   - You should see all 12 functions listed

### 4.2: Test Your Application

1. **Visit your Vercel URL:**
   - `https://your-app.vercel.app`

2. **Test Features:**
   - ✅ User registration
   - ✅ User login
   - ✅ Merchant application
   - ✅ Staff login
   - ✅ Admin dashboard

3. **Check Logs:**
   - Go to: Vercel Dashboard → Logs
   - You should see logs from functions when they're called

---

## ✅ You're Done!

Your frontend and backend are now deployed to Vercel and connected to Supabase!

---

## 🔧 Troubleshooting

### Functions Not Showing Up?

1. **Wait for deployment to complete** (check build logs)
2. **Verify functions are at `api/` root** (not in subdirectories)
3. **Check build logs** for TypeScript errors

### Data Not Saving?

1. **Apply RLS policies** in Supabase (Step 3.1)
2. **Check environment variables** are set correctly
3. **Check Vercel logs** for error messages

### 404 Errors?

1. **Wait for deployment to complete**
2. **Check Functions tab** in deployment details
3. **Verify function names** match frontend calls

