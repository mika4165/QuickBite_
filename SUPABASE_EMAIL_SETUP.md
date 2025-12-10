# ✅ Email Setup - Using Supabase (No Resend Required)

## What Changed

✅ **Removed Resend dependency**  
✅ **Now using Supabase's built-in email system**  
✅ **No external email service needed**

## How It Works Now

### Approval Emails
- Uses `supabase.auth.admin.inviteUserByEmail()`
- Sends an invitation email to the merchant
- Includes store name and approval message in metadata
- Merchant receives email with login instructions

### Rejection Emails
- Uses `supabase.auth.admin.generateLink()` with rejection metadata
- Sends a magic link email (though they can't actually log in)
- Includes rejection reason in metadata
- Email notifies them of rejection

## Configuration

**No Resend configuration needed!**

You only need your Supabase credentials (which you already have):
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
```

## Supabase Email Setup

Make sure email is enabled in your Supabase project:

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Check Email Settings:**
   - Go to **Authentication** → **Email Templates**
   - Make sure email is enabled
   - Configure email templates if needed

3. **Email Provider:**
   - Supabase uses its own email service by default
   - Works out of the box for most use cases
   - No additional setup required

## Benefits

✅ **No external service needed** - Everything through Supabase  
✅ **No API keys to manage** - Uses your existing Supabase keys  
✅ **Simpler setup** - One less service to configure  
✅ **Integrated** - Works seamlessly with Supabase Auth  

## Testing

1. **Go to Admin Dashboard** (`/admin`)
2. **Approve or reject** a merchant application
3. **Check the merchant's email inbox**
4. **They should receive an email from Supabase**

## Email Templates

Supabase uses its default email templates. You can customize them in:
- **Supabase Dashboard** → **Authentication** → **Email Templates**

## Troubleshooting

### ❌ Emails Not Sending
**Check:**
1. Is email enabled in Supabase? (Authentication → Settings)
2. Check Supabase logs for email errors
3. Verify SUPABASE_SERVICE_KEY is correct
4. Check spam folder

### ❌ "Email rate limit exceeded"
**Solution:**
- Supabase has rate limits on free tier
- Consider upgrading plan if sending many emails
- Or implement email queuing

### ❌ Custom Email Templates
**Solution:**
- Go to Supabase Dashboard → Authentication → Email Templates
- Customize the templates there
- Changes apply to all emails sent through Supabase

---

## Summary

**Before:** Required Resend API key and domain verification  
**Now:** Uses Supabase's built-in email - no additional setup needed!

Just make sure your Supabase project has email enabled, and you're good to go! 🚀

