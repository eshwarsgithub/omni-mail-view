# Deployment Guide - Unified Mail

This guide covers deploying your Unified Mail application to production.

## Pre-Deployment Checklist

- [ ] Supabase project created and configured
- [ ] Database migrations applied
- [ ] Edge Functions deployed
- [ ] OAuth credentials configured (Gmail/Outlook)
- [ ] Environment variables set
- [ ] Application tested locally

## Supabase Edge Functions Deployment

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Login and Link Project

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>
```

### 3. Deploy Edge Functions

```bash
# Deploy Gmail OAuth function
supabase functions deploy gmail-oauth

# Deploy email sync function
supabase functions deploy sync-emails

# Deploy send email function
supabase functions deploy send-email
```

### 4. Set Edge Function Secrets (if needed)

```bash
# Example: Set a secret for encryption
supabase secrets set ENCRYPTION_KEY=your-secret-key
```

### 5. Verify Deployment

Check the Edge Functions in your Supabase dashboard under Functions.

## Frontend Deployment Options

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   # First deployment
   vercel

   # Production deployment
   vercel --prod
   ```

3. **Set Environment Variables**
   - Go to your Vercel project settings
   - Add environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_PUBLISHABLE_KEY`
     - `VITE_SUPABASE_PROJECT_ID`

4. **Configure Domain** (optional)
   - Add your custom domain in Vercel project settings
   - Update OAuth redirect URIs to include your domain

### Option 2: Netlify

1. **Install Netlify CLI**
   ```bash
   npm i -g netlify-cli
   ```

2. **Deploy**
   ```bash
   # First deployment
   netlify deploy

   # Production deployment
   netlify deploy --prod
   ```

3. **Set Environment Variables**
   - Go to Site Settings → Build & Deploy → Environment
   - Add the same variables as above

### Option 3: Manual GitHub + Vercel/Netlify

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel/Netlify**
   - Go to Vercel/Netlify dashboard
   - Import your GitHub repository
   - Configure environment variables
   - Deploy

### Option 4: Self-Hosted (Docker)

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "run", "preview"]
   ```

2. **Build and Run**
   ```bash
   docker build -t unified-mail .
   docker run -p 3000:3000 \
     -e VITE_SUPABASE_URL=your-url \
     -e VITE_SUPABASE_PUBLISHABLE_KEY=your-key \
     unified-mail
   ```

## OAuth Configuration for Production

### Gmail Production Setup

1. **Update OAuth Consent Screen**
   - Set to "In Production" (requires verification for public use)
   - Add privacy policy and terms of service URLs

2. **Update Authorized Redirect URIs**
   - Add production domain: `https://yourdomain.com/oauth/callback`
   - Add Edge Function URL: `https://your-project.supabase.co/functions/v1/gmail-oauth`

3. **Request Verification** (if publishing publicly)
   - Submit app for Google verification
   - Provide required documentation

### Outlook Production Setup

1. **Update App Registration**
   - Add production redirect URIs
   - Ensure proper API permissions

2. **Update Client Secret**
   - Generate production client secret
   - Update in your Unified Mail Settings

## Post-Deployment Steps

### 1. Update API Keys

After deployment, users need to:
1. Sign in to the deployed application
2. Go to Settings
3. Add their OAuth API keys
4. Connect email accounts

### 2. Test OAuth Flow

1. Click "Add Account" in the deployed app
2. Select Gmail or Outlook
3. Complete OAuth authorization
4. Verify email sync works

### 3. Monitor Edge Functions

- Check Supabase Edge Functions logs
- Monitor for errors in OAuth flow
- Track sync job performance

## Security Configuration

### 1. Enable HTTPS Only

Ensure your deployment platform serves only HTTPS:
- Vercel/Netlify: Automatic
- Self-hosted: Configure SSL certificates

### 2. Configure CORS (if needed)

Update Edge Functions to allow your domain:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://yourdomain.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

### 3. Row Level Security

Verify RLS policies are active:
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### 4. API Key Rotation

Regularly rotate:
- OAuth client secrets
- Supabase service role keys
- Any encryption keys

## Monitoring & Maintenance

### 1. Set Up Monitoring

- **Supabase Dashboard**: Monitor database and function metrics
- **Vercel/Netlify**: Monitor deployment and runtime metrics
- **Error Tracking**: Consider Sentry or similar

### 2. Regular Updates

```bash
# Update dependencies monthly
npm update
npm audit fix

# Rebuild and redeploy
npm run build
vercel --prod
```

### 3. Backup Strategy

- **Database**: Supabase provides automatic backups
- **Configuration**: Keep `.env.example` updated
- **Code**: Regular Git commits

## Scaling Considerations

### Database

- Monitor connection pool usage
- Enable Supabase connection pooling if needed
- Consider read replicas for high traffic

### Edge Functions

- Monitor function execution time
- Optimize email fetching (batch operations)
- Implement rate limiting if needed

### Storage

- Monitor attachment storage usage
- Implement cleanup policies for old emails
- Consider object storage for attachments

## Troubleshooting

### OAuth Errors in Production

1. **Redirect URI Mismatch**
   - Verify exact URLs in OAuth provider settings
   - Check for trailing slashes

2. **Invalid Client Secret**
   - Regenerate secret in provider console
   - Update in Unified Mail Settings

### Edge Function Errors

1. **Check Logs**
   ```bash
   supabase functions logs gmail-oauth
   ```

2. **Verify Secrets**
   ```bash
   supabase secrets list
   ```

### Deployment Fails

1. **Build Errors**
   - Check TypeScript errors: `npm run build`
   - Verify all dependencies installed

2. **Environment Variables**
   - Ensure all required vars are set
   - Check for typos in variable names

## Rollback Procedure

### Vercel/Netlify

1. Go to Deployments
2. Find previous working deployment
3. Click "Rollback" or "Promote to Production"

### Edge Functions

```bash
# Redeploy previous version
git checkout <previous-commit>
supabase functions deploy <function-name>
```

## Cost Optimization

### Supabase

- Monitor database size and API requests
- Free tier: 500MB database, 2GB bandwidth
- Pro tier recommended for production

### Vercel/Netlify

- Free tier sufficient for small teams
- Pro tier for custom domains and team features

### Gmail/Outlook APIs

- Monitor API quota usage
- Implement request caching where possible
- Use incremental sync to reduce API calls

## Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Gmail API**: https://developers.google.com/gmail/api
- **Microsoft Graph**: https://docs.microsoft.com/graph

## Production Checklist

- [ ] Database migrations applied
- [ ] Edge Functions deployed and tested
- [ ] OAuth apps configured for production
- [ ] Environment variables set
- [ ] HTTPS enabled
- [ ] Custom domain configured (optional)
- [ ] OAuth redirect URIs updated
- [ ] Monitoring enabled
- [ ] Backup strategy in place
- [ ] Documentation updated
- [ ] Team access configured
- [ ] Security review completed
