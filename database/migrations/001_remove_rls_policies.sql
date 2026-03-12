-- =====================================================
-- Migration: Remove Row Level Security (RLS) Policies
-- =====================================================
-- This migration removes all RLS policies and disables
-- RLS on all tables. Authorization is now handled at
-- the application level.
-- =====================================================

-- Drop all RLS policies from assets table
DROP POLICY IF EXISTS "Assets are viewable by everyone" ON public.assets;
DROP POLICY IF EXISTS "Assets can be inserted by everyone" ON public.assets;
DROP POLICY IF EXISTS "Assets can be updated by everyone" ON public.assets;
DROP POLICY IF EXISTS "Assets can be deleted by everyone" ON public.assets;

-- Disable RLS on assets table
ALTER TABLE IF EXISTS public.assets DISABLE ROW LEVEL SECURITY;

-- Drop all RLS policies from pending_requests table
DROP POLICY IF EXISTS "Authenticated users can view pending requests" ON public.pending_requests;
DROP POLICY IF EXISTS "Authenticated users can insert pending requests" ON public.pending_requests;
DROP POLICY IF EXISTS "Authenticated users can update pending requests" ON public.pending_requests;

-- Disable RLS on pending_requests table
ALTER TABLE IF EXISTS public.pending_requests DISABLE ROW LEVEL SECURITY;

-- Drop any RLS policies from employees table (if they exist)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'employees' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.employees';
    END LOOP;
END $$;

-- Disable RLS on employees table
ALTER TABLE IF EXISTS public.employees DISABLE ROW LEVEL SECURITY;

-- Drop any RLS policies from users table (if they exist)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.users';
    END LOOP;
END $$;

-- Disable RLS on users table
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;

-- Drop any RLS policies from asset_edit_history table (if they exist)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'asset_edit_history' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.asset_edit_history';
    END LOOP;
END $$;

-- Disable RLS on asset_edit_history table
ALTER TABLE IF EXISTS public.asset_edit_history DISABLE ROW LEVEL SECURITY;

-- Drop any RLS policies from orders table (if they exist)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'orders' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.orders';
    END LOOP;
END $$;

-- Disable RLS on orders table
ALTER TABLE IF EXISTS public.orders DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- Migration Complete
-- =====================================================
-- All RLS policies have been removed and RLS has been
-- disabled on all tables. Authorization is now handled
-- entirely at the application level through the backend API.
-- =====================================================

