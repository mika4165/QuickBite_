# ⚡ Quick Setup: Custom Email "From" Address

## ✅ Good News!

Your code **already automatically sends emails TO the merchant's email address** from their application form! 

**What you need to do:** Just configure a custom "From" address in Supabase.

---

## 🎯 What Happens Now

**Current Flow:**
1. Merchant fills out application form with their email (e.g., `merchant@gmail.com`)
2. Admin approves/rejects the application
3. Code automatically gets the email from the form: `app.email`
4. Code sends email **TO** that email address
5. Email comes **FROM** Supabase's default: `noreply@mail.app.supabase.io`

**What You Want:**
- Email still goes **TO** merchant's email (already working ✅)
- Email comes **FROM** your custom address (e.g., `noreply@quickbite.com`)

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Get SMTP Credentials

**Option A: Use Gmail (Easiest)**
1. Create a Gmail account for QuickBite (e.g., `quickbite.notifications@gmail.com`)
2. Enable 2-Factor Authentication
3. Generate App Password:
   - Go to: https://myaccount.google.com/apppasswords
   - Create app password for "Mail"
   - Copy the 16-character password

**Option B: Use Your Domain Email**
- If you have a domain, use your domain's email SMTP settings

### Step 2: Configure in Supabase

1. **Go to:** https://supabase.com/dashboard/project/iotluyleerimuoioattt/settings/auth

2. **Scroll to "SMTP Settings"**

3. **Enable and Configure:**
   ```
   ✅ Enable Custom SMTP: ON
   
   Sender email: quickbite.notifications@gmail.com (or your email)
   Sender name: QuickBite
   Host: smtp.gmail.com
   Port: 587
   Username: quickbite.notifications@gmail.com
   Password: [your 16-character app password]
   Secure: No (for port 587)
   ```

4. **Test:**
   - Click "Send test email"
   - Enter your email address
   - Check inbox - should come from your custom address

5. **Save**

### Step 3: Test in Your App

1. Go to Admin Dashboard (`/admin`)
2. Approve a merchant application
3. Check the merchant's email inbox
4. Email should:
   - ✅ Come FROM: `quickbite.notifications@gmail.com` (your custom address)
   - ✅ Go TO: `merchant@gmail.com` (their email from the form)

---

## 📧 How It Works

**Your Code (Already Working):**
```typescript
// Gets email from merchant application form
const { email, storeName } = JSON.parse(raw || "{}");
// email = "merchant@gmail.com" (from the form)

// Sends email TO that address
await supabase.auth.admin.inviteUserByEmail(email, {
  data: { storeName, message: "..." }
});
```

**Supabase SMTP (What You Configure):**
- Uses your custom "From" address
- Sends email TO the address you specify (which is the merchant's email)

**Result:**
- **From:** `quickbite.notifications@gmail.com` (your custom SMTP)
- **To:** `merchant@gmail.com` (automatically from the form)

---

## ✅ Checklist

- [ ] Get SMTP credentials (Gmail app password or domain SMTP)
- [ ] Configure SMTP in Supabase Dashboard
- [ ] Set custom "From" email address
- [ ] Test SMTP with "Send test email"
- [ ] Test approval email in your app
- [ ] Verify email comes from your custom address
- [ ] Verify email goes to merchant's email from form

---

## 🎉 That's It!

Once you configure SMTP in Supabase:
- ✅ Emails automatically go TO the merchant's email from the form
- ✅ Emails come FROM your custom email address
- ✅ No code changes needed!

**The merchant's email from the application form is already being used automatically!** 🚀

