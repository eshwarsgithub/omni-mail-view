# 🚀 Production Deployment Guide

## Overview

This guide will help you deploy the Unified Mail application to production with real Gmail and Outlook integration.

## ⚡ Quick Setup Checklist

- [ ] Install dependencies (`npm install`)
- [ ] Create Supabase project
- [ ] Apply database migrations
- [ ] Deploy Supabase Edge Functions
- [ ] Set up Gmail OAuth credentials
- [ ] Set up Outlook OAuth credentials
- [ ] Configure environment variables
- [ ] Deploy frontend to Vercel/Netlify
- [ ] Test OAuth flows
- [ ] Monitor email sync

## 📦 Step 1: Install Dependencies

```bash
cd omni-mail-view-main
npm install
```

This will install all required packages including:
- React, TypeScript, Vite
- Tailwind CSS, shadcn/ui components
- Supabase client
- All other dependencies

## 🗄️ Step 2: Supabase Setup

### Create Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and project name: `unified-mail`
4. Set a secure database password
5. Select region closest to your users
6. Wait 2-3 minutes for provisioning

### Get Credentials

From your Supabase dashboard:

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Project Reference ID** → `VITE_SUPABASE_PROJECT_ID`
   - **anon public key** → `VITE_SUPABASE_PUBLISHABLE_KEY`
   - **service_role secret** (keep secure!) → For Edge Functions only

### Apply Database Migration

**Option A: Using Supabase CLI**

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Push database schema
supabase db push
```

**Option B: Via Dashboard**

1. Open Supabase Dashboard → **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase/migrations/20251003185349_63aa6811-272d-4cfc-8118-6019e252a744.sql`
4. Paste and click "Run"
5. Verify no errors

### Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy gmail-oauth
supabase functions deploy outlook-oauth
supabase functions deploy sync-emails
supabase functions deploy send-email
```

### Set Supabase Secrets

These are server-side only and never exposed to clients:

```bash
# Set Gmail credentials (get from Step 3)
supabase secrets set GMAIL_CLIENT_ID=your-gmail-client-id.apps.googleusercontent.com
supabase secrets set GMAIL_CLIENT_SECRET=your-gmail-client-secret
supabase secrets set GMAIL_REDIRECT_URI=https://your-domain.com/auth/callback/gmail

# Set Outlook credentials (get from Step 4)
supabase secrets set OUTLOOK_CLIENT_ID=your-outlook-client-id
supabase secrets set OUTLOOK_CLIENT_SECRET=your-outlook-client-secret
supabase secrets set OUTLOOK_REDIRECT_URI=https://your-domain.com/auth/callback/outlook

# System variables (already set by Supabase)
# SUPABASE_URL - Auto-set
# SUPABASE_ANON_KEY - Auto-set
# SUPABASE_SERVICE_ROLE_KEY - Auto-set
```

## 📧 Step 3: Gmail OAuth Setup

### 1. Create Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click project dropdown → "New Project"
3. Name: `Unified Mail`
4. Click "Create"

### 2. Enable Gmail API

1. Navigate to **APIs & Services** → **Library**
2. Search for "Gmail API"
3. Click Gmail API → Click "Enable"
4. Wait for activation

### 3. Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type → Click "Create"
3. Fill in required fields:
   - **App name**: `Unified Mail`
   - **User support email**: your-email@domain.com
   - **Developer contact**: your-email@domain.com
4. Click "Save and Continue"

5. **Add Scopes**:
   - Click "Add or Remove Scopes"
   - Add these Gmail scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.modify`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`
   - Click "Update" → "Save and Continue"

6. **Test Users** (Development Mode):
   - Click "Add Users"
   - Add your test email addresses
   - Click "Save and Continue"

7. Click "Back to Dashboard"

### 4. Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: **Web application**
4. Name: `Unified Mail Web Client`
5. **Authorized redirect URIs**:
   - Development: `http://localhost:8080/auth/callback/gmail`
   - Production: `https://your-domain.com/auth/callback/gmail`
   - Add both if needed
6. Click "Create"

### 5. Save Credentials

**IMPORTANT**: Copy these values immediately:

- **Client ID** → Use in:
  - `.env` as `VITE_GMAIL_CLIENT_ID` (frontend)
  - Supabase secret as `GMAIL_CLIENT_ID` (backend)
- **Client Secret** → Use ONLY in:
  - Supabase secret as `GMAIL_CLIENT_SECRET` (never in frontend!)

### 6. Publish App (When Ready for Production)

1. Go back to **OAuth consent screen**
2. Click "Publish App"
3. Submit for verification if using restricted scopes

## 🔵 Step 4: Outlook OAuth Setup

### 1. Register Azure Application

1. Go to [portal.azure.com](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click "New registration"
4. Fill in:
   - **Name**: `Unified Mail`
   - **Supported account types**:
     - Select "Accounts in any organizational directory and personal Microsoft accounts"
   - **Redirect URI**:
     - Platform: **Web**
     - URI: `http://localhost:8080/auth/callback/outlook`
5. Click "Register"

### 2. Save Application ID

From the app overview page:
- Copy **Application (client) ID** → Use as:
  - `.env`: `VITE_OUTLOOK_CLIENT_ID`
  - Supabase secret: `OUTLOOK_CLIENT_ID`

### 3. Create Client Secret

1. Go to **Certificates & secrets**
2. Click "New client secret"
3. Description: `Unified Mail Secret`
4. Expires: 24 months (or custom)
5. Click "Add"
6. **IMMEDIATELY** copy the secret **Value** → Use as:
   - Supabase secret: `OUTLOOK_CLIENT_SECRET`
   - ⚠️ You can't see this again!

### 4. Configure API Permissions

1. Go to **API permissions**
2. Click "Add a permission"
3. Select "Microsoft Graph"
4. Select "Delegated permissions"
5. Add these permissions:
   - `Mail.Read`
   - `Mail.ReadWrite`
   - `Mail.Send`
   - `offline_access` (for refresh tokens)
   - `User.Read`
6. Click "Add permissions"

7. **(Optional) Grant Admin Consent**:
   - If you're an admin, click "Grant admin consent for [tenant]"
   - Otherwise, users will consent individually

### 5. Add Production Redirect URI

1. Go to **Authentication**
2. Under "Web" platform, click "Add URI"
3. Add: `https://your-domain.com/auth/callback/outlook`
4. Click "Save"

## 🌐 Step 5: Frontend Deployment

### Configure Environment Variables

Create `.env` file (for local development):

```env
# Supabase
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# Gmail (Client ID only - secret is in Supabase)
VITE_GMAIL_CLIENT_ID=123456-abc.apps.googleusercontent.com

# Outlook (Client ID only - secret is in Supabase)
VITE_OUTLOOK_CLIENT_ID=abc-123-def-456
```

### Deploy to Vercel

1. **Push to GitHub**:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/unified-mail.git
git push -u origin main
```

2. **Import to Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Configure:
     - Framework Preset: **Vite**
     - Build Command: `npm run build`
     - Output Directory: `dist`
     - Install Command: `npm install`

3. **Add Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add each variable from `.env`
   - Click "Deploy"

4. **Copy Deployment URL**:
   - After deployment, copy your URL (e.g., `https://unified-mail.vercel.app`)
   - Update OAuth redirect URIs in Google Cloud Console and Azure Portal with this URL

### Deploy to Netlify

1. **Push to GitHub** (same as above)

2. **Import to Netlify**:
   - Visit [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect GitHub repository
   - Configure:
     - Build command: `npm run build`
     - Publish directory: `dist`

3. **Add Environment Variables**:
   - Site settings → Environment variables
   - Add all variables from `.env`
   - Trigger new deploy

4. **Copy Deployment URL**:
   - Update OAuth redirect URIs with your Netlify URL

## ✅ Step 6: Testing

### Test Authentication

1. Visit your deployed app
2. Click "Sign Up"
3. Create account with email/password
4. Verify you can log in/out

### Test Gmail Integration

1. Log in to your app
2. Click "Add Account"
3. Click "Gmail"
4. Should redirect to Google OAuth page
5. Select your test account
6. Grant permissions
7. Should redirect back to app
8. Verify account appears in sidebar
9. Wait 30-60 seconds for initial sync
10. Refresh page - emails should appear

### Test Outlook Integration

1. Click "Add Account"
2. Click "Outlook"
3. Should redirect to Microsoft OAuth
4. Sign in with Microsoft account
5. Grant permissions
6. Verify account appears
7. Check email sync

### Test Email Functionality

1. **Compose**: Click "Compose" → Write email → Send
2. **Reply**: Open message → Click "Reply" → Send
3. **Star**: Click star icon on messages
4. **Archive**: Click archive icon
5. **Search**: Type in search box
6. **Delete**: Click delete (with confirmation)

## 📊 Step 7: Monitoring

### Supabase Dashboard

1. **Database**:
   - Check `mail_accounts` table for connected accounts
   - Check `messages` table for synced emails
   - Verify `oauth_tokens` has encrypted tokens

2. **Edge Functions** → **Logs**:
   - Monitor function executions
   - Check for errors in sync process
   - View OAuth callback logs

3. **Authentication** → **Users**:
   - View registered users
   - Check session status

### Application Logs

Monitor these areas:
- Browser console for frontend errors
- Network tab for API call failures
- Supabase logs for backend issues

### Common Issues

**OAuth "redirect_uri_mismatch"**:
- Ensure redirect URI in code matches EXACTLY in OAuth provider
- Check for http vs https
- Check for trailing slashes

**"Failed to sync emails"**:
- Check Edge Function logs
- Verify OAuth token exists in database
- Check if token has expired (should auto-refresh)
- Verify API scopes/permissions

**"No emails appearing"**:
- Wait 60 seconds for initial sync
- Check `sync_emails` function logs
- Verify `mail_accounts.sync_status` is 'success'
- Check for errors in `mail_accounts.error_message`

## 🔐 Security Checklist

- [ ] All Supabase secrets set (not in code)
- [ ] `.env` file in `.gitignore`
- [ ] RLS policies enabled on all tables
- [ ] HTTPS enforced on production
- [ ] OAuth redirect URIs use production URLs
- [ ] Client secrets never exposed to frontend
- [ ] Service role key kept secure
- [ ] Regular security audits of dependencies

## 🚀 Going Live

1. **Remove Test Mode**:
   - Gmail: Publish OAuth consent screen
   - Outlook: Remove any test restrictions

2. **Update Redirect URIs**:
   - Remove localhost URLs from production
   - Keep only production domain

3. **Enable Monitoring**:
   - Set up error tracking (Sentry, LogRocket)
   - Configure uptime monitoring
   - Set up email alerts for failed syncs

4. **Performance**:
   - Enable Vercel/Netlify CDN
   - Optimize images
   - Enable caching headers

5. **Backup**:
   - Schedule automatic Supabase backups
   - Export database schema regularly
   - Document your setup

## 📈 Scaling Considerations

- **Email Sync**: Current limit 50 messages/sync - increase as needed
- **Rate Limits**: Gmail/Outlook have API quotas - implement exponential backoff
- **Database**: Monitor Supabase usage and upgrade plan if needed
- **Edge Functions**: Optimize sync to reduce execution time
- **Storage**: Implement cleanup for old/archived messages

## 🎉 Next Steps

Once deployed and tested:

1. Add more features (threading, attachments, etc.)
2. Implement email rules/filters
3. Add keyboard shortcuts
4. Create mobile-responsive UI
5. Add push notifications
6. Implement offline mode
7. Add more email providers

---

**Need Help?**
- Check [SETUP.md](./SETUP.md) for detailed setup
- Review [README.md](./README.md) for architecture
- Open GitHub issue for bugs
- Check Supabase community forums
