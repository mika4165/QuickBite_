# 🚀 Complete Vercel Deployment Guide - Step by Step

## ✅ Everything You Need to Deploy QuickBite to Vercel

This guide will walk you through deploying your complete QuickBite application to Vercel with all features working.

---

## 📋 Prerequisites

Before starting, make sure you have:

- [ ] **Vercel Account** - Sign up at [vercel.com](https://vercel.com) (free)
- [ ] **GitHub Account** - Your code needs to be in a Git repository
- [ ] **Supabase Project** - Already set up and running
- [ ] **All Environment Variables** - Ready to copy (see Step 2)

---

## Step 1: Prepare Your Code

### 1.1: Commit All Changes

```bash
# Check status
git status

# If you have uncommitted changes:
git add .
git commit -m "Prepare for Vercel deployment - added serverless functions"
```

### 1.2: Push to GitHub

```bash
# If not already pushed:
git push

# Or if first time:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

---

## Step 2: Gather Environment Variables

Open your `.env.local` file and copy these values:

### Required Variables:

1. **`VITE_SUPABASE_URL`**
   - Value: `https://iotluyleerimuoioattt.supabase.co`
   - Get from: Supabase Dashboard → Settings → API

2. **`VITE_SUPABASE_ANON_KEY`**
   - Value: Your anon key (starts with `eyJ...`)
   - Get from: Supabase Dashboard → Settings → API

3. **`SUPABASE_SERVICE_KEY`**
   - Value: Your service role key (starts with `eyJ...`)
   - ⚠️ Keep this secret!
   - Get from: Supabase Dashboard → Settings → API

4. **`VITE_ADMIN_EMAILS`**
   - Value: `mika@admin.com` (or your admin email(s))
   - Comma-separated if multiple

**Write these down - you'll need them in Step 4!**

---

## Step 3: Sign Up for Vercel & Connect GitHub

### 3.1: Create Vercel Account

1. Go to: [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. **Choose:** "Continue with GitHub" (recommended)
4. Authorize Vercel to access your GitHub account

### 3.2: Import Your Repository

1. In Vercel Dashboard, click **"Add New..."** → **"Project"**
2. You'll see your GitHub repositories
3. Find your **QuickBite** repository
4. Click **"Import"** next to it

---

## Step 4: Configure Project Settings

### 4.1: Project Configuration

Vercel should auto-detect Vite. Verify these settings:

- **Framework Preset:** `Vite` ✅
- **Root Directory:** `./` (leave as default)
- **Build Command:** `npm run build` ✅
- **Output Directory:** `dist` ✅
- **Install Command:** `npm install` ✅

**Don't click Deploy yet!** Add environment variables first.

### 4.2: Add Environment Variables (CRITICAL!)

**This is the most important step!**

1. Scroll down to **"Environment Variables"** section
2. Click to expand it
3. Add each variable one by one:

   **Variable 1:**
   ```
   Name: VITE_SUPABASE_URL
   Value: https://iotluyleerimuoioattt.supabase.co
   Environment: ☑ Production ☑ Preview ☑ Development
   ```
   Click **"Add"**

   **Variable 2:**
   ```
   Name: VITE_SUPABASE_ANON_KEY
   Value: [paste your anon key from .env.local]
   Environment: ☑ Production ☑ Preview ☑ Development
   ```
   Click **"Add"**

   **Variable 3:**
   ```
   Name: SUPABASE_SERVICE_KEY
   Value: [paste your service key from .env.local]
   Environment: ☑ Production ☑ Preview ☑ Development
   ```
   Click **"Add"**

   **Variable 4:**
   ```
   Name: VITE_ADMIN_EMAILS
   Value: mika@admin.com
   Environment: ☑ Production ☑ Preview ☑ Development
   ```
   Click **"Add"**

4. **Important:** Make sure each variable is checked for **all three environments** (Production, Preview, Development)

---

## Step 5: Deploy!

1. Click the big **"Deploy"** button
2. Wait for the build to complete (2-5 minutes)
3. Watch the build logs:
   - ✅ Green checkmarks = Success
   - ❌ Red X = Error (check the logs)

4. Once deployed, you'll see:
   - **Production URL:** `https://your-app.vercel.app`
   - **Deployment Status:** Ready

---

## Step 6: Configure Supabase for Production

### 6.1: Update Supabase URL Configuration

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/iotluyleerimuoioattt
   - Click **"Authentication"** → **"URL Configuration"**

2. **Update Site URL:**
   - **Site URL:** `https://your-app.vercel.app` (your Vercel URL)
   - Click **"Save"**

3. **Add Redirect URLs:**
   - In **"Redirect URLs"** section, click **"Add URL"**
   - Add: `https://your-app.vercel.app/**`
   - Click **"Save"**

### 6.2: Verify Email is Enabled

1. Go to: **Authentication** → **Settings**
2. Verify:
   - ✅ **"Enable Email Signup"** is ON
   - ✅ **"Enable Email Invitations"** is ON
3. If not enabled, enable them and click **"Save"**

---

## Step 7: Serverless Functions ✅

✅ **All serverless functions are already created!**

The following functions are in `api/__internal/`:
- ✅ `ping.ts` - Health check
- ✅ `health.ts` - Database health check
- ✅ `check-email-exists.ts` - Email validation
- ✅ `provision-staff.ts` - Staff provisioning
- ✅ `send-approval-email.ts` - Approval emails
- ✅ `send-rejection-email.ts` - Rejection emails
- ✅ `submit-merchant-app.ts` - Merchant application
- ✅ `login-approved-staff.ts` - Staff login
- ✅ `confirm-admin.ts` - Admin confirmation
- ✅ `revoke-staff-access.ts` - Revoke access
- ✅ `delete-approved-staff.ts` - Delete account

**These will automatically work on Vercel!** No additional setup needed.

---

## Step 8: Test Your Deployment

### 8.1: Basic Functionality Tests

1. **Visit your Vercel URL:** `https://your-app.vercel.app`

2. **Test User Registration:**
   - Go to `/register`
   - Create a test account
   - ✅ Should work

3. **Test Login:**
   - Go to `/login`
   - Log in with test account
   - ✅ Should work

4. **Test Merchant Application:**
   - Go to merchant application page
   - Submit a test application
   - ✅ Should be saved

### 8.2: Admin Features Tests

1. **Log in as Admin:**
   - Use email from `VITE_ADMIN_EMAILS`
   - Go to `/admin`
   - ✅ Should see admin dashboard

2. **Test Approval:**
   - Approve a merchant application
   - ✅ Should work (serverless functions handle it)
   - Check if email is sent

3. **Test Rejection:**
   - Reject a merchant application
   - ✅ Should work
   - Check if email is sent

### 8.3: Staff Features Tests

1. **Log in as Staff:**
   - Use an approved merchant email
   - Go to `/staff`
   - ✅ Should see staff dashboard

---

## Step 9: Post-Deployment Checklist

After deployment, verify:

- [ ] ✅ Application loads at Vercel URL
- [ ] ✅ User registration works
- [ ] ✅ User login works
- [ ] ✅ Merchant application submission works
- [ ] ✅ Admin dashboard accessible
- [ ] ✅ Staff dashboard accessible (if approved merchant)
- [ ] ✅ Email sending works (check Supabase logs)
- [ ] ✅ All environment variables are set
- [ ] ✅ Supabase URL configuration updated
- [ ] ✅ No console errors in browser
- [ ] ✅ Serverless functions work (test admin approval)

---

## Troubleshooting

### ❌ Build Fails

**Check:**
- Build logs in Vercel dashboard
- TypeScript errors
- Missing dependencies

**Fix:**
- Check build logs for specific errors
- Verify all dependencies are in `package.json`
- Check Node.js version (Vercel uses 18.x)

### ❌ Environment Variables Not Working

**Check:**
- Variables are added for all environments
- Variable names are correct (case-sensitive)
- No extra spaces in values

**Fix:**
- Redeploy after adding variables
- Double-check variable names
- Verify values are correct

### ❌ Internal Routes Return 404

**Problem:** `/__internal/*` routes don't work

**Solution:**
- ✅ Serverless functions are already created in `api/__internal/`
- Make sure they're committed and pushed to GitHub
- Redeploy on Vercel

### ❌ Supabase Connection Issues

**Check:**
- `VITE_SUPABASE_URL` is correct
- `VITE_SUPABASE_ANON_KEY` is correct
- Supabase project is active

**Fix:**
- Verify environment variables in Vercel
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

**Serverless Functions:** `api/__internal/*.ts`  
**Environment Variables:** Set in Vercel Dashboard

---

## Summary

**Quick Steps:**
1. ✅ Push code to GitHub (including serverless functions)
2. ✅ Import repository in Vercel
3. ✅ Add environment variables (4 required)
4. ✅ Deploy
5. ✅ Update Supabase URL configuration
6. ✅ Test everything
7. ✅ Done! 🎉

**Your QuickBite app will be live on Vercel with all features working!** 🚀

---

## Need Help?

- **Vercel Docs:** https://vercel.com/docs
- **Vercel Support:** https://vercel.com/support
- **Supabase Docs:** https://supabase.com/docs
- **Check build logs** in Vercel dashboard for specific errors

