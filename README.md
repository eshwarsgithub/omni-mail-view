# 📧 Unified Mail - All Your Email in One Place

A modern, unified email client that brings together Gmail, Outlook, and more email providers into a single, beautiful interface. Built with React, TypeScript, Tailwind CSS, and Supabase.

![Unified Mail](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

### 🔐 Secure Authentication
- Email/password authentication via Supabase Auth
- Session management with automatic refresh
- Protected routes and user profiles

### 📨 Multi-Provider Email Support
- **Gmail** integration via OAuth 2.0
- **Outlook/Microsoft 365** integration via OAuth 2.0
- IMAP/POP3 support (coming soon)

### 💬 Full Email Functionality
- **Read emails** across all connected accounts in a unified inbox
- **Compose new emails** with rich text support
- **Reply and forward** messages
- **Star/unstar** important messages
- **Archive and delete** messages
- **Search** across all messages
- **Real-time sync** with automatic updates

### 🎨 Modern UI/UX
- Beautiful gradient design system
- Dark mode support
- Responsive layout (desktop-first, mobile-optimized)
- Smooth animations and transitions
- Intuitive 3-panel interface (sidebar, message list, detail view)

### 🔒 Security & Privacy
- Row-level security (RLS) policies on all database tables
- OAuth tokens encrypted and stored server-side only
- XSS protection with DOMPurify (recommended)
- HTTPS required for production
- Audit logging for all user actions

## 🚀 Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality component library
- **Radix UI** - Accessible component primitives
- **TanStack Query** - Server state management
- **React Router** - Client-side routing
- **date-fns** - Date formatting
- **Lucide React** - Icon library

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication
  - Row Level Security (RLS)
  - Edge Functions (Deno runtime)
  - Real-time subscriptions

### Email APIs
- **Gmail API** - Google email access
- **Microsoft Graph API** - Outlook/Microsoft 365 access

## 📋 Prerequisites

- Node.js 18+ or Bun
- Supabase account (free tier available)
- Google Cloud Platform account (for Gmail OAuth)
- Microsoft Azure account (for Outlook OAuth)

## 🛠️ Installation & Setup

### Quick Start

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd omni-mail-view

# Install dependencies
npm install
# or
bun install

# Copy environment variables
cp .env.example .env

# Fill in your credentials in .env
# Then start the development server
npm run dev
# or
bun dev
```

Visit `http://localhost:8080` to see the app.

### Detailed Setup

For complete setup instructions including:
- Supabase configuration
- Database migrations
- Edge function deployment
- OAuth provider setup (Gmail & Outlook)
- Environment variables
- Deployment guides

**See [SETUP.md](./SETUP.md)** for the full guide.

## 📁 Project Structure

```
omni-mail-view/
├── src/
│   ├── components/
│   │   ├── mail/              # Email-specific components
│   │   │   ├── AccountsList.tsx
│   │   │   ├── AddAccountDialog.tsx
│   │   │   ├── ComposeDialog.tsx
│   │   │   ├── MessageDetail.tsx
│   │   │   └── MessageList.tsx
│   │   └── ui/                # Reusable UI components (shadcn)
│   ├── pages/                 # Route pages
│   │   ├── Auth.tsx          # Sign in/Sign up
│   │   ├── Inbox.tsx         # Main email interface
│   │   ├── OAuthCallback.tsx # OAuth redirect handler
│   │   └── NotFound.tsx      # 404 page
│   ├── lib/
│   │   ├── oauth.ts          # OAuth helper functions
│   │   └── utils.ts          # Utility functions
│   ├── integrations/
│   │   └── supabase/         # Supabase client & types
│   ├── App.tsx               # App root with routing
│   └── main.tsx              # Entry point
├── supabase/
│   ├── functions/            # Edge Functions
│   │   ├── gmail-oauth/      # Gmail OAuth handler
│   │   ├── outlook-oauth/    # Outlook OAuth handler
│   │   ├── sync-emails/      # Email sync function
│   │   └── send-email/       # Send email function
│   └── migrations/           # Database schema
├── public/                   # Static assets
├── .env.example             # Environment template
├── SETUP.md                 # Detailed setup guide
└── README.md                # This file
```

## 🎯 Key Components

### Database Schema

```sql
-- Core tables
profiles          # User profiles
mail_accounts     # Connected email accounts
messages          # Synchronized emails
threads           # Conversation grouping
attachments       # Email attachments
oauth_tokens      # Encrypted OAuth credentials
audit_log         # User action logs
```

### Edge Functions

1. **gmail-oauth** - Handles Gmail OAuth flow and token exchange
2. **outlook-oauth** - Handles Outlook OAuth flow and token exchange
3. **sync-emails** - Fetches and syncs emails from providers
4. **send-email** - Sends emails via Gmail/Outlook APIs

### Frontend Routes

- `/` - Main inbox (protected)
- `/auth` - Sign in / Sign up
- `/auth/callback/:provider` - OAuth callback handler
- `*` - 404 Not Found

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Build for development (with source maps)
npm run build:dev

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Environment Variables

Create a `.env` file with:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_GMAIL_CLIENT_ID=your-gmail-client-id
VITE_OUTLOOK_CLIENT_ID=your-outlook-client-id
```

See [.env.example](./.env.example) for the complete list.

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Visit [vercel.com](https://vercel.com) and import your repository
3. Configure environment variables
4. Deploy!

Configuration file included: `vercel.json`

### Deploy to Netlify

1. Push your code to GitHub
2. Visit [netlify.com](https://netlify.com) and import your repository
3. Configure environment variables
4. Deploy!

Configuration file included: `netlify.toml`

### Manual Deployment

See [SETUP.md](./SETUP.md#deployment) for detailed deployment instructions.

## 🔒 Security

- All database tables protected with Row Level Security (RLS)
- OAuth tokens stored server-side with encryption
- User data isolated per user ID
- HTTPS enforced in production
- Email HTML sanitization required (implement DOMPurify)
- CORS headers configured
- Environment secrets never exposed to client

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Supabase](https://supabase.com/) for the amazing backend platform
- [Radix UI](https://www.radix-ui.com/) for accessible primitives
- [Lucide](https://lucide.dev/) for the icon set
- [Tailwind CSS](https://tailwindcss.com/) for the styling framework

## 📧 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check the [SETUP.md](./SETUP.md) documentation
- Review Supabase logs for backend errors

## 🗺️ Roadmap

- [ ] Email threading/conversations
- [ ] Attachment upload and download
- [ ] IMAP/POP3 support
- [ ] Email filters and rules
- [ ] Keyboard shortcuts
- [ ] Offline mode with local caching
- [ ] Push notifications
- [ ] Email scheduling
- [ ] Templates and signatures
- [ ] Calendar integration
- [ ] Mobile apps (React Native)

## 📊 Architecture

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

---

Made with ❤️ using React, TypeScript, and Supabase
