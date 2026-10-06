-- ============================================================================
-- DAYFLOW HRMS — Supabase Production SQL Setup
-- Run this entire script in the Supabase SQL Editor:
-- Project → SQL Editor → New Query → Paste → Run
-- ============================================================================

-- ── 1. PROFILES TABLE ────────────────────────────────────────────────────────
-- Extends Supabase auth.users with HR-specific fields.
CREATE TABLE IF NOT EXISTS profiles (
    id         UUID         REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name  VARCHAR(255),
    role       VARCHAR(50)  DEFAULT 'employee',
    created_at TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

-- ── 2. EMPLOYEE REQUESTS TABLE ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employee_requests (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID        REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    request_type        VARCHAR(50) NOT NULL,
    start_date          DATE        NOT NULL,
    end_date            DATE        NOT NULL,
    justification       TEXT        NOT NULL,
    urgency             VARCHAR(20) NOT NULL,
    status              VARCHAR(50) DEFAULT 'Pending',
    ai_evaluation_json  JSONB,
    created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ── 3. INDEXES ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_employee_requests_user_id   ON employee_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_requests_status    ON employee_requests(status);
CREATE INDEX IF NOT EXISTS idx_employee_requests_created_at ON employee_requests(created_at DESC);

-- ── 4. ROW LEVEL SECURITY ─────────────────────────────────────────────────────
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_requests ENABLE ROW LEVEL SECURITY;

-- ── 5. PROFILES POLICIES ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own profile"   ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Allow insert on registration (anon can insert their own row)
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ── 6. EMPLOYEE REQUESTS POLICIES ────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own requests"   ON employee_requests;
DROP POLICY IF EXISTS "Users can insert own requests" ON employee_requests;
DROP POLICY IF EXISTS "Admins view all requests"      ON employee_requests;
DROP POLICY IF EXISTS "Service role bypass"           ON employee_requests;

-- Employees: view their own requests
CREATE POLICY "Users can view own requests"
    ON employee_requests FOR SELECT
    USING (auth.uid() = user_id);

-- Employees: insert only their own requests
CREATE POLICY "Users can insert own requests"
    ON employee_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admins: view ALL requests
CREATE POLICY "Admins view all requests"
    ON employee_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id   = auth.uid()
            AND   profiles.role = 'admin'
        )
    );

-- ── 7. AUTO-CREATE PROFILE ON SIGNUP TRIGGER ─────────────────────────────────
-- When a new user signs up via Supabase Auth, automatically create their profile.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
        'employee'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── 8. REALTIME PUBLICATION ───────────────────────────────────────────────────
-- Enable realtime for employee_requests so the dashboard updates live.
ALTER PUBLICATION supabase_realtime ADD TABLE employee_requests;

-- ── 9. VERIFY SETUP ───────────────────────────────────────────────────────────
SELECT
    table_name,
    (SELECT count(*) FROM information_schema.columns
     WHERE columns.table_name = tables.table_name
     AND columns.table_schema = 'public') AS column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'employee_requests')
ORDER BY table_name;
