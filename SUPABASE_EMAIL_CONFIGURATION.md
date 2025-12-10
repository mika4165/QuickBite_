# 📧 Supabase Email Configuration Guide

## Step 1: Enable Email in Supabase Dashboard

### Via Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project: `iotluyleerimuoioattt`

2. **Navigate to Authentication Settings:**
   - Click **"Authentication"** in the left sidebar
   - Click **"Settings"** (or go to Authentication → Settings)

3. **Enable Email:**
   - Scroll to **"Email Auth"** section
   - Make sure **"Enable Email Signup"** is **ON** ✅
   - Make sure **"Enable Email Confirmations"** is configured as needed
   - For invitations, make sure **"Enable Email Invitations"** is **ON** ✅

4. **Configure Email Provider (if needed):**
   - By default, Supabase uses its own email service
   - For production, you can configure custom SMTP:
     - Go to **Settings** → **Auth** → **SMTP Settings**
     - Add your SMTP credentials (optional, not required)

5. **Save Settings:**
   - Click **"Save"** at the bottom of the page

---

## Step 2: Verify Email Templates

1. **Go to Email Templates:**
   - Click **"Authentication"** → **"Email Templates"**

2. **Check Templates:**
   - **Invite User** - Used for approval emails
   - **Magic Link** - Used for rejection emails (fallback)
   - **Confirm Signup** - For new user confirmations

3. **Customize Templates (Optional):**
   - You can customize the email templates
   - Add your branding, colors, etc.
   - Use variables like `{{ .Email }}`, `{{ .SiteURL }}`, etc.

---

## Step 3: Test Email Functionality

### Test 1: Check Email Settings via API

Run this in your terminal to verify email is enabled:

```bash
# Check if email is working
curl -X GET "https://iotluyleerimuoioattt.supabase.co/auth/v1/settings" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_KEY"
```

### Test 2: Test Email Sending

1. **Go to Admin Dashboard:**
   - Visit: `http://localhost:5173/admin` (or your dev URL)
   - Log in as admin

2. **Create a Test Merchant Application:**
   - Use a test email you can access
   - Submit a merchant application

3. **Approve the Application:**
   - Click **"Approve"** on the test application
   - Check the test email inbox
   - You should receive an invitation email from Supabase

4. **Test Rejection:**
   - Create another test application
   - Click **"Reject"**
   - Check the test email inbox
   - You should receive a notification (via magic link)

---

## Step 4: Verify Email Delivery

### Check Supabase Logs

1. **Go to Supabase Dashboard:**
   - Click **"Logs"** in the left sidebar
   - Select **"Auth Logs"**
   - Look for email-related entries

2. **Check for Errors:**
   - Look for any email sending errors
   - Common issues:
     - Rate limits exceeded
     - Invalid email addresses
     - SMTP configuration errors

### Check Email Inbox

1. **Check Inbox:**
   - Look for emails from `noreply@mail.app.supabase.io` (default Supabase sender)
   - Check **Spam/Junk** folder if not in inbox

2. **Verify Email Content:**
   - Approval emails should contain invitation link
   - Rejection emails should contain magic link (though login will be blocked)

---

## Troubleshooting

### ❌ Emails Not Sending

**Check:**
1. Is email enabled in Authentication → Settings?
2. Are there any errors in Auth Logs?
3. Is the email address valid?
4. Check spam folder

**Solution:**
- Enable email in Supabase Dashboard
- Check rate limits (free tier has limits)
- Verify email addresses are correct

### ❌ "Rate limit exceeded"

**Solution:**
- Supabase free tier has email rate limits
- Wait a few minutes and try again
- Consider upgrading plan for higher limits
- Or implement email queuing

### ❌ "Email provider not configured"

**Solution:**
- By default, Supabase uses its own email service
- No additional configuration needed
- If you see this error, check Authentication → Settings

### ❌ Emails Going to Spam

**Solution:**
- This is normal for Supabase's default email service
- For production, configure custom SMTP with your domain
- Or use a dedicated email service (like Resend, SendGrid)

---

## Current Configuration Status

To check your current email configuration, I'll create a test script that verifies:
- ✅ Email is enabled
- ✅ Service key is configured
- ✅ Email sending works

---

## Next Steps

1. ✅ Enable email in Supabase Dashboard
2. ✅ Test approval email
3. ✅ Test rejection email
4. ✅ Check email delivery
5. ✅ Customize email templates (optional)

---

## Quick Checklist

- [ ] Email enabled in Authentication → Settings
- [ ] Email invitations enabled
- [ ] Test approval email sent successfully
- [ ] Test rejection email sent successfully
- [ ] Emails received in inbox (check spam too)
- [ ] No errors in Auth Logs

---

## Notes

- **Default Sender:** Supabase emails come from `noreply@mail.app.supabase.io`
- **Rate Limits:** Free tier has email rate limits
- **Customization:** You can customize email templates in Dashboard
- **SMTP:** Optional - only needed for custom domain emails

