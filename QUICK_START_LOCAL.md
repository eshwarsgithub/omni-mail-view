# 🚀 Quick Start - View the Dashboard Locally

## Step 1: Sign Up for an Account

1. Open http://localhost:8080/ in your browser
2. You'll see the **Sign In/Sign Up** page
3. Click the **"Sign Up"** tab
4. Enter:
   - **Email**: test@example.com (or any email)
   - **Password**: password123 (minimum 6 characters)
5. Click **"Create Account"**
6. You should see "Account created! You can now sign in."

## Step 2: Sign In

1. Click the **"Sign In"** tab
2. Enter the same credentials:
   - **Email**: test@example.com
   - **Password**: password123
3. Click **"Sign In"**
4. You'll be redirected to the **Inbox Dashboard**! 🎉

## Step 3: View the Dashboard

You should now see the **full email interface** with:

### Left Sidebar:
- 📧 **Unified Mail** logo
- **Compose** button (blue)
- **+ Add Account** button
- Navigation: Inbox, Starred, Archive
- **ACCOUNTS** section (empty initially)
- **Sign Out** button at bottom

### Middle Panel:
- 🔍 **Search bar** at top
- **Message list** (will be empty initially)
- Shows: "No messages - Connect an account to get started"

### Right Panel:
- **Message detail view**
- Shows: "No message selected"
- Instructions to select a message

## Step 4: Add a Demo Account

Since we don't have OAuth configured yet, let's add a demo account:

1. Click **"+ Add Account"** or the add button
2. Click **"Gmail"** or **"Outlook"**
3. You'll see: "OAuth not configured. Adding demo account..."
4. A demo account will appear in the **ACCOUNTS** section

**Note**: Demo accounts won't fetch real emails. To see sample messages, follow Step 5.

## Step 5: Add Sample Messages (Optional)

To populate the inbox with demo messages:

### Method A: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project at https://supabase.com
2. Navigate to **SQL Editor**
3. Open the file `CREATE_TEST_DATA.sql` (in project root)
4. **First**, get your user ID:
   ```sql
   SELECT id, email FROM auth.users;
   ```
5. Copy your user ID
6. In `CREATE_TEST_DATA.sql`, replace **all instances** of `'YOUR_USER_ID'` with your actual ID
7. Run the modified SQL
8. Go back to http://localhost:8080/
9. Refresh the page
10. You should see **20 sample emails** in the message list! 📨

### Method B: Add Account Manually

If you prefer not to use SQL, you can still explore the UI:

1. Click **"Compose"** button to see the compose dialog
2. Fill in:
   - **To**: someone@example.com
   - **Subject**: Test Email
   - **Message**: Hello world!
3. Try clicking **"Send"** (will fail without OAuth configured, but you can see the UI)

## 🎨 Explore the Features

Now you can test all the UI features:

### Compose Email:
- Click **"Compose"** button
- See the compose dialog with:
  - From account selector
  - To, Cc, Bcc fields
  - Subject line
  - Message body
  - Send/Cancel buttons

### Search:
- Type in the search bar in the middle panel
- (Will work once you have messages)

### Message Actions:
- Click a message to view details
- Click ⭐ star icon to star/unstar
- Click **Reply** to open compose dialog
- Click **Archive** or **Delete** buttons

### Settings:
- View connected accounts in sidebar
- Click **Sign Out** to test logout

## 🔧 Making Changes

The app has **hot reload** enabled. Try editing:

1. Open `src/pages/Inbox.tsx`
2. Change line 68: `<span className="font-semibold text-lg">Unified Mail</span>`
3. Change "Unified Mail" to "My Mail Client"
4. Save the file
5. Watch the browser **automatically update**! ✨

## 🎯 UI Components to Explore

### Pages:
- `src/pages/Auth.tsx` - Login/Signup page
- `src/pages/Inbox.tsx` - Main inbox layout
- `src/pages/OAuthCallback.tsx` - OAuth redirect handler

### Components:
- `src/components/mail/ComposeDialog.tsx` - Compose email
- `src/components/mail/MessageList.tsx` - Email list
- `src/components/mail/MessageDetail.tsx` - Email detail view
- `src/components/mail/AccountsList.tsx` - Connected accounts
- `src/components/mail/AddAccountDialog.tsx` - Add account dialog

### Styling:
- `src/index.css` - Global styles and design tokens
- `tailwind.config.ts` - Tailwind configuration

## 🎨 Design System

The app uses a beautiful gradient color scheme:

**Primary Colors:**
- Deep Blue: `hsl(217 91% 60%)` - Professional email feel
- Purple Accent: `hsl(266 85% 58%)` - Modern touch

**Gradients:**
- `bg-gradient-primary` - Blue to purple
- `bg-gradient-subtle` - Subtle background

**Try changing the colors:**
1. Open `src/index.css`
2. Find line 21: `--primary: 217 91% 60%;`
3. Change to: `--primary: 150 91% 60%;` (for green)
4. Save and watch it update!

## 📱 Responsive Design

Try resizing your browser window to see the responsive layout adapt!

## ⚡ Common Issues

**Issue**: "Not authenticated" error
- **Solution**: Sign up and sign in with any email/password

**Issue**: No emails showing
- **Solution**: Run the SQL script to add sample data, or wait for OAuth setup

**Issue**: "Failed to connect account"
- **Solution**: This is normal without OAuth configured. Demo accounts will be added instead.

**Issue**: Page won't load
- **Solution**: Make sure dev server is running (npm run dev) and check http://localhost:8080/

## 🔐 Next Steps

To enable **real email integration**:

1. Follow the **PRODUCTION.md** guide to set up:
   - Gmail OAuth credentials
   - Outlook OAuth credentials
   - Supabase Edge Functions

2. With OAuth configured, you can:
   - ✅ Connect real Gmail/Outlook accounts
   - ✅ Fetch actual emails
   - ✅ Send real emails
   - ✅ Sync automatically

---

**Enjoy exploring your unified email client!** 📧✨

Need help? Check:
- **README.md** - Project overview
- **SETUP.md** - Complete setup guide
- **PRODUCTION.md** - Deployment guide
