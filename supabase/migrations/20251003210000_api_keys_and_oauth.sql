-- API Keys management for OAuth credentials
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'gmail', 'outlook', 'imap'
  key_name VARCHAR(100) NOT NULL,
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL, -- Encrypted
  redirect_uri TEXT,
  scopes TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider, key_name)
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API keys"
  ON public.api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
  ON public.api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
  ON public.api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- IMAP credentials table (encrypted storage)
CREATE TABLE public.imap_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.mail_accounts(id) ON DELETE CASCADE,
  host VARCHAR(255) NOT NULL,
  port INT NOT NULL DEFAULT 993,
  username VARCHAR(255) NOT NULL,
  password TEXT NOT NULL, -- Encrypted
  use_tls BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_id)
);

ALTER TABLE public.imap_credentials ENABLE ROW LEVEL SECURITY;

-- Only allow access via edge functions (service role)
CREATE POLICY "Service role only for IMAP"
  ON public.imap_credentials
  USING (false);

-- Add encryption key reference to oauth_tokens
ALTER TABLE public.oauth_tokens ADD COLUMN IF NOT EXISTS encryption_key_id VARCHAR(100);

-- Sync jobs table for tracking email sync operations
CREATE TABLE public.sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.mail_accounts(id) ON DELETE CASCADE,
  job_type VARCHAR(50) NOT NULL, -- 'full_sync', 'incremental', 'send'
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  messages_synced INT DEFAULT 0,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sync_jobs_account ON public.sync_jobs(account_id, created_at DESC);
CREATE INDEX idx_sync_jobs_status ON public.sync_jobs(status) WHERE status IN ('pending', 'running');

ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sync jobs for their accounts"
  ON public.sync_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.mail_accounts
      WHERE mail_accounts.id = sync_jobs.account_id
      AND mail_accounts.user_id = auth.uid()
    )
  );

-- Drafts table for email composition
CREATE TABLE public.drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.mail_accounts(id) ON DELETE SET NULL,
  thread_id UUID REFERENCES public.threads(id) ON DELETE SET NULL,
  subject TEXT,
  to_addresses TEXT[],
  cc_addresses TEXT[],
  bcc_addresses TEXT[],
  body_text TEXT,
  body_html TEXT,
  attachments JSONB,
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own drafts"
  ON public.drafts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own drafts"
  ON public.drafts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts"
  ON public.drafts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drafts"
  ON public.drafts FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for drafts updated_at
CREATE TRIGGER update_drafts_updated_at
  BEFORE UPDATE ON public.drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_imap_credentials_updated_at
  BEFORE UPDATE ON public.imap_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for sync jobs and drafts
ALTER PUBLICATION supabase_realtime ADD TABLE public.sync_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drafts;
