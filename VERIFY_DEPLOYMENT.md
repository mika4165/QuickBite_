# ✅ Verify All Backend Functions Are Deployed

## 📋 Complete Function List

All functions should be at `api/` root level:

1. ✅ `api/check-email-exists.ts`
2. ✅ `api/login-approved-staff.ts`
3. ✅ `api/confirm-admin.ts`
4. ✅ `api/submit-merchant-app.ts`
5. ✅ `api/provision-staff.ts`
6. ✅ `api/send-approval-email.ts`
7. ✅ `api/send-rejection-email.ts`
8. ✅ `api/revoke-staff-access.ts`
9. ✅ `api/delete-approved-staff.ts`
10. ✅ `api/ping.ts`
11. ✅ `api/health.ts`
12. ✅ `api/test.ts`

## 🔍 How to Verify Functions Are Deployed

### Step 1: Check Vercel Dashboard

1. Go to: **Vercel Dashboard** → **Your Project** → **Deployments**
2. Click on the **latest deployment**
3. Look for a **"Functions"** tab or section
4. You should see all 12 functions listed

### Step 2: Test Functions Directly

After deployment, test each function:

1. **`/api/ping`**
   - URL: `https://your-app.vercel.app/api/ping`
   - Should return: `ok`

2. **`/api/test`**
   - URL: `https://your-app.vercel.app/api/test`
   - Should return: `{"message": "Test function works!", "method": "GET"}`

3. **`/api/health`**
   - URL: `https://your-app.vercel.app/api/health`
   - Should return: `{"ok": true, "missing": []}`

4. **`/api/check-email-exists`**
   - URL: `https://your-app.vercel.app/api/check-email-exists?email=test@example.com`
   - Should return: JSON with `{"exists": false}`

### Step 3: Check Logs

1. Go to: **Vercel Dashboard** → **Logs**
2. Try using the application (register, login, etc.)
3. You should see logs from the functions when they're called
4. If you see 404 errors, the function isn't deployed yet

## ⚠️ If Functions Are Not Deployed

### Common Issues:

1. **Functions not detected:**
   - Make sure functions are at `api/` root (not in subdirectories)
   - Make sure functions have `export default async function handler`

2. **Build errors:**
   - Check Vercel build logs for TypeScript errors
   - Make sure all dependencies are in `package.json`

3. **Deployment not triggered:**
   - Make sure all changes are committed and pushed to GitHub
   - Vercel should auto-deploy on push

### Solution:

1. **Wait for deployment to complete** (check Vercel Dashboard)
2. **Redeploy manually** if needed:
   - Go to Vercel Dashboard → Deployments
   - Click "Redeploy" on the latest deployment
3. **Check build logs** for any errors

## 🔧 Troubleshooting

If a specific function doesn't work:

1. **Check if it's in the Functions list** (Vercel Dashboard)
2. **Test it directly** using the URL
3. **Check logs** for error messages
4. **Verify environment variables** are set correctly

## ✅ All Functions Should Be Deployed

All 12 functions are properly configured and should be automatically deployed by Vercel.

