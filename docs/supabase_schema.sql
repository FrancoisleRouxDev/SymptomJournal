-- ==============================================================================
-- SymptomJournal Supabase SQL Migration
-- Features: Common Conditions, Notifications, and Doctor Summaries
-- Compatible with: Supabase Auth & public.users table with Row Level Security (RLS)
-- ==============================================================================

-- 1. COMMON CONDITIONS TABLE
-- Stores pre-existing and diagnosed conditions per user (e.g. Migraine, Asthma, IBS)
CREATE TABLE IF NOT EXISTS public.common_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    condition_name VARCHAR(100) NOT NULL,
    noted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for fast user queries
CREATE INDEX IF NOT EXISTS idx_common_conditions_user_id ON public.common_conditions(user_id);

-- Enable RLS
ALTER TABLE public.common_conditions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for common_conditions
CREATE POLICY "Users can view their own conditions"
    ON public.common_conditions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conditions"
    ON public.common_conditions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conditions"
    ON public.common_conditions
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conditions"
    ON public.common_conditions
    FOR DELETE
    USING (auth.uid() = user_id);


-- 2. NOTIFICATIONS TABLE
-- Stores scheduled daily check-in reminders, AI pattern alerts, and system notices
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'daily_reminder', -- 'daily_reminder', 'pattern_alert', 'system'
    title VARCHAR(150) NOT NULL DEFAULT 'Daily Check-in',
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for user notifications and unread lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
    ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications (mark as read)"
    ON public.notifications
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users or server can insert notifications"
    ON public.notifications
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
    ON public.notifications
    FOR DELETE
    USING (auth.uid() = user_id);


-- 3. DOCTOR SUMMARIES TABLE (Pitch ERD Completion)
-- Persists generated clinical appointment reports for archive & re-export
CREATE TABLE IF NOT EXISTS public.doctor_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    analysis_id UUID REFERENCES public.ai_analysis(id) ON DELETE SET NULL,
    summary_text TEXT NOT NULL,
    date_range_start TIMESTAMPTZ,
    date_range_end TIMESTAMPTZ,
    exported BOOLEAN NOT NULL DEFAULT FALSE,
    exported_at TIMESTAMPTZ,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_doctor_summaries_user_id ON public.doctor_summaries(user_id);

ALTER TABLE public.doctor_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own doctor summaries"
    ON public.doctor_summaries
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own doctor summaries"
    ON public.doctor_summaries
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own doctor summaries"
    ON public.doctor_summaries
    FOR UPDATE
    USING (auth.uid() = user_id);
