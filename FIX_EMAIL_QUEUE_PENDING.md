# 🔧 Fix: Email Queue Stuck in "Pending" Status

## The Problem

You have an `email_queue` table with emails stuck in "pending" status. This means:
- ✅ Emails are being **queued** (written to the database)
- ❌ Emails are **NOT being sent** (status stays "pending")

## Why This Is Happening

**Our current code doesn't use the `email_queue` table!**

Our code uses Supabase's built-in email functions:
- `supabase.auth.admin.inviteUserByEmail()` - Sends emails directly
- `supabase.auth.admin.generateLink()` - Sends emails directly

These functions send emails **immediately** through Supabase's email service, not through a queue.

## Two Possible Scenarios

### Scenario 1: Supabase Internal Queue
Supabase might be using an internal `email_queue` table to manage emails. If emails are stuck in "pending", it means:
- Email is not enabled in Supabase
- Or there's a rate limit issue
- Or there's a configuration problem

### Scenario 2: Custom Email Queue System
If you or someone else set up a custom `email_queue` table, you need:
- A database trigger to process emails
- Or an Edge Function to send emails
- Or a background job to process the queue

## Solution: Check What's Actually Happening

### Step 1: Check if Emails Are Being Sent Directly

Our code sends emails **directly** through Supabase Auth, not through the queue. Check:

1. **Go to Admin Dashboard**
2. **Approve a merchant application**
3. **Check browser console (F12)** - Look for `[Email]` messages
4. **Check server terminal** - Look for `[Email]` messages
5. **Check if merchant receives email** - Even if queue shows "pending"

### Step 2: Check Supabase Auth Logs

1. Go to: https://supabase.com/dashboard/project/iotluyleerimuoioattt/logs
2. Select **"Auth Logs"**
3. Look for email-related entries
4. Check if emails are being sent

### Step 3: Enable Email in Supabase (If Not Enabled)

If emails are stuck in queue, it might be because email is not enabled:

1. Go to: https://supabase.com/dashboard/project/iotluyleerimuoioattt/auth/settings
2. Enable:
   - ✅ "Enable Email Signup"
   - ✅ "Enable Email Invitations"
3. Save

## Quick Fix: Process Pending Emails

If you want to manually process pending emails, you can:

### Option 1: Delete the Queue Table (If Not Needed)

If the `email_queue` table is not being used by our code, you can:
- Delete the table (if it's not needed)
- Or ignore it (our code doesn't use it)

### Option 2: Create a Function to Process Queue

If you want to use the queue system, you need to create a function that:
1. Reads emails from `email_queue` where `status = 'pending'`
2. Sends them using Supabase Auth or SMTP
3. Updates status to 'sent' or 'failed'

## Recommended Solution

**Since our code sends emails directly through Supabase Auth, you should:**

1. **Ignore the `email_queue` table** - Our code doesn't use it
2. **Check if emails are actually being sent:**
   - Check browser console for `[Email]` messages
   - Check if merchants receive emails
   - Check Supabase Auth logs

3. **If emails are NOT being sent:**
   - Enable email in Supabase Dashboard
   - Check browser console for errors
   - Check server terminal for errors

## Test: Are Emails Actually Being Sent?

1. **Approve a merchant application**
2. **Check browser console (F12)** - Filter by `[Email]` or `[Admin]`
3. **Look for:**
   - `[Email] Attempting to send approval email to: ...`
   - `[Email] Invitation sent successfully` ✅
   - Or error messages ❌

4. **Check if merchant receives email** - Even if queue shows "pending"

## Summary

**The `email_queue` table with "pending" status is likely:**
- A Supabase internal queue (if emails are being sent, ignore it)
- Or a custom queue that needs processing (if emails are NOT being sent)

**Our code sends emails directly, so:**
- Check if emails are actually being received
- Check browser console and server logs
- Enable email in Supabase if not enabled

**If merchants ARE receiving emails despite "pending" status:**
- The queue is just a log/backup
- You can ignore it or delete it

**If merchants are NOT receiving emails:**
- Enable email in Supabase Dashboard
- Check for errors in console/logs
- The queue might be a fallback that's not working

