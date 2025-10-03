# Quick Start Guide - Unified Mail

Get your unified mail application up and running in minutes!

## 🚀 5-Minute Setup

### Prerequisites
- Node.js 18+
- Supabase account
- Gmail/Outlook OAuth credentials

### Step 1: Install Dependencies (30 seconds)
```bash
git clone <your-repo>
cd <project-directory>
npm install
```

### Step 2: Configure Supabase (2 minutes)

1. Create project at [supabase.com](https://supabase.com)

2. Copy your credentials:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. Run migrations in Supabase SQL Editor:
   - Copy content from `supabase/migrations/20251003185349_*.sql`
   - Paste and execute
   - Copy content from `supabase/migrations/20251003210000_*.sql`
   - Paste and execute

### Step 3: Deploy Edge Functions (1 minute)
```bash
# Install Supabase CLI
npm install -g supabase

# Login and link
supabase login
supabase link --project-ref <your-project-ref>

# Deploy functions
supabase functions deploy gmail-oauth
supabase functions deploy sync-emails
supabase functions deploy send-email
```

### Step 4: Start Development (30 seconds)
```bash
npm run dev
```

Visit `http://localhost:5173`

## 🔑 OAuth Setup (5 minutes)

### Gmail OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project → Enable Gmail API
3. Create OAuth 2.0 credentials
4. Add redirect URI: `http://localhost:5173/oauth/callback`
5. Save Client ID and Client Secret

### Outlook OAuth

1. Go to [Azure Portal](https://portal.azure.com)
2. Register app → Add Mail permissions
3. Create client secret
4. Add redirect URI
5. Save Client ID and Client Secret

## 📧 First Email Account (2 minutes)

1. **Sign Up/Sign In** to the app

2. **Add API Keys**:
   - Click Settings (bottom left)
   - Click "Add API Key"
   - Select Gmail/Outlook
   - Enter name, Client ID, Client Secret
   - Save

3. **Connect Account**:
   - Go back to Inbox
   - Click "Add Account"
   - Enter email (optional)
   - Click "Connect"
   - Complete OAuth in popup
   - Wait for sync!

## ✨ Start Using

- **Compose**: Click "Compose" button
- **Reply**: Open message → Click reply
- **Search**: Use search bar
- **Star**: Click star icon
- **Settings**: Manage API keys

## 🚀 Deploy to Production (5 minutes)

### Option A: Vercel
```bash
npm i -g vercel
vercel
# Set environment variables in Vercel dashboard
vercel --prod
```

### Option B: Netlify
```bash
npm i -g netlify-cli
netlify deploy
# Set environment variables in Netlify dashboard
netlify deploy --prod
```

## 📚 Full Documentation

- **Setup**: `SETUP.md`
- **Deployment**: `DEPLOYMENT.md`
- **Features**: `ENHANCEMENTS.md`

## 🆘 Troubleshooting

### OAuth Error?
- Check redirect URIs match exactly
- Verify API keys saved correctly

### Sync Not Working?
- Check Edge Functions deployed
- View Supabase function logs

### Build Error?
```bash
npm run build
# Check for TypeScript errors
```

## 🎯 Next Steps

1. ✅ Set up OAuth apps
2. ✅ Deploy Edge Functions
3. ✅ Add API keys in Settings
4. ✅ Connect email accounts
5. ✅ Deploy to production

## 💡 Pro Tips

- Use Gmail for fastest setup
- Test with personal account first
- Check Supabase logs for debugging
- Read `SETUP.md` for details

---

**Need Help?** Check `SETUP.md` or open an issue!

🤖 Powered by Claude Code & Terragon Labs
