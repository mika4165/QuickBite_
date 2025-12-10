# 🚀 Deploy QuickBite to Vercel - Complete Step-by-Step Guide

## ✅ What's Ready

- ✅ All serverless functions created in `api/__internal/`
- ✅ Vercel configuration file (`vercel.json`)
- ✅ All code is ready for deployment

---

## 📋 Step-by-Step Deployment

### Step 1: Prepare Your Code

```bash
# 1. Commit all changes
git add .
git commit -m "Ready for Vercel deployment"

# 2. Push to GitHub
git push
```

---

### Step 2: Get Your Environment Variables

Open `.env.local` and copy these values:

1. **`VITE_SUPABASE_URL`** = `https://iotluyleerimuoioattt.supabase.co`
2. **`VITE_SUPABASE_ANON_KEY`** = (your anon key)
3. **`SUPABASE_SERVICE_KEY`** = (your service key)
4. **`VITE_ADMIN_EMAILS`** = `mika@admin.com`

---

### Step 3: Deploy to Vercel

#### 3.1: Go to Vercel

1. Visit: [vercel.com](https://vercel.com)
2. Sign in (or create account with GitHub)
3. Click **"Add New..."** → **"Project"**

#### 3.2: Import Repository

1. Find your **QuickBite** repository
2. Click **"Import"**

#### 3.3: Configure Project

**Settings (should auto-detect):**
- Framework: `Vite` ✅
- Root Directory: `./` ✅
- Build Command: `npm run build` ✅
- Output Directory: `dist` ✅

#### 3.4: Add Environment Variables

**Click "Environment Variables" and add:**

1. **VITE_SUPABASE_URL**
   - Value: `https://iotluyleerimuoioattt.supabase.co`
   - Environments: ☑ Production ☑ Preview ☑ Development

2. **VITE_SUPABASE_ANON_KEY**
   - Value: (paste from .env.local)
   - Environments: ☑ Production ☑ Preview ☑ Development

3. **SUPABASE_SERVICE_KEY**
   - Value: (paste from .env.local)
   - Environments: ☑ Production ☑ Preview ☑ Development

4. **VITE_ADMIN_EMAILS**
   - Value: `mika@admin.com`
   - Environments: ☑ Production ☑ Preview ☑ Development

#### 3.5: Deploy!

1. Click **"Deploy"**
2. Wait 2-5 minutes
3. Get your URL: `https://your-app.vercel.app`

---

### Step 4: Configure Supabase

1. **Go to:** https://supabase.com/dashboard/project/iotluyleerimuoioattt/auth/url-configuration

2. **Update:**
   - **Site URL:** `https://your-app.vercel.app`
   - **Redirect URLs:** Add `https://your-app.vercel.app/**`

3. **Save**

---

### Step 5: Enable Email in Supabase

1. **Go to:** https://supabase.com/dashboard/project/iotluyleerimuoioattt/auth/settings

2. **Enable:**
   - ✅ Enable Email Signup
   - ✅ Enable Email Invitations

3. **Save**

---

### Step 6: Test Everything

1. **Visit:** `https://your-app.vercel.app`
2. **Test:**
   - ✅ User registration
   - ✅ User login
   - ✅ Merchant application
   - ✅ Admin dashboard (log in with admin email)
   - ✅ Approve/reject merchant (should work!)
   - ✅ Staff dashboard (log in with approved merchant)

---

## ✅ What's Working

- ✅ All frontend features
- ✅ User registration/login
- ✅ Merchant applications
- ✅ Admin dashboard
- ✅ Staff dashboard
- ✅ Email sending (via Supabase)
- ✅ All serverless functions (admin operations)

---

## 🎉 Done!

Your QuickBite app is now live on Vercel with all features working!

**URL:** `https://your-app.vercel.app`

---

## Troubleshooting

**Build fails?** Check build logs in Vercel dashboard

**Environment variables not working?** Make sure they're added for all environments

**Internal routes 404?** Serverless functions are in `api/__internal/` - make sure they're committed

**Email not sending?** Enable email in Supabase Dashboard

---

## Quick Checklist

- [ ] Code pushed to GitHub
- [ ] Repository imported in Vercel
- [ ] Environment variables added (4 required)
- [ ] Deployed successfully
- [ ] Supabase URL configuration updated
- [ ] Email enabled in Supabase
- [ ] Tested all features
- [ ] Everything works! ✅

