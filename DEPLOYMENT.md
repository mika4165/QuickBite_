# QuickBite - Vercel Deployment Guide

This guide will walk you through deploying your QuickBite application to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) (free account works)
2. **GitHub/GitLab/Bitbucket Account**: Your code needs to be in a Git repository
3. **Supabase Project**: Your Supabase project should be set up and running
4. **Resend Account** (for emails): Sign up at [resend.com](https://resend.com) if you haven't already

## Step-by-Step Deployment Instructions

### Step 1: Prepare Your Code Repository

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create a GitHub Repository**:
   - Go to [github.com](https://github.com) and create a new repository
   - Don't initialize it with README, .gitignore, or license
   - Copy the repository URL

3. **Push Your Code to GitHub**:
   ```bash
   git remote add origin <your-github-repo-url>
   git branch -M main
   git push -u origin main
   ```

### Step 2: Set Up Environment Variables

Before deploying, gather all your environment variables:

**Required Environment Variables:**
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_KEY` - Your Supabase service role key (for admin operations)
- `RESEND_API_KEY` - Your Resend API key (for sending emails)
- `RESEND_FROM_EMAIL` - Email address to send from (e.g., `noreply@yourdomain.com`)
- `VITE_ADMIN_EMAILS` - Comma-separated list of admin emails (e.g., `admin@example.com,admin2@example.com`)

**Where to find these:**
- **Supabase**: Go to your Supabase project → Settings → API
- **Resend**: Go to your Resend dashboard → API Keys

### Step 3: Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**:
   - Visit [vercel.com](https://vercel.com)
   - Sign in or create an account
   - Click "Add New..." → "Project"

2. **Import Your Repository**:
   - Connect your GitHub/GitLab/Bitbucket account if not already connected
   - Select your QuickBite repository
   - Click "Import"

3. **Configure Project Settings**:
   - **Framework Preset**: Vite (should auto-detect)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (should auto-fill)
   - **Output Directory**: `dist` (should auto-fill)
   - **Install Command**: `npm install` (should auto-fill)

4. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add each variable one by one:
     - `VITE_SUPABASE_URL` = `your-supabase-url`
     - `VITE_SUPABASE_ANON_KEY` = `your-anon-key`
     - `SUPABASE_SERVICE_KEY` = `your-service-key`
     - `RESEND_API_KEY` = `your-resend-api-key`
     - `RESEND_FROM_EMAIL` = `your-email@domain.com`
     - `VITE_ADMIN_EMAILS` = `admin@example.com`
   - Make sure to add them for **Production**, **Preview**, and **Development** environments
   - Click "Save"

5. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete (usually 2-5 minutes)
   - Once deployed, you'll get a URL like `your-app.vercel.app`

#### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   - Follow the prompts
   - When asked about environment variables, you can add them now or later in the dashboard

4. **Add Environment Variables** (if not done during deployment):
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_KEY
   vercel env add RESEND_API_KEY
   vercel env add RESEND_FROM_EMAIL
   vercel env add VITE_ADMIN_EMAILS
   ```

5. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

### Step 4: Configure Vercel for Internal Routes (Important!)

⚠️ **Note**: Your `vite.config.ts` has internal API routes (`/__internal/*`) that work in development but won't work on Vercel. You have two options:

#### Option A: Convert to Vercel Serverless Functions (Recommended)

Create API routes in Vercel:

1. **Create `api/` directory** in your project root
2. **Move internal route logic** to serverless functions
3. **Update your frontend** to call these API routes

This requires more setup but gives you full control.

#### Option B: Use Supabase Edge Functions (Alternative)

Move the admin operations to Supabase Edge Functions and call them from your frontend.

#### Option C: Deploy Without Internal Routes (Quick Start)

For now, the app will work for most features, but admin operations (provisioning staff, sending emails) won't work until you set up the API routes.

**To make admin operations work later**, you'll need to:
- Create Vercel serverless functions for `/__internal/provision-staff`, `/__internal/send-approval-email`, etc.
- Or use Supabase Edge Functions

### Step 5: Post-Deployment Configuration

1. **Update Supabase Settings**:
   - Go to your Supabase project → Authentication → URL Configuration
   - Add your Vercel URL to "Site URL": `https://your-app.vercel.app`
   - Add to "Redirect URLs**: `https://your-app.vercel.app/**`

2. **Update Resend Domain** (if using custom domain):
   - Verify your domain in Resend dashboard
   - Update `RESEND_FROM_EMAIL` to use your verified domain

3. **Test Your Deployment**:
   - Visit your Vercel URL
   - Test user registration
   - Test login
   - Test merchant application
   - Test admin dashboard (if applicable)

### Step 6: Custom Domain (Optional)

1. **In Vercel Dashboard**:
   - Go to your project → Settings → Domains
   - Add your custom domain
   - Follow the DNS configuration instructions

2. **Update Supabase**:
   - Update "Site URL" and "Redirect URLs" in Supabase to include your custom domain

## Troubleshooting

### Build Fails

- **Check build logs** in Vercel dashboard
- **Verify environment variables** are set correctly
- **Check Node.js version** - Vercel uses Node 18.x by default (should work fine)

### Environment Variables Not Working

- Make sure variables starting with `VITE_` are prefixed correctly
- Redeploy after adding new environment variables
- Check that variables are added for the correct environment (Production/Preview/Development)

### Internal Routes Not Working

- Internal routes (`/__internal/*`) only work in development
- You need to convert them to Vercel serverless functions for production
- See Step 4 above for options

### Supabase Connection Issues

- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Check Supabase project is active
- Verify RLS policies allow public access where needed

## Quick Reference

**Build Command**: `npm run build`  
**Output Directory**: `dist`  
**Node Version**: 18.x (default)  
**Framework**: Vite

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- Supabase Docs: https://supabase.com/docs

