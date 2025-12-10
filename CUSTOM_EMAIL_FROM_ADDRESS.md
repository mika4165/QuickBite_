# 📧 Configure Custom "From" Email Address in Supabase

## Goal
Send approval/rejection emails **TO** the merchant's email (from their application form) **FROM** a custom email address (like `noreply@quickbite.com` or `support@quickbite.com`).

## Solution: Configure Custom SMTP in Supabase

Since Supabase's default email always sends from `noreply@mail.app.supabase.io`, we need to configure **custom SMTP** to use your own email address.

---

## Step 1: Get SMTP Credentials

You'll need SMTP credentials from an email provider. Options:

### Option A: Gmail SMTP (Free)
1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "QuickBite" as the name
   - Copy the 16-character password

**Gmail SMTP Settings:**
```
Host: smtp.gmail.com
Port: 587
Username: your-email@gmail.com
Password: (your app password)
```

### Option B: Outlook/Hotmail SMTP (Free)
**Outlook SMTP Settings:**
```
Host: smtp-mail.outlook.com
Port: 587
Username: your-email@outlook.com
Password: (your password)
```

### Option C: Custom Domain Email (Recommended for Production)
If you have your own domain (e.g., `quickbite.com`), use your domain's email:
- Contact your domain/hosting provider for SMTP settings
- Usually: `smtp.yourdomain.com` or `mail.yourdomain.com`

---

## Step 2: Configure SMTP in Supabase

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/iotluyleerimuoioattt
   - Click **"Settings"** (gear icon) in left sidebar
   - Click **"Auth"** in the settings menu

2. **Configure SMTP:**
   - Scroll to **"SMTP Settings"** section
   - Enable **"Enable Custom SMTP"**
   - Fill in the SMTP details:
     - **Sender email:** `noreply@quickbite.com` (or your email)
     - **Sender name:** `QuickBite` (optional)
     - **Host:** `smtp.gmail.com` (or your SMTP host)
     - **Port:** `587` (or `465` for SSL)
     - **Username:** Your email address
     - **Password:** Your SMTP password (or app password)
     - **Secure:** Enable if using port 465

3. **Test SMTP:**
   - Click **"Send test email"**
   - Enter a test email address
   - Check if you receive the test email

4. **Save Settings:**
   - Click **"Save"**

---

## Step 3: Update Email Templates (Optional)

1. **Go to Email Templates:**
   - Click **"Authentication"** → **"Email Templates"**

2. **Customize Templates:**
   - **Invite User** template (for approval emails)
   - **Magic Link** template (for rejection emails)

3. **Add Custom Variables:**
   You can use variables like:
   - `{{ .Email }}` - Recipient email
   - `{{ .SiteURL }}` - Your site URL
   - `{{ .Token }}` - Invitation token
   - Custom data from your application

---

## Step 4: Verify It Works

### Test 1: Check SMTP Configuration
1. Go to Supabase Dashboard → Settings → Auth → SMTP Settings
2. Click "Send test email"
3. Check your inbox for the test email
4. Verify the "From" address is your custom email

### Test 2: Test in Your App
1. Go to Admin Dashboard (`/admin`)
2. Approve or reject a merchant application
3. Check the merchant's email inbox
4. Verify:
   - ✅ Email is received
   - ✅ "From" address is your custom email (e.g., `noreply@quickbite.com`)
   - ✅ "To" address is the merchant's email from the form

---

## How It Works

**Current Flow:**
```
Admin approves/rejects
  → Code gets merchant email from application form
  → Code calls Supabase inviteUserByEmail() or generateLink()
  → Supabase sends email using configured SMTP
  → Email sent FROM: your-custom-email@domain.com
  → Email sent TO: merchant-email@example.com (from form)
```

**The merchant's email from the form is automatically used as the recipient** - this is already working in your code!

---

## Code Already Handles This

Your code already:
- ✅ Gets the email from the merchant application form
- ✅ Sends email to that email address
- ✅ Includes store name and custom message

**What you need to do:**
- ✅ Configure SMTP in Supabase Dashboard
- ✅ Set custom "From" address in SMTP settings

---

## Example: Gmail Setup

1. **Enable 2FA and get App Password** (see Step 1)

2. **Configure in Supabase:**
   ```
   Sender email: quickbite.notifications@gmail.com
   Sender name: QuickBite
   Host: smtp.gmail.com
   Port: 587
   Username: quickbite.notifications@gmail.com
   Password: [your 16-character app password]
   Secure: No (port 587 uses STARTTLS)
   ```

3. **Test:**
   - Send test email from Supabase
   - Verify it comes from `quickbite.notifications@gmail.com`

---

## Troubleshooting

### ❌ "SMTP authentication failed"
**Solution:**
- Check username and password are correct
- For Gmail, make sure you're using an App Password, not your regular password
- Enable "Less secure app access" if using older email providers

### ❌ "Connection timeout"
**Solution:**
- Check SMTP host and port are correct
- Try port 465 with SSL enabled
- Check firewall settings

### ❌ Emails still from Supabase default
**Solution:**
- Make sure "Enable Custom SMTP" is ON
- Save settings and wait a few minutes
- Test with "Send test email" button

### ❌ Emails not received
**Solution:**
- Check spam folder
- Verify recipient email is correct
- Check Supabase logs for errors
- Test SMTP with "Send test email" first

---

## Quick Checklist

- [ ] Get SMTP credentials (Gmail, Outlook, or custom domain)
- [ ] Configure SMTP in Supabase Dashboard
- [ ] Set custom "From" email address
- [ ] Test SMTP with "Send test email"
- [ ] Customize email templates (optional)
- [ ] Test approval email in your app
- [ ] Test rejection email in your app
- [ ] Verify emails come from your custom address

---

## Summary

**To send emails from a custom address:**
1. Configure SMTP in Supabase Dashboard
2. Set your custom "From" email address
3. Emails will automatically go TO the merchant's email from the form
4. Emails will come FROM your custom email address

**The merchant's email from the application form is already being used automatically!** You just need to configure the "From" address via SMTP.

