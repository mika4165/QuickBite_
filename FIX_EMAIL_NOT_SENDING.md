# 🔧 Fix: Email Not Sending After Admin Approval

## What I Fixed

✅ **Improved email sending logic:**
- Checks if user exists before sending invitation
- Uses `generateLink` if user exists, `inviteUserByEmail` if they don't
- Better error handling and logging
- More detailed error messages

✅ **Better error messages:**
- Shows specific error in toast notifications
- Logs detailed errors to console
- Guides you to enable email in Supabase

---

## Most Common Issue: Email Not Enabled in Supabase

**90% of the time, emails don't send because email is not enabled in Supabase!**

### ✅ Fix: Enable Email in Supabase

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/iotluyleerimuoioattt/auth/settings

2. **Enable Email:**
   - Scroll to **"Email Auth"** section
   - Make sure **"Enable Email Signup"** is **ON** ✅
   - Make sure **"Enable Email Invitations"** is **ON** ✅

3. **Save Settings:**
   - Click **"Save"** at the bottom

4. **Test:**
   - Go to Admin Dashboard
   - Approve a merchant application
   - Check the merchant's email inbox

---

## How to Debug

### Step 1: Check Browser Console

1. Open Admin Dashboard
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Approve a merchant application
5. Look for messages starting with `[Email]` or `[Admin]`

**What to look for:**
- `[Email] Attempting to send approval email to: merchant@example.com`
- `[Email] Invitation sent successfully` ✅
- `[Email] Error sending approval email: ...` ❌

### Step 2: Check Server Logs

Look at your terminal where `npm run dev` is running. You should see:
- `[Email] Attempting to send approval email to: ...`
- `[Email] Invitation sent successfully` or error messages

### Step 3: Check Supabase Logs

1. Go to: https://supabase.com/dashboard/project/iotluyleerimuoioattt/logs
2. Select **"Auth Logs"**
3. Look for email-related entries
4. Check for errors

---

## Common Errors & Fixes

### ❌ "Email provider not configured"
**Fix:** Enable email in Supabase Dashboard → Authentication → Settings

### ❌ "Rate limit exceeded"
**Fix:** 
- Wait a few minutes
- Or upgrade your Supabase plan
- Free tier has email rate limits

### ❌ "User already exists"
**Fix:** This is now handled automatically - the code will use `generateLink` instead

### ❌ "Invalid email address"
**Fix:** Check that the merchant's email in the application form is valid

### ❌ "Email sending failed: [error message]"
**Fix:** 
- Check the specific error message
- Most likely: Email not enabled in Supabase
- Or: Rate limit exceeded

---

## Test Email Configuration

Run the test script to verify email is working:

```bash
npx tsx scripts/test-email.ts
```

This will:
- ✅ Test if service key works
- ✅ Test if email invitation works
- ✅ Test if magic link generation works
- ✅ Show specific error messages

---

## Step-by-Step Fix

### 1. Enable Email in Supabase (REQUIRED)

**Go to:** https://supabase.com/dashboard/project/iotluyleerimuoioattt/auth/settings

**Enable:**
- ✅ Enable Email Signup
- ✅ Enable Email Invitations

**Save**

### 2. Restart Your Dev Server

```bash
# Stop server (Ctrl+C)
npm run dev
```

### 3. Test Email

```bash
npx tsx scripts/test-email.ts
```

### 4. Test in Admin Dashboard

1. Go to `/admin`
2. Approve a merchant application
3. Check browser console (F12) for `[Email]` messages
4. Check merchant's email inbox
5. Check spam folder

---

## What the Code Does Now

**Improved Flow:**
1. Admin clicks "Approve"
2. Code checks if user exists in Supabase Auth
3. **If user exists:** Uses `generateLink()` to send magic link email
4. **If user doesn't exist:** Uses `inviteUserByEmail()` to send invitation
5. Logs detailed information to console
6. Shows specific error messages if it fails

**Better Error Handling:**
- Checks if user exists before inviting
- Tries fallback methods if one fails
- Logs everything to console
- Shows helpful error messages

---

## Quick Checklist

- [ ] Email enabled in Supabase Dashboard (Authentication → Settings)
- [ ] Email invitations enabled
- [ ] Restarted dev server
- [ ] Test script passes (`npx tsx scripts/test-email.ts`)
- [ ] Check browser console (F12) when approving
- [ ] Check server logs in terminal
- [ ] Check merchant's email inbox
- [ ] Check spam folder

---

## Still Not Working?

1. **Check browser console (F12)** - Look for `[Email]` or `[Admin]` messages
2. **Check server terminal** - Look for `[Email]` messages
3. **Run test script:** `npx tsx scripts/test-email.ts`
4. **Check Supabase logs:** Dashboard → Logs → Auth Logs
5. **Verify email is enabled:** Dashboard → Authentication → Settings

The most common issue is **email not enabled in Supabase Dashboard**! Make sure to enable it first.

