# Unified Mail - Setup Guide

A complete unified email client with Gmail and Outlook integration built with React, TypeScript, and Supabase.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Supabase Setup](#supabase-setup)
- [OAuth Configuration](#oauth-configuration)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)

## Prerequisites

- Node.js 18+ installed
- npm or bun package manager
- Supabase account (free tier works)
- Google Cloud Platform account (for Gmail OAuth)
- Azure account (for Outlook OAuth)

## Local Development Setup

### 1. Clone and Install Dependencies

```bash
cd omni-mail-view-main
npm install
# or
bun install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Fill in your credentials (see sections below for how to obtain them).

### 3. Run Development Server

```bash
npm run dev
# or
bun dev
```

The app will be available at `http://localhost:8080`

## Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details
4. Wait for project to provision (2-3 minutes)

### 2. Get Supabase Credentials

From your Supabase project dashboard:

1. Go to **Settings** → **API**
2. Copy these values to your `.env` file:
   - Project URL → `VITE_SUPABASE_URL`
   - Project Reference ID → `VITE_SUPABASE_PROJECT_ID`
   - `anon` `public` key → `VITE_SUPABASE_PUBLISHABLE_KEY`

### 3. Run Database Migrations

The migration file is already in `supabase/migrations/`. To apply it:

**Option A: Using Supabase CLI (Recommended)**

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Push migrations
supabase db push
```

**Option B: Manual SQL Execution**

1. Go to Supabase Dashboard → **SQL Editor**
2. Create a new query
3. Copy contents of `supabase/migrations/20251003185349_63aa6811-272d-4cfc-8118-6019e252a744.sql`
4. Run the query

### 4. Deploy Edge Functions

Deploy all edge functions to Supabase:

```bash
# Deploy Gmail OAuth function
supabase functions deploy gmail-oauth

# Deploy Outlook OAuth function
supabase functions deploy outlook-oauth

# Deploy sync emails function
supabase functions deploy sync-emails

# Deploy send email function
supabase functions deploy send-email
```

### 5. Set Edge Function Secrets

```bash
# Gmail secrets
supabase secrets set GMAIL_CLIENT_ID=your-client-id
supabase secrets set GMAIL_CLIENT_SECRET=your-client-secret
supabase secrets set GMAIL_REDIRECT_URI=https://your-domain.com/auth/callback/gmail

# Outlook secrets
supabase secrets set OUTLOOK_CLIENT_ID=your-client-id
supabase secrets set OUTLOOK_CLIENT_SECRET=your-client-secret
supabase secrets set OUTLOOK_REDIRECT_URI=https://your-domain.com/auth/callback/outlook
```

## OAuth Configuration

### Gmail OAuth Setup

1. **Go to Google Cloud Console**
   - Visit [console.cloud.google.com](https://console.cloud.google.com)

2. **Create a New Project**
   - Click "Select a project" → "New Project"
   - Name it "Unified Mail" or similar
   - Click "Create"

3. **Enable Gmail API**
   - Go to **APIs & Services** → **Library**
   - Search for "Gmail API"
   - Click and enable it

4. **Create OAuth Credentials**
   - Go to **APIs & Services** → **Credentials**
   - Click "Create Credentials" → "OAuth client ID"
   - Select "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:8080/auth/callback/gmail` (development)
     - `https://your-domain.com/auth/callback/gmail` (production)
   - Click "Create"
   - Copy Client ID and Client Secret

5. **Configure OAuth Consent Screen**
   - Go to **OAuth consent screen**
   - Select "External" user type
   - Fill in app name, support email
   - Add scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.modify`
   - Add test users (in development mode)

### Outlook OAuth Setup

1. **Go to Azure Portal**
   - Visit [portal.azure.com](https://portal.azure.com)

2. **Register Application**
   - Go to **Azure Active Directory** → **App registrations**
   - Click "New registration"
   - Name: "Unified Mail"
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI:
     - Platform: Web
     - URI: `http://localhost:8080/auth/callback/outlook` (add production URL later)
   - Click "Register"

3. **Get Application IDs**
   - From the app overview page, copy:
     - Application (client) ID → `VITE_OUTLOOK_CLIENT_ID`

4. **Create Client Secret**
   - Go to **Certificates & secrets**
   - Click "New client secret"
   - Add description, set expiry
   - Copy the secret value → `OUTLOOK_CLIENT_SECRET`

5. **Configure API Permissions**
   - Go to **API permissions**
   - Click "Add a permission"
   - Select "Microsoft Graph"
   - Add these delegated permissions:
     - `Mail.Read`
     - `Mail.ReadWrite`
     - `Mail.Send`
     - `offline_access`
   - Click "Grant admin consent" (if applicable)

6. **Add Production Redirect URI**
   - Go to **Authentication**
   - Add redirect URI: `https://your-domain.com/auth/callback/outlook`

## Environment Variables

### Client-Side (.env)

```env
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
VITE_GMAIL_CLIENT_ID=123-abc.apps.googleusercontent.com
VITE_OUTLOOK_CLIENT_ID=abc-123-def
```

### Server-Side (Supabase Secrets)

Set these via `supabase secrets set`:

```bash
GMAIL_CLIENT_SECRET=GOCSPX-...
GMAIL_REDIRECT_URI=https://your-domain.com/auth/callback/gmail
OUTLOOK_CLIENT_SECRET=abc~123...
OUTLOOK_REDIRECT_URI=https://your-domain.com/auth/callback/outlook
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Deployment

### Deploy to Vercel

1. **Push code to GitHub**

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

2. **Deploy on Vercel**

- Go to [vercel.com](https://vercel.com)
- Click "Import Project"
- Select your GitHub repository
- Framework Preset: Vite
- Add environment variables from `.env`
- Click "Deploy"

3. **Update OAuth Redirect URIs**

After deployment, add your Vercel URL to:
- Google Cloud Console redirect URIs
- Azure App Registration redirect URIs
- Supabase Edge Function secrets

### Deploy to Netlify

1. **Push code to GitHub** (same as above)

2. **Deploy on Netlify**

- Go to [netlify.com](https://netlify.com)
- Click "Add new site" → "Import an existing project"
- Connect to GitHub and select repository
- Build command: `npm run build`
- Publish directory: `dist`
- Add environment variables
- Click "Deploy site"

3. **Update OAuth Redirect URIs** (same as Vercel)

## Testing

### Test Authentication

1. Sign up with email/password
2. Verify you can log in/out

### Test Gmail Integration

1. Click "Add Account"
2. Select Gmail
3. Complete OAuth flow
4. Verify account appears in sidebar
5. Check if emails sync (may take a minute)

### Test Outlook Integration

1. Click "Add Account"
2. Select Outlook
3. Complete OAuth flow
4. Verify account appears in sidebar
5. Check if emails sync

### Test Email Features

- Click a message to view details
- Star/unstar messages
- Click "Compose" to write new email
- Send a test email
- Reply to a message

## Troubleshooting

### OAuth Errors

**"redirect_uri_mismatch"**
- Ensure redirect URI in OAuth provider matches exactly (including https/http)
- Check for trailing slashes

**"invalid_client"**
- Client ID or Secret is incorrect
- Verify credentials in `.env` and Supabase secrets

### Email Sync Issues

**Emails not appearing**
- Check Supabase logs: Dashboard → Edge Functions → Logs
- Verify OAuth tokens are stored: Database → oauth_tokens table
- Manual sync trigger: Call sync-emails edge function directly

### Database Errors

**RLS policies blocking access**
- Verify user is authenticated
- Check Supabase Auth Users table
- Review RLS policies in migration file

## Architecture

```
Frontend (React + Vite)
    ↓
Supabase Auth (User Management)
    ↓
Supabase Edge Functions (OAuth + Email Sync)
    ↓
Gmail API / Microsoft Graph API
    ↓
Supabase PostgreSQL (Email Storage)
    ↓
Real-time Updates → Frontend
```

## Security Considerations

1. **Never commit secrets** to version control
2. **Use Supabase RLS** to protect user data
3. **OAuth tokens** are stored server-side only
4. **HTTPS required** for production
5. **Sanitize HTML** emails before rendering (XSS protection)

## Support

For issues or questions:
- Check Supabase logs for errors
- Review browser console for client-side errors
- Verify all environment variables are set correctly
- Ensure OAuth redirect URIs are exact matches

## Next Steps

1. Enable additional email providers (IMAP/POP3)
2. Add attachment downloads
3. Implement email threading
4. Add labels and folders
5. Enable push notifications
6. Implement email search indexing
7. Add dark mode toggle
