# 🚀 Complete Deployment Guide: Frontend (Vercel) + Backend (Render) + Supabase

## 📋 Architecture Overview

- **Frontend**: Vercel (React/Vite app)
- **Backend API**: Render (Express server)
- **Database**: Supabase (PostgreSQL)

---

## 🎯 Part 1: Deploy Frontend to Vercel

### Step 1: Prepare Your Code

1. **Make sure all changes are committed:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

### Step 2: Deploy to Vercel

#### Option A: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com
   - Sign in with GitHub
   - Click **"Add New..."** → **"Project"**

2. **Import Your Repository:**
   - Find your **QuickBite** repository
   - Click **"Import"**

3. **Configure Project Settings:**
   - **Framework Preset:** `Vite` (should auto-detect)
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist/public`
   - **Install Command:** `npm install`

4. **Add Environment Variables:**
   Click **"Environment Variables"** and add:
   
   - `VITE_SUPABASE_URL` = `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your-anon-key`
   - `VITE_ADMIN_EMAILS` = `admin@example.com`
   - `VITE_API_URL` = `https://your-backend.onrender.com` (will be set after Render deployment)

   Make sure to add them for **Production**, **Preview**, and **Development**.

5. **Deploy:**
   - Click **"Deploy"**
   - Wait 2-5 minutes
   - Get your URL: `https://your-app.vercel.app`

#### Option B: Via Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

---

## 🎯 Part 2: Deploy Backend to Render

### Step 1: Create Express Server for Render

Since your backend functions are currently Vercel serverless functions, you'll need to create an Express server that hosts these endpoints.

### Step 2: Set Up Render Service

1. **Go to Render Dashboard:**
   - Visit: https://render.com
   - Sign up/Sign in
   - Click **"New +"** → **"Web Service"**

2. **Connect Repository:**
   - Connect your GitHub account
   - Select your **QuickBite** repository

3. **Configure Service:**
   - **Name:** `quickbite-backend` (or your choice)
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server/index.js` (or your server file)
   - **Plan:** Free (or paid if needed)

4. **Add Environment Variables:**
   - `SUPABASE_URL` = `https://your-project.supabase.co`
   - `SUPABASE_SERVICE_KEY` = `your-service-key`
   - `NODE_ENV` = `production`
   - `PORT` = `10000` (Render default)

5. **Deploy:**
   - Click **"Create Web Service"**
   - Wait for deployment (5-10 minutes)
   - Get your URL: `https://your-backend.onrender.com`

### Step 3: Update Frontend to Use Render Backend

Update all API calls in your frontend to point to your Render backend URL instead of `/api/`.

---

## 🎯 Part 3: Configure Supabase

### Step 1: Apply RLS Policies

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project
   - Go to **SQL Editor**

2. **Run the Migration:**
   - Open `supabase/migrations/20251209000007_add_users_and_merchant_apps_rls.sql`
   - Copy the contents
   - Paste into SQL Editor
   - Click **"Run"**

### Step 2: Configure Authentication URLs

1. **Go to Authentication → URL Configuration:**
   - **Site URL:** `https://your-app.vercel.app`
   - **Redirect URLs:** Add:
     - `https://your-app.vercel.app/**`
     - `https://your-backend.onrender.com/**`

### Step 3: Enable Email

1. **Go to Authentication → Settings:**
   - Enable **"Enable Email Signup"**
   - Enable **"Enable Email Invitations"**
   - Click **"Save"**

---

## ⚠️ Important Note

**Your current setup already has backend functions as Vercel serverless functions!**

This is actually **better** than using Render because:
- ✅ Simpler (one platform)
- ✅ Faster (serverless)
- ✅ Already configured
- ✅ Cost-effective

**Recommendation:** Keep everything on Vercel (current setup) unless you have a specific reason to use Render.

---

## 🔄 Alternative: Keep Everything on Vercel (Recommended)

Your current setup is already perfect! Just:

1. **Deploy to Vercel** (already done or in progress)
2. **Set environment variables** in Vercel Dashboard
3. **Apply RLS policies** in Supabase
4. **Done!**

All backend functions are already configured as Vercel serverless functions and will work automatically.

---

## 📝 Next Steps

Would you like me to:
1. **Help complete the Vercel deployment** (recommended - simpler)
2. **Create an Express server for Render** (more complex)

Let me know which approach you prefer!

