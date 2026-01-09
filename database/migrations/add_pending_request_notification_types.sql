-- =====================================================
-- Migration: Add pending request notification types
-- =====================================================
-- Description: Extends notifications table to support pending request notifications
--              so admins are notified when operators create assignment/return requests
-- Date: 2024
-- =====================================================

-- Drop existing constraint
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_notification_type_check;

-- Add new constraint with pending request types
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_notification_type_check 
CHECK (notification_type IN (
  'asset_assigned', 
  'asset_returned',
  'pending_request_assign',
  'pending_request_return'
));

-- =====================================================
-- Migration Complete
-- =====================================================

