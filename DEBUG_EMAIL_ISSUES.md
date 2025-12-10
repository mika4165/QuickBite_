# 🔍 Debug: Email Not Sending - Step by Step

## The Error You're Seeing

The error in your console:
```
Uncaught (in promise) Error: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received
```

**This is NOT from our code!** This is usually from:
- Browser extensions (ad blockers, password managers, etc.)
- Chrome DevTools extensions
- Other browser add-ons

**Ignore this error** - it's not related to email sending.

---

## How to Check if Email is Actually Being Sent

### Step 1: Check Network Tab

1. **Open Developer Tools (F12)**
2. **Go to "Network" tab**
3. **Clear the network log** (click the 🚫 icon)
4. **Approve a merchant application**
5. **Look for these requests:**
   - `__internal/send-approval-email` - This should appear
   - Check its status:
     - ✅ **200** = Email sent successfully
     - ❌ **400/500** = Error occurred

### Step 2: Check Console Tab (Filter for Our Messages)

1. **Open Developer Tools (F12)**
2. **Go to "Console" tab**
3. **Type in the filter box:** `[Email]` or `[Admin]`
4. **Approve a merchant application**
5. **Look for:**
   - `[Admin] Sending approval email to: merchant@example.com`
   - `[Email] Attempting to send approval email to: ...`
   - `[Email] Invitation sent successfully` ✅
   - `[Email] Error sending approval email: ...` ❌

### Step 3: Check Server Terminal

Look at your terminal where `npm run dev` is running. You should see:
```
[Email] Attempting to send approval email to: merchant@example.com
[Email] Invitation sent successfully
```

Or if there's an error:
```
[Email] Error sending approval email: [error message]
```

---

## Common Issues & Solutions

### Issue 1: No `[Email]` messages in console
**Problem:** Email endpoint not being called
**Solution:** 
- Check Network tab - is `__internal/send-approval-email` being called?
- Check if there are JavaScript errors preventing the code from running

### Issue 2: `[Email]` messages show error
**Problem:** Email sending is failing
**Solution:**
- Check the specific error message
- Most common: "Email provider not configured" → Enable email in Supabase
- Or: "Rate limit exceeded" → Wait a few minutes

### Issue 3: Email sent but not received
**Problem:** Email is being sent but not delivered
**Solution:**
- Check spam/junk folder
- Verify email address is correct
- Check Supabase logs: Dashboard → Logs → Auth Logs

### Issue 4: Network request shows 500 error
**Problem:** Server-side error
**Solution:**
- Check server terminal for error messages
- Check if SUPABASE_SERVICE_KEY is correct
- Check if email is enabled in Supabase

---

## Quick Test Checklist

1. **Open Developer Tools (F12)**
2. **Go to Network tab**
3. **Clear network log**
4. **Approve a merchant application**
5. **Check:**
   - [ ] Is `__internal/send-approval-email` in the network list?
   - [ ] What's the status code? (200 = success, 400/500 = error)
   - [ ] Click on the request → Response tab → What does it say?

6. **Go to Console tab**
7. **Filter by:** `[Email]` or `[Admin]`
8. **Check:**
   - [ ] Do you see `[Admin] Sending approval email to: ...`?
   - [ ] Do you see `[Email] Attempting to send approval email to: ...`?
   - [ ] Do you see success or error messages?

9. **Check Server Terminal:**
   - [ ] Do you see `[Email]` log messages?
   - [ ] Are there any error messages?

---

## What to Look For

### ✅ Success Indicators:
- Network request: `__internal/send-approval-email` with status **200**
- Console: `[Email] Invitation sent successfully`
- Server: `[Email] Invitation sent successfully`
- Toast: "Application approved and notification email sent to merchant"

### ❌ Error Indicators:
- Network request: `__internal/send-approval-email` with status **400/500**
- Console: `[Email] Error sending approval email: ...`
- Server: Error messages in terminal
- Toast: "Application approved, but email failed: ..."

---

## Still Not Working?

1. **Check Network tab** - Is the request being made?
2. **Check Console tab** - Filter by `[Email]` or `[Admin]`
3. **Check Server terminal** - Look for `[Email]` messages
4. **Check Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard/project/iotluyleerimuoioattt/logs
   - Select "Auth Logs"
   - Look for email-related entries

5. **Run test script:**
   ```bash
   npx tsx scripts/test-email.ts
   ```
   - If this passes, email is working
   - If this fails, email is not enabled in Supabase

---

## The Error You're Seeing is NOT the Problem

The error:
```
Uncaught (in promise) Error: A listener indicated an asynchronous response...
```

**This is from a browser extension, not our code!**

**To verify email is working:**
1. Check Network tab for `__internal/send-approval-email` request
2. Check Console tab filtered by `[Email]` or `[Admin]`
3. Check server terminal for `[Email]` messages

Ignore the browser extension error - focus on the Network and Console tabs to see what's actually happening with email sending.

