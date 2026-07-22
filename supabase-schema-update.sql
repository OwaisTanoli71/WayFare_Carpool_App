-- =========================================================
-- WAYFARE CARPOOL APP - SUPABASE SCHEMA & ROLES UPDATE
-- =========================================================

-- 1. Create the verifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.verifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  car_details JSONB,
  images JSONB,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing verification policies if updating
DROP POLICY IF EXISTS "Admins bypass RLS for verifications" ON public.verifications;
DROP POLICY IF EXISTS "Users can read own verifications" ON public.verifications;
DROP POLICY IF EXISTS "Users can insert own verifications" ON public.verifications;

-- 4. Define Security Policies (Allow both 'admin' and 'super_admin')
CREATE POLICY "Admins bypass RLS for verifications" ON public.verifications 
  FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

CREATE POLICY "Users can read own verifications" ON public.verifications 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verifications" ON public.verifications 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Add verification_status column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified';

-- =========================================================
-- PERSISTENT AUDIT ACTIVITY LOGS TABLE
-- =========================================================

-- 6. Create activity_logs table for persistent, real-time audit logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_email TEXT NOT NULL,
  action_type TEXT NOT NULL,
  target_entity TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins access activity logs" ON public.activity_logs;
CREATE POLICY "Admins access activity logs" ON public.activity_logs 
  FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

-- Enable Real-Time on activity_logs table
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;

-- =========================================================
-- ROLE MANAGEMENT: SEPARATING 'super_admin' AND 'admin'
-- =========================================================

-- 7. Set admin@wayfare.com explicitly to 'super_admin' role
UPDATE public.users 
SET role = 'super_admin' 
WHERE email = 'admin@wayfare.com';

-- 8. Ensure role column check allows 'super_admin'
DO $$
BEGIN
  ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
  ALTER TABLE public.users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('rider', 'driver', 'both', 'admin', 'super_admin'));
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;
