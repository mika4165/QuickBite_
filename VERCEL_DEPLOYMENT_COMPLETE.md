# 🚀 Complete Vercel Deployment Guide - QuickBite

## Step-by-Step: Deploy Your Complete QuickBite System to Vercel

This guide will walk you through deploying your entire QuickBite application to Vercel, including all features working correctly.

---

## 📋 Prerequisites Checklist

Before starting, make sure you have:

- [ ] **Vercel Account** - Sign up at [vercel.com](https://vercel.com) (free)
- [ ] **GitHub Account** - Your code needs to be in a Git repository
- [ ] **Supabase Project** - Already set up and running
- [ ] **All Environment Variables** - Ready to copy (see Step 2)

---

## Step 1: Prepare Your Code for Deployment

### 1.1: Make Sure Code is Committed

```bash
# Check if you have uncommitted changes
git status

# If you have changes, commit them
git add .
git commit -m "Prepare for Vercel deployment"
```

### 1.2: Push to GitHub (if not already done)

```bash
# If you haven't pushed to GitHub yet:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

**Or if already connected:**
```bash
git push
```

---

## Step 2: Gather All Environment Variables

Before deploying, collect all your environment variables from `.env.local`:

### Required Environment Variables:

1. **`VITE_SUPABASE_URL`**
   - Get from: Supabase Dashboard → Settings → API → Project URL
   - Example: `https://iotluyleerimuoioattt.supabase.co`

2. **`VITE_SUPABASE_ANON_KEY`**
   - Get from: Supabase Dashboard → Settings → API → anon/public key
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. **`SUPABASE_SERVICE_KEY`**
   - Get from: Supabase Dashboard → Settings → API → service_role key
   - ⚠️ **Keep this secret!** Never expose in frontend code
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

4. **`VITE_ADMIN_EMAILS`**
   - Your admin email addresses (comma-separated)
   - Example: `admin@example.com,manager@example.com`

### Optional (for custom email):
5. **`RESEND_API_KEY`** (if using Resend - but we're using Supabase email)
6. **`RESEND_FROM_EMAIL`** (if using Resend)

**Note:** We're using Supabase's built-in email, so Resend variables are optional.

---

## Step 3: Create Vercel Serverless Functions for Internal Routes

⚠️ **IMPORTANT:** Your internal routes (`/__internal/*`) in `vite.config.ts` won't work on Vercel. We need to convert them to serverless functions.

### 3.1: Create API Directory Structure

Create these directories:
```
api/
  __internal/
    provision-staff.ts
    send-approval-email.ts
    send-rejection-email.ts
    check-email-exists.ts
    login-approved-staff.ts
    delete-approved-staff.ts
    revoke-staff-access.ts
    submit-merchant-app.ts
    ping.ts
    health.ts
```

### 3.2: I'll Create the Serverless Functions

Let me create the necessary serverless functions for you...

---

## Step 4: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended for First Time)

#### 4.1: Go to Vercel Dashboard
1. Visit: [vercel.com](https://vercel.com)
2. Sign in or create an account (use GitHub to sign in for easier setup)
3. Click **"Add New..."** → **"Project"**

#### 4.2: Import Your Repository
1. **Connect GitHub** (if not already connected):
   - Click "Import Git Repository"
   - Authorize Vercel to access your GitHub
   - Select your QuickBite repository
   - Click **"Import"**

#### 4.3: Configure Project Settings
Vercel should auto-detect Vite, but verify:

- **Framework Preset:** `Vite` ✅
- **Root Directory:** `./` (leave as default)
- **Build Command:** `npm run build` ✅
- **Output Directory:** `dist` ✅
- **Install Command:** `npm install` ✅

#### 4.4: Add Environment Variables
**This is critical!** Add all environment variables:

1. Click **"Environment Variables"** section
2. Add each variable one by one:

   **Variable 1:**
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://iotluyleerimuoioattt.supabase.co` (your URL)
   - Environment: Select **Production**, **Preview**, and **Development** ✅
   - Click **"Add"**

   **Variable 2:**
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your anon key)
   - Environment: Select **Production**, **Preview**, and **Development** ✅
   - Click **"Add"**

   **Variable 3:**
   - Name: `SUPABASE_SERVICE_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your service key)
   - Environment: Select **Production**, **Preview**, and **Development** ✅
   - Click **"Add"**

   **Variable 4:**
   - Name: `VITE_ADMIN_EMAILS`
   - Value: `mika@admin.com` (your admin email(s))
   - Environment: Select **Production**, **Preview**, and **Development** ✅
   - Click **"Add"**

3. **Important:** Make sure each variable is added for **all three environments** (Production, Preview, Development)

#### 4.5: Deploy!
1. Click **"Deploy"** button
2. Wait for build to complete (usually 2-5 minutes)
3. Watch the build logs for any errors
4. Once complete, you'll get a URL like: `your-app.vercel.app`

---

## Step 5: Configure Supabase for Production

### 5.1: Update Supabase URL Configuration

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/iotluyleerimuoioattt
   - Click **"Authentication"** → **"URL Configuration"**

2. **Update Site URL:**
   - **Site URL:** `https://your-app.vercel.app` (your Vercel URL)
   - Click **"Save"**

3. **Add Redirect URLs:**
   - In **"Redirect URLs"** section, add:
     - `https://your-app.vercel.app/**`
     - `https://your-app.vercel.app/*`
   - Click **"Save"**

### 5.2: Enable Email in Supabase (If Not Already Done)

1. Go to: **Authentication** → **Settings**
2. Enable:
   - ✅ **"Enable Email Signup"** - ON
   - ✅ **"Enable Email Invitations"** - ON
3. Click **"Save"**

---

## Step 6: Test Your Deployment

### 6.1: Test Basic Functionality

1. **Visit your Vercel URL:** `https://your-app.vercel.app`
2. **Test User Registration:**
   - Go to `/register`
   - Create a test account
   - Verify it works

3. **Test Login:**
   - Go to `/login`
   - Log in with your test account
   - Verify it works

4. **Test Merchant Application:**
   - Go to merchant application page
   - Submit a test application
   - Verify it's saved

### 6.2: Test Admin Features

1. **Log in as Admin:**
   - Use an email from `VITE_ADMIN_EMAILS`
   - Go to `/admin`
   - Verify admin dashboard loads

2. **Test Approval/Rejection:**
   - Approve a merchant application
   - Check if email is sent (check Supabase logs)
   - Verify merchant can log in

### 6.3: Test Staff Features

1. **Log in as Staff:**
   - Use an approved merchant email
   - Go to `/staff`
   - Verify staff dashboard loads

---

## Step 7: Handle Internal Routes (Critical!)

⚠️ **Your internal routes won't work on Vercel without serverless functions!**

The internal routes in `vite.config.ts` (like `/__internal/provision-staff`) only work in development. For production, we need Vercel serverless functions.

### Option A: Create Serverless Functions (Recommended)

I'll create the serverless functions for you. This requires creating API routes in the `api/` directory.

### Option B: Use Supabase Edge Functions (Alternative)

Move the admin operations to Supabase Edge Functions.

### Option C: Temporary Workaround

For now, admin operations (approve/reject) might not work fully. You can:
- Use Supabase Dashboard to manually approve applications
- Or set up the serverless functions (see below)

---

## Step 8: Create Serverless Functions (If Needed)

If you want admin features to work on Vercel, I can help you create the serverless functions. Let me know and I'll create them!

---

## Step 9: Custom Domain (Optional)

### 9.1: Add Custom Domain in Vercel

1. Go to your project in Vercel Dashboard
2. Click **"Settings"** → **"Domains"**
3. Click **"Add Domain"**
4. Enter your domain (e.g., `quickbite.com`)
5. Follow DNS configuration instructions

### 9.2: Update Supabase

1. Update **Site URL** in Supabase to your custom domain
2. Update **Redirect URLs** to include your custom domain

---

## Step 10: Post-Deployment Checklist

After deployment, verify:

- [ ] ✅ Application loads at Vercel URL
- [ ] ✅ User registration works
- [ ] ✅ User login works
- [ ] ✅ Merchant application submission works
- [ ] ✅ Admin dashboard accessible (if admin email)
- [ ] ✅ Staff dashboard accessible (if approved merchant)
- [ ] ✅ Email sending works (check Supabase logs)
- [ ] ✅ All environment variables are set
- [ ] ✅ Supabase URL configuration updated
- [ ] ✅ No console errors in browser

---

## Troubleshooting

### ❌ Build Fails

**Check:**
- Build logs in Vercel dashboard
- All environment variables are set
- Node.js version (Vercel uses 18.x by default)

**Fix:**
- Check for TypeScript errors
- Verify all dependencies are in `package.json`
- Check build command is correct

### ❌ Environment Variables Not Working

**Check:**
- Variables are added for correct environment (Production/Preview/Development)
- Variable names are correct (case-sensitive)
- Variables starting with `VITE_` are prefixed correctly

**Fix:**
- Redeploy after adding new variables
- Check variable names match exactly
- Verify no extra spaces in values

### ❌ Internal Routes Not Working

**Problem:** `/__internal/*` routes return 404

**Solution:**
- These routes only work in development
- Need to create Vercel serverless functions
- Or use Supabase Edge Functions

### ❌ Supabase Connection Issues

**Check:**
- `VITE_SUPABASE_URL` is correct
- `VITE_SUPABASE_ANON_KEY` is correct
- Supabase project is active
- RLS policies allow access

**Fix:**
- Verify environment variables in Vercel dashboard
- Check Supabase project status
- Review RLS policies

### ❌ Email Not Sending

**Check:**
- Email enabled in Supabase Dashboard
- Check Supabase Auth Logs
- Verify `SUPABASE_SERVICE_KEY` is set

**Fix:**
- Enable email in Supabase Dashboard
- Check Supabase logs for errors
- Verify service key is correct

---

## Quick Reference

**Build Command:** `npm run build`  
**Output Directory:** `dist`  
**Node Version:** 18.x (Vercel default)  
**Framework:** Vite  
**Deployment URL:** `https://your-app.vercel.app`

---

## Next Steps After Deployment

1. ✅ Test all features
2. ✅ Set up custom domain (optional)
3. ✅ Configure email templates in Supabase
4. ✅ Set up monitoring/analytics (optional)
5. ✅ Create serverless functions for internal routes (if needed)

---

## Need Help?

- **Vercel Docs:** https://vercel.com/docs
- **Vercel Support:** https://vercel.com/support
- **Supabase Docs:** https://supabase.com/docs
- **Check build logs** in Vercel dashboard for specific errors

---

## Summary

**Quick Deployment Steps:**
1. ✅ Push code to GitHub
2. ✅ Import repository in Vercel
3. ✅ Add environment variables
4. ✅ Deploy
5. ✅ Update Supabase URL configuration
6. ✅ Test everything
7. ✅ Create serverless functions for internal routes (if needed)

**That's it! Your QuickBite app should be live on Vercel!** 🎉

