# ✅ Complete Vercel Deployment Checklist

## 🎯 All Backend Functions Ready for Deployment

### ✅ Functions at `api/` Root (12 Functions)

All functions are properly configured with:
- ✅ CORS headers
- ✅ Error handling
- ✅ Proper request/response handling
- ✅ Supabase admin client setup

#### 1. **Authentication & User Management**
- ✅ `api/ping.ts` - Health check for admin client
- ✅ `api/check-email-exists.ts` - Email validation for registration
- ✅ `api/login-approved-staff.ts` - Staff login authentication
- ✅ `api/confirm-admin.ts` - Admin user creation/update

#### 2. **Merchant Application**
- ✅ `api/submit-merchant-app.ts` - Merchant application submission
- ✅ `api/provision-staff.ts` - Create staff user on approval
- ✅ `api/send-approval-email.ts` - Send approval email
- ✅ `api/send-rejection-email.ts` - Send rejection email

#### 3. **Staff Management**
- ✅ `api/revoke-staff-access.ts` - Revoke staff access
- ✅ `api/delete-approved-staff.ts` - Delete staff account

#### 4. **Health & Monitoring**
- ✅ `api/health.ts` - Database health check
- ✅ `api/test.ts` - Test function for deployment verification

---

## 📋 Pre-Deployment Checklist

### ✅ Code Ready
- [x] All 12 functions at `api/` root level
- [x] All functions have CORS headers
- [x] All functions have proper error handling
- [x] `vercel.json` configured correctly
- [x] All frontend calls use `/api/` paths
- [x] Code committed to Git

### ⚠️ Before Deploying - Do These:

#### 1. **Remove Deprecated `api/_internal/` Directory** (Optional)
The `api/_internal/` directory contains old duplicate functions. You can delete it:
```bash
# Optional: Remove old directory
rm -rf api/_internal
```

#### 2. **Verify Environment Variables**
Make sure you have these ready:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL` (same as VITE_SUPABASE_URL)
- `SUPABASE_SERVICE_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_ADMIN_EMAILS`

---

## 🚀 Deployment Steps

### Step 1: Commit All Changes
```bash
git add .
git commit -m "Prepare for Vercel deployment - all backend functions ready"
git push
```

### Step 2: Deploy to Vercel

#### Option A: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com
   - Sign in with GitHub
   - Click **"Add New..."** → **"Project"**

2. **Import Repository:**
   - Find your **QuickBite** repository
   - Click **"Import"**

3. **Configure Project:**
   - **Framework Preset:** `Vite` (auto-detected)
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist/public`
   - **Install Command:** `npm install`

4. **Add Environment Variables:**
   Click **"Environment Variables"** and add:
   
   | Variable | Value | Environments |
   |----------|-------|--------------|
   | `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | ☑ Production ☑ Preview ☑ Development |
   | `VITE_SUPABASE_ANON_KEY` | `your-anon-key` | ☑ Production ☑ Preview ☑ Development |
   | `SUPABASE_URL` | `https://your-project.supabase.co` | ☑ Production ☑ Preview ☑ Development |
   | `SUPABASE_SERVICE_KEY` | `your-service-key` | ☑ Production ☑ Preview ☑ Development |
   | `VITE_ADMIN_EMAILS` | `admin@example.com` | ☑ Production ☑ Preview ☑ Development |

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

## ✅ Post-Deployment Verification

### 1. Check Functions Are Deployed

1. **Go to Vercel Dashboard:**
   - Your Project → Deployments → Latest Deployment
   - Look for **"Functions"** tab/section
   - You should see all 12 functions listed

### 2. Test Functions

Test each function in your browser or using curl:

```bash
# Test ping
curl https://your-app.vercel.app/api/ping
# Expected: "ok"

# Test health
curl https://your-app.vercel.app/api/health
# Expected: {"ok":true,"missing":[]}

# Test test function
curl https://your-app.vercel.app/api/test
# Expected: {"message":"Test function works!","method":"GET"}
```

### 3. Test Application Features

1. **User Registration:**
   - Visit: `https://your-app.vercel.app/register`
   - Try creating an account
   - Check Vercel logs for `/api/check-email-exists` calls

2. **Merchant Application:**
   - Visit: `https://your-app.vercel.app/merchant-apply`
   - Submit an application
   - Check Vercel logs for `/api/submit-merchant-app` calls

3. **Admin Dashboard:**
   - Visit: `https://your-app.vercel.app/admin`
   - Approve/reject merchant applications
   - Check Vercel logs for email sending functions

4. **Staff Login:**
   - Visit: `https://your-app.vercel.app/login`
   - Try logging in as staff
   - Check Vercel logs for `/api/login-approved-staff` calls

### 4. Check Logs

1. **Go to Vercel Dashboard:**
   - Your Project → Logs
   - Try using the application
   - You should see logs from functions when they're called

---

## 🔧 Troubleshooting

### Functions Not Showing Up?

1. **Wait for deployment to complete** (check build logs)
2. **Verify functions are at `api/` root** (not in subdirectories)
3. **Check build logs** for TypeScript errors
4. **Verify `vercel.json`** rewrite rule is correct

### 404 Errors?

1. **Wait for deployment to complete**
2. **Check Functions tab** in deployment details
3. **Verify function names** match frontend calls
4. **Check `vercel.json`** rewrite rule excludes `/api/` paths

### Functions Not Working?

1. **Check environment variables** are set correctly
2. **Check Vercel logs** for error messages
3. **Verify Supabase credentials** are correct
4. **Test functions directly** using curl or browser

### Data Not Saving?

1. **Apply RLS policies** in Supabase (see `SUPABASE_RLS_FIX.md`)
2. **Check environment variables** are set correctly
3. **Check Vercel logs** for database errors
4. **Verify Supabase service key** has proper permissions

---

## 📝 Environment Variables Reference

### Required Variables

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `VITE_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard → Settings → API → anon/public key |
| `SUPABASE_URL` | Same as VITE_SUPABASE_URL | Same as above |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Supabase Dashboard → Settings → API → service_role key |
| `VITE_ADMIN_EMAILS` | Admin email(s), comma-separated | Your admin email(s) |

### ⚠️ Important Notes

- **Service Key is Secret:** Never expose `SUPABASE_SERVICE_KEY` in frontend code
- **All Environments:** Add variables for Production, Preview, AND Development
- **Case Sensitive:** Variable names are case-sensitive

---

## ✅ Deployment Complete!

Once all steps are complete, your QuickBite system will be fully deployed to Vercel with:
- ✅ Frontend (React/Vite)
- ✅ Backend (12 serverless functions)
- ✅ Database (Supabase)
- ✅ All features working

---

## 🎉 Next Steps

1. **Apply RLS Policies** in Supabase (if not done)
2. **Configure Supabase URLs** (Site URL, Redirect URLs)
3. **Enable Email** in Supabase Authentication settings
4. **Test all features** thoroughly
5. **Monitor logs** for any issues

---

## 📚 Additional Resources

- `DEPLOY_FRONTEND_VERCEL_STEP_BY_STEP.md` - Detailed deployment guide
- `SUPABASE_RLS_FIX.md` - RLS policies setup
- `BACKEND_FUNCTIONS_DEPLOYED.md` - Function reference

