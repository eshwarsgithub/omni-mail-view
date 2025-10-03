# 🔐 Gmail OAuth Setup - Complete Guide

## ✅ Credentials Received

Your Gmail OAuth credentials have been configured:

```
Client ID: 219592067381-d1vme5n7jur8ueiecghetk8bqk8808a5.apps.googleusercontent.com
Client Secret: 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
```

## 📝 What's Already Done

✅ Client ID added to `.env` file
✅ Frontend will now use real OAuth flow
✅ Dev server restarted with new config

## 🚀 Next Steps to Enable Gmail Integration

### Step 1: Add Redirect URIs in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID
5. Click the edit icon (pencil)
6. Under **Authorized redirect URIs**, add these **exact URLs**:

   **For Local Development:**
   ```
   http://localhost:8080/auth/callback/gmail
   ```

   **For Production** (add when you deploy):
   ```
   https://your-domain.vercel.app/auth/callback/gmail
   ```

7. Click **"Save"**

⚠️ **IMPORTANT**: The redirect URI must match EXACTLY (including http/https and trailing slashes)

### Step 2: Deploy Edge Functions to Supabase

You need to deploy the backend functions that handle OAuth:

#### Install Supabase CLI

```bash
npm install -g supabase
```

#### Login to Supabase

```bash
supabase login
```

This will open a browser window for authentication.

#### Link Your Project

```bash
supabase link --project-ref tbockdhgvyyajsvpsogr
```

You may be asked for your database password (the one you set when creating the Supabase project).

#### Set Supabase Secrets

These credentials are stored server-side only for security:

```bash
# Gmail credentials
supabase secrets set GMAIL_CLIENT_ID="219592067381-d1vme5n7jur8ueiecghetk8bqk8808a5.apps.googleusercontent.com"
supabase secrets set GMAIL_CLIENT_SECRET="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"
supabase secrets set GMAIL_REDIRECT_URI="http://localhost:8080/auth/callback/gmail"
```

#### Deploy Edge Functions

```bash
cd /Users/eshwar/Desktop/omni-mail-view-main

# Deploy Gmail OAuth handler
supabase functions deploy gmail-oauth

# Deploy email sync function
supabase functions deploy sync-emails

# Deploy send email function
supabase functions deploy send-email
```

### Step 3: Apply Database Schema

If you haven't already applied the database schema:

```bash
supabase db push
```

Or manually via Supabase Dashboard:
1. Go to Supabase Dashboard → **SQL Editor**
2. Copy contents of `supabase/migrations/20251003185349_63aa6811-272d-4cfc-8118-6019e252a744.sql`
3. Paste and run

### Step 4: Test Gmail OAuth Flow

1. **Restart your dev server** (already done automatically)
2. Open http://localhost:8080/
3. Sign in with your test account
4. Click **"+ Add Account"** or **"Add Account"** button
5. Click **"Gmail"**
6. You should be redirected to Google's OAuth page
7. Select your Gmail account
8. Grant permissions
9. You'll be redirected back to your app
10. Your Gmail account should appear in the sidebar
11. Wait 30-60 seconds for initial email sync
12. Refresh the page - your emails should appear! 📧

## 🔧 Troubleshooting

### Error: "redirect_uri_mismatch"

**Problem**: The redirect URI in your code doesn't match what's configured in Google Cloud Console.

**Solution**:
1. Check the error message for the exact redirect URI it's trying to use
2. Go to Google Cloud Console → Credentials
3. Add that EXACT URI to "Authorized redirect URIs"
4. Wait 5 minutes for changes to propagate
5. Try again

### Error: "invalid_client"

**Problem**: Client ID or Secret is wrong.

**Solution**:
1. Double-check the credentials in Google Cloud Console
2. Verify they match in both:
   - `.env` file (Client ID only)
   - Supabase secrets (both Client ID and Secret)
3. Redeploy edge functions if you changed secrets

### Error: "Access blocked: This app's request is invalid"

**Problem**: OAuth scopes are not configured correctly.

**Solution**:
1. Go to Google Cloud Console → **OAuth consent screen**
2. Verify these scopes are added:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
3. Save and try again

### No Emails Appearing After Connection

**Problem**: Emails aren't syncing.

**Solution**:
1. Check Supabase Dashboard → **Edge Functions** → **Logs**
2. Look for the `sync-emails` function
3. Check for errors
4. Verify in Database → `mail_accounts` table:
   - Check `sync_status` column (should be 'success')
   - Check `error_message` for any issues
5. Manually trigger sync by calling the edge function

### App Shows "OAuth not configured"

**Problem**: `.env` file not loaded properly.

**Solution**:
1. Verify `.env` file has `VITE_GMAIL_CLIENT_ID` set
2. Restart dev server:
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

## 📊 Verify Everything is Working

### Check 1: Frontend Config

Open browser console on http://localhost:8080/ and type:
```javascript
console.log(import.meta.env.VITE_GMAIL_CLIENT_ID)
```

Should show: `219592067381-d1vme5n7jur8ueiecghetk8bqk8808a5.apps.googleusercontent.com`

### Check 2: Database

In Supabase Dashboard → **Database** → **mail_accounts**:
- After connecting Gmail, you should see a row with `provider = 'gmail'`
- `sync_status` should change from 'pending' → 'syncing' → 'success'

### Check 3: Messages

In Supabase Dashboard → **Database** → **messages**:
- After sync completes, you should see your Gmail messages
- Each message has `account_id` linking to your mail account

### Check 4: Edge Function Logs

In Supabase Dashboard → **Edge Functions** → Select function → **Logs**:
- Should see successful invocations
- No error messages

## 🎯 What Happens When You Connect Gmail

1. **Click "Gmail"** → Redirects to Google OAuth
2. **User grants permissions** → Google redirects back with authorization code
3. **OAuthCallback page** → Shows "Connecting Account..." loading state
4. **Edge Function `gmail-oauth`**:
   - Exchanges code for access & refresh tokens
   - Gets user info from Gmail API
   - Creates `mail_accounts` record
   - Stores encrypted tokens in `oauth_tokens` table
   - Triggers initial sync
5. **Edge Function `sync-emails`**:
   - Fetches last 50 emails from Gmail API
   - Parses email data
   - Inserts into `messages` table
6. **Real-time Update** → Frontend receives new messages via Supabase subscription
7. **UI Updates** → Messages appear in message list

## 🔐 Security Notes

- ✅ Client Secret is NEVER exposed to frontend
- ✅ OAuth tokens stored server-side only
- ✅ Database has Row Level Security (RLS)
- ✅ Each user can only see their own data
- ✅ Refresh tokens used for automatic renewal

## 📱 Production Deployment

When you're ready to deploy:

1. **Update Redirect URI**:
   ```bash
   # Set production redirect URI
   supabase secrets set GMAIL_REDIRECT_URI="https://your-domain.vercel.app/auth/callback/gmail"
   ```

2. **Add to Google Cloud Console**:
   - Add production URL to Authorized redirect URIs
   - Publish OAuth consent screen (if needed)

3. **Deploy to Vercel/Netlify**:
   - Add `VITE_GMAIL_CLIENT_ID` to environment variables
   - Deploy!

## ✅ Summary Checklist

- [ ] Added redirect URIs in Google Cloud Console
- [ ] Installed Supabase CLI
- [ ] Linked to Supabase project
- [ ] Set Supabase secrets (Client ID, Secret, Redirect URI)
- [ ] Deployed edge functions (gmail-oauth, sync-emails, send-email)
- [ ] Applied database schema
- [ ] Tested OAuth flow successfully
- [ ] Verified emails are syncing
- [ ] Checked edge function logs for errors

## 🎉 Success!

Once everything is working, you'll be able to:
- ✅ Connect multiple Gmail accounts
- ✅ Read all your Gmail emails in one place
- ✅ Compose and send emails
- ✅ Reply to emails
- ✅ Star/Archive/Delete emails
- ✅ Search across all messages
- ✅ Real-time sync of new emails

---

**Need Help?**
- Check Supabase Edge Function logs
- Review browser console for errors
- Verify database records in Supabase Dashboard
- Check this guide's troubleshooting section
