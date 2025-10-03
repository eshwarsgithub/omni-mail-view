-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create profiles table for user info
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  display_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Mail accounts table (Gmail, Outlook, IMAP)
CREATE TABLE public.mail_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'gmail', 'outlook', 'imap'
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  auth_type VARCHAR(20) NOT NULL, -- 'oauth', 'password'
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'syncing', 'success', 'error'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, email)
);

ALTER TABLE public.mail_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mail accounts"
  ON public.mail_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mail accounts"
  ON public.mail_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mail accounts"
  ON public.mail_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mail accounts"
  ON public.mail_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- OAuth tokens table (encrypted storage)
CREATE TABLE public.oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.mail_accounts(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  access_token TEXT, -- Will be encrypted
  refresh_token TEXT, -- Will be encrypted
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Only allow access via edge functions (service role)
CREATE POLICY "Service role only"
  ON public.oauth_tokens
  USING (false);

-- Threads table (conversation grouping)
CREATE TABLE public.threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject VARCHAR(512),
  first_message_date TIMESTAMP WITH TIME ZONE,
  last_message_date TIMESTAMP WITH TIME ZONE,
  message_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own threads"
  ON public.threads FOR SELECT
  USING (auth.uid() = user_id);

-- Messages table (normalized emails)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.mail_accounts(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES public.threads(id) ON DELETE SET NULL,
  message_id VARCHAR(512) NOT NULL, -- RFC822 Message-ID
  subject TEXT,
  from_address VARCHAR(255),
  from_name VARCHAR(255),
  to_addresses TEXT[],
  cc_addresses TEXT[],
  date TIMESTAMP WITH TIME ZONE,
  body_text TEXT,
  body_html TEXT,
  snippet TEXT, -- First 200 chars preview
  has_attachments BOOLEAN DEFAULT FALSE,
  is_read BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  is_spam BOOLEAN DEFAULT FALSE,
  labels TEXT[],
  raw_storage_key TEXT, -- S3/Storage key for raw email
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, message_id)
);

CREATE INDEX idx_messages_user_date ON public.messages(user_id, date DESC);
CREATE INDEX idx_messages_account ON public.messages(account_id);
CREATE INDEX idx_messages_thread ON public.messages(thread_id);
CREATE INDEX idx_messages_unread ON public.messages(user_id, is_read) WHERE is_read = false;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages"
  ON public.messages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
  ON public.messages FOR DELETE
  USING (auth.uid() = user_id);

-- Attachments table
CREATE TABLE public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  content_type VARCHAR(100),
  size_bytes BIGINT,
  storage_key TEXT, -- Storage bucket key
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments of their messages"
  ON public.attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.messages
      WHERE messages.id = attachments.message_id
      AND messages.user_id = auth.uid()
    )
  );

-- Audit log table
CREATE TABLE public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON public.audit_log(user_id, created_at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs"
  ON public.audit_log FOR SELECT
  USING (auth.uid() = user_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mail_accounts;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mail_accounts_updated_at
  BEFORE UPDATE ON public.mail_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();