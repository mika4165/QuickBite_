# 🚀 Complete Step-by-Step Vercel Deployment Guide

## Overview

This guide will help you deploy your complete QuickBite system to Vercel with all features working.

---

## 📋 Pre-Deployment Checklist

Before starting, make sure:

- [ ] Your code is committed to Git
- [ ] Your code is pushed to GitHub
- [ ] You have all environment variables ready
- [ ] Supabase project is set up and running
- [ ] Email is enabled in Supabase Dashboard

---

## Step 1: Prepare Your Code

### 1.1: Commit and Push to GitHub

```bash
# Check status
git status

# If you have uncommitted changes:
git add .
git commit -m "Prepare for Vercel deployment"

# Push to GitHub
git push
```

### 1.2: Verify Your Repository

- Go to GitHub and verify your code is there
- Make sure `.env.local` is NOT committed (it's in `.gitignore` ✅)

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

## Step 3: Create Vercel Account & Connect GitHub

### 3.1: Sign Up for Vercel

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

Vercel should auto-detect Vite, but verify these settings:

- **Framework Preset:** `Vite` ✅
- **Root Directory:** `./` (leave as default)
- **Build Command:** `npm run build` ✅
- **Output Directory:** `dist` ✅
- **Install Command:** `npm install` ✅

**Don't click Deploy yet!** We need to add environment variables first.

### 4.2: Add Environment Variables

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
   Value: [paste your anon key]
   Environment: ☑ Production ☑ Preview ☑ Development
   ```
   Click **"Add"**

   **Variable 3:**
   ```
   Name: SUPABASE_SERVICE_KEY
   Value: [paste your service key]
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

## Step 7: Serverless Functions Created! ✅

✅ **I've created all the necessary Vercel serverless functions!**

The following functions are now in the `api/__internal/` directory:
- ✅ `ping.ts` - Health check
- ✅ `health.ts` - Database health check
- ✅ `check-email-exists.ts` - Email validation
- ✅ `provision-staff.ts` - Staff provisioning
- ✅ `send-approval-email.ts` - Approval emails
- ✅ `send-rejection-email.ts` - Rejection emails
- ✅ `submit-merchant-app.ts` - Merchant application submission
- ✅ `login-approved-staff.ts` - Staff login
- ✅ `confirm-admin.ts` - Admin confirmation
- ✅ `revoke-staff-access.ts` - Revoke staff access
- ✅ `delete-approved-staff.ts` - Delete staff account

**These will automatically work on Vercel!** No additional configuration needed.

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
   - ⚠️ **May not work yet** if serverless functions aren't set up
   - Check browser console for errors

### 8.3: Check for Errors

1. **Open Browser Console (F12)**
2. **Look for:**
   - 404 errors for `/__internal/*` routes
   - Other error messages
3. **Check Network Tab:**
   - Look for failed requests

---

## Step 9: Create Serverless Functions (If Needed)

If admin features don't work, we need to create serverless functions. I'll create them for you in the next step.

---

## Step 10: Post-Deployment Checklist

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
- Need to create Vercel serverless functions
- See Step 9 above
- Or use Supabase Edge Functions

### ❌ Supabase Connection Issues

**Check:**
- `VITE_SUPABASE_URL` is correct
- `VITE_SUPABASE_ANON_KEY` is correct
- Supabase project is active

**Fix:**
- Verify environment variables in Vercel
- Check Supabase project status
- Review RLS policies

---

## Quick Reference

**Build Command:** `npm run build`  
**Output Directory:** `dist`  
**Node Version:** 18.x (Vercel default)  
**Framework:** Vite  
**Deployment URL:** `https://your-app.vercel.app`

---

## Next Steps

After successful deployment:

1. ✅ Test all features
2. ✅ Set up custom domain (optional)
3. ✅ Create serverless functions for internal routes (if needed)
4. ✅ Monitor deployment for errors
5. ✅ Set up analytics (optional)

---

## Summary

**Quick Steps:**
1. ✅ Push code to GitHub
2. ✅ Import repository in Vercel
3. ✅ Add environment variables
4. ✅ Deploy
5. ✅ Update Supabase URL configuration
6. ✅ Test everything
7. ✅ Create serverless functions (if needed)

**Your QuickBite app will be live on Vercel!** 🎉

