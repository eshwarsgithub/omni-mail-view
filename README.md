# Unified Mail - Complete Email Management Solution

A modern, production-ready unified email client that connects multiple Gmail and Outlook accounts in one beautiful interface. Built with React, TypeScript, Vite, and Supabase.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy)

## ✨ Features

- 🔐 **Secure Authentication** - Supabase Auth with OAuth 2.0
- 📧 **Multi-Account Support** - Connect unlimited Gmail and Outlook accounts
- 🔑 **API Key Management** - Secure OAuth credential storage
- 📨 **Real-time Sync** - Automatic email synchronization
- ✍️ **Email Composition** - Send emails from any connected account
- 💾 **Draft Management** - Auto-save and manage drafts
- 🔍 **Search & Filter** - Search across all your emails
- ⭐ **Organize** - Star, archive, and manage messages
- 🎨 **Modern UI** - Beautiful interface with shadcn/ui
- 🚀 **Production Ready** - Deploy to Vercel, Netlify, or self-host

## 🚀 Quick Start

### 1. Install

```bash
git clone https://github.com/eshwarsgithub/omni-mail-view.git
cd omni-mail-view
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 3. Setup Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run migrations in SQL Editor:
   - `supabase/migrations/20251003185349_*.sql`
   - `supabase/migrations/20251003210000_*.sql`
3. Deploy Edge Functions:
   ```bash
   supabase functions deploy gmail-oauth
   supabase functions deploy sync-emails
   supabase functions deploy send-email
   ```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` 🎉

## 📚 Documentation

- **[Quick Start Guide](QUICK_START.md)** - Get started in 5 minutes
- **[Setup Guide](SETUP.md)** - Complete setup instructions
- **[Deployment Guide](DEPLOYMENT.md)** - Production deployment
- **[Enhancements](ENHANCEMENTS.md)** - Feature overview
- **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)** - Technical details

## 🏗️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **shadcn/ui** - Component library
- **React Router** - Navigation
- **TanStack Query** - Data fetching

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication
  - Edge Functions (Deno)
  - Real-time subscriptions
  - Row Level Security

### APIs
- Gmail API (Google Cloud)
- Microsoft Graph API (Azure)

## 🔐 OAuth Setup

### Gmail
1. [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Enable Gmail API
4. Add to app Settings

### Outlook
1. [Azure Portal](https://portal.azure.com)
2. Register application
3. Add Mail permissions
4. Add to app Settings

See [SETUP.md](SETUP.md) for detailed instructions.

## 📦 Project Structure

```
├── src/
│   ├── components/
│   │   ├── mail/           # Email components
│   │   └── ui/             # UI components (shadcn)
│   ├── pages/
│   │   ├── Auth.tsx        # Authentication
│   │   ├── Inbox.tsx       # Main inbox
│   │   └── Settings.tsx    # API key management
│   └── integrations/
│       └── supabase/       # Supabase client
├── supabase/
│   ├── functions/          # Edge Functions
│   │   ├── gmail-oauth/
│   │   ├── sync-emails/
│   │   └── send-email/
│   └── migrations/         # Database migrations
└── docs/                   # Documentation
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel --prod
```

### Netlify

```bash
npm i -g netlify-cli
netlify deploy --prod
```

### Docker

```bash
docker build -t unified-mail .
docker run -p 3000:3000 unified-mail
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed guides.

## 🔒 Security

- ✅ Row Level Security on all tables
- ✅ Encrypted OAuth token storage
- ✅ Service role protection
- ✅ HTTPS enforcement
- ✅ Environment variable security

## 📊 Features in Detail

### Email Management
- Multi-account support (Gmail, Outlook)
- Real-time synchronization
- Full and incremental sync
- Thread grouping
- Search and filtering
- Star/Archive/Delete

### Composition
- Rich text editing
- Multi-recipient (To, CC, BCC)
- Draft auto-save
- Reply/Reply All
- HTML and plain text

### Account Management
- OAuth 2.0 integration
- Secure API key storage
- Multiple providers
- Sync status tracking
- Error handling

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📝 Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🆘 Support

- 📖 [Documentation](SETUP.md)
- 🐛 [Issues](https://github.com/eshwarsgithub/omni-mail-view/issues)
- 💬 [Discussions](https://github.com/eshwarsgithub/omni-mail-view/discussions)

## 🙏 Acknowledgments

- Built with [Supabase](https://supabase.com)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)

## 📈 Roadmap

- [ ] IMAP/POP3 support
- [ ] Attachment handling
- [ ] Email templates
- [ ] Mobile app
- [ ] Desktop app (Electron)
- [ ] Advanced search
- [ ] Email rules
- [ ] Calendar integration

## 🔗 Links

- **Live Demo**: Coming soon
- **Documentation**: [Docs](SETUP.md)
- **Repository**: [GitHub](https://github.com/eshwarsgithub/omni-mail-view)
- **Pull Request**: [PR #1](https://github.com/eshwarsgithub/omni-mail-view/pull/1)

---

**Built with ❤️ using Claude Code & Terragon Labs**

🤖 Powered by [Claude Code](https://claude.com/claude-code)
