# ⚡ Quick Email Setup - Supabase

## ✅ Step-by-Step: Enable Email in Supabase

### 1. Go to Supabase Dashboard
**Direct Link:** https://supabase.com/dashboard/project/iotluyleerimuoioattt/auth/settings

Or navigate manually:
- Go to: https://supabase.com/dashboard
- Select project: `iotluyleerimuoioattt`
- Click **"Authentication"** in left sidebar
- Click **"Settings"**

### 2. Enable Email Settings

In the **"Email Auth"** section, make sure:

✅ **"Enable Email Signup"** is **ON**  
✅ **"Enable Email Invitations"** is **ON** (for approval emails)  
✅ **"Enable Email Confirmations"** is configured as needed

### 3. Save Settings
Click **"Save"** at the bottom of the page

### 4. Test Email

**Option A: Run Test Script**
```bash
npx tsx scripts/test-email.ts
```

**Option B: Test Manually**
1. Go to Admin Dashboard: `http://localhost:5173/admin`
2. Approve or reject a merchant application
3. Check the merchant's email inbox
4. They should receive an email from Supabase

---

## 📧 What Emails Are Sent

### Approval Email
- **When:** Admin approves merchant application
- **Method:** `supabase.auth.admin.inviteUserByEmail()`
- **Content:** Invitation email with login instructions
- **Sender:** `noreply@mail.app.supabase.io` (default)

### Rejection Email
- **When:** Admin rejects merchant application
- **Method:** `supabase.auth.admin.generateLink()` (magic link)
- **Content:** Notification email (user can't actually log in)
- **Sender:** `noreply@mail.app.supabase.io` (default)

---

## 🔍 Verify It's Working

### Check 1: Run Test Script
```bash
npx tsx scripts/test-email.ts
```

Expected output:
```
✅ Service key is valid
✅ Email invitation sent successfully!
✅ Magic link generated successfully!
✅ All email tests passed!
```

### Check 2: Check Supabase Logs
1. Go to: https://supabase.com/dashboard/project/iotluyleerimuoioattt/logs
2. Select **"Auth Logs"**
3. Look for email-related entries
4. Check for any errors

### Check 3: Test in Admin Dashboard
1. Log in as admin
2. Approve a test merchant application
3. Check the merchant's email inbox
4. Look for email from Supabase

---

## ❌ Troubleshooting

### "Email not enabled" Error
**Fix:** Go to Authentication → Settings → Enable Email Signup

### "Rate limit exceeded" Error
**Fix:** Wait a few minutes, or upgrade Supabase plan

### Emails Not Received
**Check:**
- Spam/Junk folder
- Email address is correct
- Supabase logs for errors
- Rate limits

---

## ✅ Checklist

- [ ] Email enabled in Supabase Dashboard
- [ ] Email invitations enabled
- [ ] Test script passes
- [ ] Approval email received
- [ ] Rejection email received
- [ ] No errors in Supabase logs

---

## 🎯 Quick Test

1. **Enable email** in Supabase Dashboard (see Step 1-3 above)
2. **Run test script:**
   ```bash
   npx tsx scripts/test-email.ts
   ```
3. **Test in app:**
   - Go to `/admin`
   - Approve/reject a merchant application
   - Check email inbox

**That's it!** 🎉

