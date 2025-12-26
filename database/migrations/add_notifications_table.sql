-- =====================================================
-- Migration: Add notifications table
-- =====================================================
-- Description: Creates notifications table for in-app notifications
--              when assets are assigned or returned
-- Date: 2024
-- =====================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_email TEXT NOT NULL REFERENCES public.users(email) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('asset_assigned', 'asset_returned')),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  asset_name TEXT,
  asset_asset_id TEXT,
  assigned_to TEXT,
  employee_id TEXT,
  employee_name TEXT,
  action_by TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_email ON public.notifications(user_email);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_asset_id ON public.notifications(asset_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_email, is_read) WHERE is_read = false;

-- =====================================================
-- Migration Complete
-- =====================================================

