-- This script creates test data for local development
-- Run this in Supabase SQL Editor after signing up

-- Insert demo mail account (after you create a user)
-- Replace 'YOUR_USER_ID' with your actual user ID from auth.users table

-- First, get your user ID by signing up, then run:
-- SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Example demo account
INSERT INTO public.mail_accounts (user_id, email, provider, display_name, auth_type, is_active, sync_status)
VALUES (
  'YOUR_USER_ID', -- Replace with your user ID
  'demo@gmail.com',
  'gmail',
  'Demo Gmail Account',
  'oauth',
  true,
  'success'
) ON CONFLICT (user_id, email) DO NOTHING;

-- Insert sample messages
INSERT INTO public.messages (
  user_id,
  account_id,
  message_id,
  subject,
  from_name,
  from_address,
  to_addresses,
  date,
  body_text,
  body_html,
  snippet,
  has_attachments,
  is_read,
  is_starred
)
SELECT 
  'YOUR_USER_ID', -- Replace with your user ID
  (SELECT id FROM public.mail_accounts WHERE email = 'demo@gmail.com' LIMIT 1),
  'msg-' || generate_series || '@mail.gmail.com',
  CASE (generate_series % 5)
    WHEN 0 THEN 'Welcome to Unified Mail!'
    WHEN 1 THEN 'Your account is ready'
    WHEN 2 THEN 'Important: Security update'
    WHEN 3 THEN 'Weekly Newsletter'
    WHEN 4 THEN 'Meeting reminder for tomorrow'
  END,
  CASE (generate_series % 3)
    WHEN 0 THEN 'John Doe'
    WHEN 1 THEN 'Jane Smith'
    WHEN 2 THEN 'Support Team'
  END,
  CASE (generate_series % 3)
    WHEN 0 THEN 'john@example.com'
    WHEN 1 THEN 'jane@example.com'
    WHEN 2 THEN 'support@unified-mail.com'
  END,
  ARRAY['demo@gmail.com'],
  NOW() - (generate_series || ' hours')::INTERVAL,
  'This is a sample email message body. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  '<p>This is a sample email message body.</p><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>',
  'This is a sample email message body. Lorem ipsum dolor sit amet...',
  (generate_series % 4 = 0),
  (generate_series % 3 != 0),
  (generate_series % 5 = 0)
FROM generate_series(1, 20);
