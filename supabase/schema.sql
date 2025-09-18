-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL, -- RSA public key only
  salt TEXT NOT NULL,
  custom_prompt TEXT,
  openrouter_api_key TEXT,
  ai_filter_enabled BOOLEAN NOT NULL DEFAULT true,
  ai_reviewer_enabled BOOLEAN NOT NULL DEFAULT true,
  auto_delete_mean BOOLEAN NOT NULL DEFAULT false,
  feedback_note TEXT DEFAULT 'Please kindly share your honest thoughts, constructive feedback, or compliments.',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT username_lowercase CHECK (username = lower(username)),
  CONSTRAINT username_allowed_chars CHECK (username ~ '^[a-z0-9-]+$')
);

-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  encrypted_content TEXT NOT NULL,
  encrypted_reasoning TEXT NOT NULL,
  is_mean BOOLEAN NOT NULL DEFAULT false,
  status TEXT CHECK (status IN ('unread', 'read', 'archived')) DEFAULT 'unread',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create feedback_links table
CREATE TABLE IF NOT EXISTS public.feedback_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_links ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Feedback policies
CREATE POLICY "Users can view own feedback" ON public.feedback
  FOR SELECT USING (auth.uid() = user_id);

-- Intentionally no INSERT policy for feedback; inserts are handled server-side via service role

CREATE POLICY "Users can update own feedback" ON public.feedback
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Feedback links policies
CREATE POLICY "Users can view own links" ON public.feedback_links
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own links" ON public.feedback_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own links" ON public.feedback_links
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX idx_feedback_status ON public.feedback(status);
CREATE INDEX idx_feedback_created_at ON public.feedback(created_at);
-- share_token already has a unique index due to UNIQUE constraint
-- Ensure only one active link per user
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_feedback_link_per_user ON public.feedback_links(user_id) WHERE is_active;
CREATE INDEX idx_users_username ON public.users(username);

-- --------
-- MIGRATION for existing deployments (safe if rerun)
-- --------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS ai_reviewer_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auto_delete_mean BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS feedback_note TEXT;

UPDATE public.users
SET feedback_note = 'Please kindly share your honest thoughts, constructive feedback, or compliments.'
WHERE feedback_note IS NULL;

-- Scheduled (delayed) delivery storage (encrypted-at-rest fields only)
CREATE TABLE IF NOT EXISTS public.scheduled_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  encrypted_content TEXT NOT NULL,
  encrypted_reasoning TEXT NOT NULL,
  is_mean BOOLEAN NOT NULL DEFAULT false,
  deliver_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.scheduled_feedback ENABLE ROW LEVEL SECURITY;

-- RLS: access only via service role (no SELECT/INSERT/UPDATE policies)
-- (Server uses SUPABASE_SERVICE_KEY.)

CREATE INDEX IF NOT EXISTS idx_scheduled_feedback_deliver_at ON public.scheduled_feedback(deliver_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_feedback_user_id ON public.scheduled_feedback(user_id);

-- --------
-- SECURITY: Add length constraints to prevent abuse
-- --------
ALTER TABLE public.users ADD CONSTRAINT IF NOT EXISTS username_length CHECK (length(username) >= 3 AND length(username) <= 30);
ALTER TABLE public.users ADD CONSTRAINT IF NOT EXISTS email_length CHECK (length(email) <= 254);
ALTER TABLE public.users ADD CONSTRAINT IF NOT EXISTS custom_prompt_length CHECK (length(custom_prompt) <= 1000);
ALTER TABLE public.users ADD CONSTRAINT IF NOT EXISTS feedback_note_length CHECK (length(feedback_note) <= 200);
ALTER TABLE public.users ADD CONSTRAINT IF NOT EXISTS openrouter_api_key_length CHECK (length(openrouter_api_key) <= 500);
ALTER TABLE public.users ADD CONSTRAINT IF NOT EXISTS public_key_length CHECK (length(public_key) <= 2000);
ALTER TABLE public.users ADD CONSTRAINT IF NOT EXISTS salt_length CHECK (length(salt) <= 100);

ALTER TABLE public.feedback ADD CONSTRAINT IF NOT EXISTS encrypted_content_length CHECK (length(encrypted_content) <= 20000);
ALTER TABLE public.feedback ADD CONSTRAINT IF NOT EXISTS encrypted_reasoning_length CHECK (length(encrypted_reasoning) <= 20000);

ALTER TABLE public.scheduled_feedback ADD CONSTRAINT IF NOT EXISTS sched_encrypted_content_length CHECK (length(encrypted_content) <= 20000);
ALTER TABLE public.scheduled_feedback ADD CONSTRAINT IF NOT EXISTS sched_encrypted_reasoning_length CHECK (length(encrypted_reasoning) <= 20000);

ALTER TABLE public.feedback_links ADD CONSTRAINT IF NOT EXISTS share_token_length CHECK (length(share_token) >= 3 AND length(share_token) <= 100);
