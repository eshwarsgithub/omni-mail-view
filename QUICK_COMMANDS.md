# ⚡ Quick Command Reference

## 🎯 Your Gmail OAuth Credentials

```
Client ID: 219592067381-d1vme5n7jur8ueiecghetk8bqk8808a5.apps.googleusercontent.com
Client Secret: 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
```

## 🚀 Essential Commands to Run Now

### 1. Add Redirect URI to Google Cloud Console

**Go to**: [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)

**Add this redirect URI**:
```
http://localhost:8080/auth/callback/gmail
```

### 2. Install Supabase CLI

```bash
npm install -g supabase
```

### 3. Login to Supabase

```bash
supabase login
```

### 4. Link Your Project

```bash
cd /Users/eshwar/Desktop/omni-mail-view-main
supabase link --project-ref tbockdhgvyyajsvpsogr
```

### 5. Set Gmail Secrets

```bash
supabase secrets set GMAIL_CLIENT_ID="219592067381-d1vme5n7jur8ueiecghetk8bqk8808a5.apps.googleusercontent.com"

supabase secrets set GMAIL_CLIENT_SECRET="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"

supabase secrets set GMAIL_REDIRECT_URI="http://localhost:8080/auth/callback/gmail"
```

### 6. Deploy Database Schema

```bash
supabase db push
```

### 7. Deploy Edge Functions

```bash
supabase functions deploy gmail-oauth
supabase functions deploy sync-emails
supabase functions deploy send-email
```

## ✅ Test the Integration

1. Open: http://localhost:8080/
2. Sign in to your account
3. Click "Add Account"
4. Click "Gmail"
5. Complete Google OAuth
6. Wait 60 seconds
7. Refresh page
8. Your Gmail emails should appear! 📧

## 📁 Important Files

- `GMAIL_OAUTH_SETUP.md` - Complete setup guide
- `PRODUCTION.md` - Production deployment
- `SETUP.md` - Full setup documentation
- `QUICK_START_LOCAL.md` - Local development guide
- `README.md` - Project overview

## 🌐 URLs

- **Local App**: http://localhost:8080/
- **Supabase Dashboard**: https://supabase.com/dashboard/project/tbockdhgvyyajsvpsogr
- **Google Cloud Console**: https://console.cloud.google.com

## 🐛 Quick Troubleshooting

**OAuth Error?**
- Check redirect URI matches exactly in Google Cloud Console

**No emails?**
- Check Supabase Edge Functions logs
- Wait 60 seconds for sync
- Refresh the page

**"OAuth not configured"?**
- Restart dev server: `npm run dev`

## 📊 Monitor

**Supabase Dashboard Tabs:**
- **Database** → `mail_accounts` - See connected accounts
- **Database** → `messages` - See synced emails
- **Edge Functions** → Logs - Check function execution
- **Authentication** → Users - View signed-up users

---

**Status**: ✅ Gmail credentials configured in frontend
**Next**: Complete steps 1-7 above to enable real Gmail integration
