# ✅ Backend Functions Deployed to Vercel

All backend serverless functions are deployed at the root of the `api/` directory and will be automatically detected by Vercel.

## 📋 Complete List of Deployed Functions

### 1. **Authentication & User Management**
- ✅ `api/check-email-exists.ts` - Validates email availability for registration
- ✅ `api/login-approved-staff.ts` - Handles staff login authentication
- ✅ `api/confirm-admin.ts` - Creates/updates admin user for admin login

### 2. **Merchant Application**
- ✅ `api/submit-merchant-app.ts` - Handles merchant application submission
- ✅ `api/provision-staff.ts` - Creates/updates staff user when admin approves application
- ✅ `api/send-approval-email.ts` - Sends approval email to merchant
- ✅ `api/send-rejection-email.ts` - Sends rejection email to merchant

### 3. **Staff Management**
- ✅ `api/revoke-staff-access.ts` - Revokes staff access and deletes all related data
- ✅ `api/delete-approved-staff.ts` - Deletes approved staff account and all associated data

### 4. **Health & Monitoring**
- ✅ `api/ping.ts` - Checks if admin client is configured
- ✅ `api/health.ts` - Checks if required database tables exist
- ✅ `api/test.ts` - Test function for deployment verification

## 🔗 Frontend API Calls

All frontend calls have been updated to use `/api/` paths:

### From `client/src/lib/queryClient.ts`:
- `/api/check-email-exists` - Email validation
- `/api/login-approved-staff` - Staff login
- `/api/confirm-admin` - Admin confirmation
- `/api/revoke-staff-access` - Revoke staff access
- `/api/delete-approved-staff` - Delete staff
- `/api/ping` - Health check

### From `client/src/pages/AdminDashboard.tsx`:
- `/api/health` - Database health check
- `/api/ping` - Admin client check
- `/api/provision-staff` - Provision staff user
- `/api/send-approval-email` - Send approval email
- `/api/send-rejection-email` - Send rejection email

### From `client/src/pages/StaffDashboard.tsx`:
- `/api/ping` - Admin client check
- `/api/provision-staff` - Provision staff user

### From `client/src/pages/MerchantApply.tsx`:
- `/api/ping` - Admin client check
- `/api/submit-merchant-app` - Submit merchant application

## ✅ Deployment Status

- ✅ All functions are at `api/` root level (Vercel auto-detects these)
- ✅ All functions are committed to git
- ✅ All frontend calls updated to use `/api/` paths
- ✅ All functions include proper error handling
- ✅ All functions connect to Supabase using service key

## 🚀 How Vercel Detects Functions

Vercel automatically detects serverless functions in the `api/` directory at the root of your project. Each `.ts` file in `api/` becomes a serverless function accessible at `/api/{filename}`.

## 📝 Verification Steps

After deployment, verify functions are deployed:

1. **Check Vercel Dashboard:**
   - Go to: Vercel Dashboard → Your Project → Deployments → Latest Deployment
   - Look for "Functions" tab/section
   - You should see all 12 functions listed

2. **Test Functions:**
   - `https://your-app.vercel.app/api/ping` - Should return "ok"
   - `https://your-app.vercel.app/api/test` - Should return JSON with message
   - `https://your-app.vercel.app/api/health` - Should return database health status

3. **Check Logs:**
   - Go to: Vercel Dashboard → Logs
   - Try using the application
   - You should see logs from the functions when they're called

## 🔧 Environment Variables Required

Make sure these are set in Vercel:
- `SUPABASE_URL` or `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_EMAILS`

## ✨ All Backend Functions Are Ready!

All 12 backend functions are properly configured and will be automatically deployed by Vercel.

