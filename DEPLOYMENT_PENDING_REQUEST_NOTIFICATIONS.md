# Deployment Guide: Pending Request Notifications

This guide covers deploying the fix for pending request notifications when Operators create assignment/return requests.

## 📋 Issue Fixed

**Problem**: When Operator role users create assignment or return requests, Admin/Super Admin users were not receiving notifications.

**Solution**: Added notification creation when pending requests are created, so admins are immediately notified.

## 🗄️ Database Migration

### Run the Migration

```bash
# Connect to your PostgreSQL database
psql -h <DB_HOST> -U <DB_USER> -d <DB_NAME>

# Run the migration
\i database/migrations/add_pending_request_notification_types.sql

# Or directly:
psql -h <DB_HOST> -U <DB_USER> -d <DB_NAME> -f database/migrations/add_pending_request_notification_types.sql
```

### Verify Migration

```sql
-- Check constraint was updated
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'notifications_notification_type_check';

-- Should show: CHECK (notification_type IN ('asset_assigned', 'asset_returned', 'pending_request_assign', 'pending_request_return'))
```

## 🚀 Backend Deployment

### 1. Rebuild Backend (if using TypeScript)

```bash
cd server
npm run build
```

### 2. Restart Backend Server

```bash
# If using PM2
pm2 restart asset-management-server

# If using systemd
sudo systemctl restart asset-management

# If running directly
npm start
# or
node dist/index.js
```

### 3. Verify Backend Changes

The following files were updated:
- `server/src/routes/pending-requests.ts` - Added notification creation
- `server/src/services/notificationService.ts` - Added pending request notification support

## 🎨 Frontend Deployment

### Development Mode

Changes should be picked up automatically by Vite HMR:

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

## ✅ Testing the Fix

### 1. Test Pending Request Notification Creation

1. Log in as an **Operator** user
2. Assign an asset to an employee (this creates a pending request)
3. Check the database to verify notification was created:

```sql
SELECT * FROM notifications 
WHERE notification_type IN ('pending_request_assign', 'pending_request_return')
ORDER BY created_at DESC 
LIMIT 5;
```

### 2. Test Notification Display

1. Log in as a **Super Admin** or **Admin** user
2. Click the notification bell icon
3. Verify you see notifications like:
   - "Pending: Assign Asset ABC (ABC-001) to John Doe (EMP-001)"
   - "Pending: Return Asset XYZ (XYZ-002) from Jane Smith (EMP-002)"

### 3. Test End-to-End Flow

1. **Operator** creates an assignment request
2. **Admin/Super Admin** should see:
   - Notification in the bell dropdown
   - Pending request in the Requests section
   - Badge count updated

## 📝 Changes Summary

### Database
- ✅ Extended notification types to include `pending_request_assign` and `pending_request_return`
- ✅ Migration file created: `database/migrations/add_pending_request_notification_types.sql`

### Backend
- ✅ Added `notifyAdminsAboutPendingRequest()` function in notification service
- ✅ Integrated notification creation in pending requests route
- ✅ Fetches employee names for better notification messages

### Frontend
- ✅ Updated notification types in TypeScript interfaces
- ✅ Updated notification message formatting to handle pending requests
- ✅ Notifications show "Pending: Assign/Return" prefix

## 🔍 What Happens Now

**Before Fix:**
- Operator creates request → Request saved → No notification → Admin must manually check

**After Fix:**
- Operator creates request → Request saved → **Notification created** → Admin sees notification immediately

## 🐛 Troubleshooting

### Notifications Not Appearing

1. **Check database migration**: Ensure the constraint was updated
2. **Check backend logs**: Look for errors in notification creation
3. **Verify user roles**: Ensure users have 'Super Admin' or 'Admin' role
4. **Check browser console**: Look for API errors

### Backend Errors

```bash
# Check backend logs
tail -f /path/to/server/logs/app.log

# Or if using PM2
pm2 logs asset-management-server
```

Common issues:
- Database constraint error (run migration)
- Employee not found (notification still created, just without employee name)
- Permission errors

## 📊 Notification Types

The system now supports 4 notification types:

1. **`asset_assigned`** - Asset was assigned (after approval)
2. **`asset_returned`** - Asset was returned (after approval)
3. **`pending_request_assign`** - New assignment request created (needs approval)
4. **`pending_request_return`** - New return request created (needs approval)

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Notes**: _______________

