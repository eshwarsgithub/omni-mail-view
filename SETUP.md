# Unified Mail Setup Guide

A modern, unified email client built with React, TypeScript, Vite, and Supabase. Connect multiple Gmail and Outlook accounts in one interface.

## Features

- 🔐 **Authentication** - Secure user authentication with Supabase
- 📧 **Multi-Account Support** - Connect Gmail and Outlook accounts via OAuth
- 🔑 **API Key Management** - Securely manage OAuth credentials
- 📨 **Email Sync** - Real-time email synchronization
- ✍️ **Email Composition** - Send emails from any connected account
- 🔍 **Search & Filter** - Search across all your emails
- ⭐ **Star & Archive** - Organize your inbox
- 🎨 **Modern UI** - Beautiful interface with shadcn/ui components

## Prerequisites

- Node.js 18+ and npm
- A Supabase account
- Gmail and/or Outlook OAuth credentials

## Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd <project-directory>
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Run the database migrations:
   - Go to your Supabase dashboard → SQL Editor
   - Run the migration files in order:
     - `supabase/migrations/20251003185349_63aa6811-272d-4cfc-8118-6019e252a744.sql`
     - `supabase/migrations/20251003210000_api_keys_and_oauth.sql`

3. Deploy Edge Functions:
   ```bash
   # Install Supabase CLI if you haven't
   npm install -g supabase

   # Login to Supabase
   supabase login

   # Link your project
   supabase link --project-ref <your-project-ref>

   # Deploy functions
   supabase functions deploy gmail-oauth
   supabase functions deploy sync-emails
   supabase functions deploy send-email
   ```

4. Update your `.env` file:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   VITE_SUPABASE_PROJECT_ID=your-project-id
   ```

### 3. OAuth Setup

#### Gmail OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable Gmail API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen
6. Create OAuth client (Web application)
7. Add authorized redirect URIs:
   - `http://localhost:5173/oauth/callback` (for development)
   - `https://your-domain.com/oauth/callback` (for production)
   - `https://your-project.supabase.co/functions/v1/gmail-oauth` (for Edge Function)
8. Save your Client ID and Client Secret

#### Outlook OAuth Setup

1. Go to [Azure Portal](https://portal.azure.com)
2. Register a new application in Azure AD
3. Add "Mail.Read" and "Mail.Send" permissions
4. Create a client secret
5. Add redirect URIs similar to Gmail setup
6. Save your Client ID and Client Secret

### 4. Add API Keys

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Sign up/Sign in to the application

3. Navigate to Settings (bottom left)

4. Add your OAuth credentials:
   - Click "Add API Key"
   - Select provider (Gmail or Outlook)
   - Enter a name (e.g., "Production Gmail")
   - Paste your Client ID
   - Paste your Client Secret
   - (Optional) Set custom redirect URI
   - Click "Add API Key"

### 5. Connect Email Accounts

1. From the Inbox, click "Add Account"
2. Enter your email address (optional)
3. Select the API key to use
4. Click "Connect" for Gmail or Outlook
5. Complete the OAuth flow in the popup window
6. Wait for initial sync to complete

### 6. Start Using

- **Compose**: Click the "Compose" button in the sidebar
- **Reply**: Open a message and click the reply button
- **Search**: Use the search bar to find messages
- **Star**: Click the star icon on any message
- **Settings**: Manage API keys and account settings

## Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# For production
vercel --prod
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy

# For production
netlify deploy --prod
```

### Environment Variables

Make sure to set these environment variables in your deployment platform:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

## Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **shadcn/ui** for UI components
- **React Router** for navigation
- **TanStack Query** for data fetching

### Backend
- **Supabase** for:
  - PostgreSQL database
  - Authentication
  - Row Level Security (RLS)
  - Edge Functions (Deno)
  - Realtime subscriptions

### Database Schema
- `profiles` - User profiles
- `api_keys` - OAuth credentials (encrypted)
- `mail_accounts` - Connected email accounts
- `oauth_tokens` - OAuth access/refresh tokens (encrypted)
- `messages` - Normalized email messages
- `threads` - Email conversation threads
- `attachments` - Email attachments
- `drafts` - Email drafts
- `sync_jobs` - Sync job tracking
- `audit_log` - Audit trail

### Edge Functions
- **gmail-oauth** - Gmail OAuth flow (initiate, callback, refresh)
- **sync-emails** - Fetch and sync emails from providers
- **send-email** - Send emails via provider APIs

## Security Considerations

1. **OAuth Credentials**: Store client secrets securely in the `api_keys` table
2. **Access Tokens**: OAuth tokens are stored with RLS policies (service role only)
3. **Row Level Security**: All tables have RLS enabled
4. **HTTPS Only**: Always use HTTPS in production
5. **Environment Variables**: Never commit `.env` files

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Troubleshooting

### OAuth Errors
- Ensure redirect URIs match exactly in OAuth provider settings
- Check that API keys are saved correctly in Settings
- Verify Edge Functions are deployed

### Sync Issues
- Check Supabase Edge Function logs
- Ensure OAuth tokens are valid (not expired)
- Check browser console for errors

### Database Errors
- Verify migrations were run successfully
- Check RLS policies are enabled
- Ensure user is authenticated

## Support

For issues and questions:
- Check the [Issues](https://github.com/your-repo/issues) page
- Review Supabase Edge Function logs
- Check browser console for errors

## License

MIT
