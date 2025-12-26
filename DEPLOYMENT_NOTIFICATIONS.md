# Deployment Guide: Notifications Feature

This guide covers deploying the in-app notifications feature for asset assignments and returns.

## 📋 Pre-Deployment Checklist

### 1. Database Changes
- [ ] Run the database migration to create the `notifications` table
- [ ] Verify the table was created successfully
- [ ] Check that indexes were created

### 2. Backend Changes
- [ ] Verify all new files are present:
  - `server/src/routes/notifications.ts`
  - `server/src/services/notificationService.ts`
- [ ] Verify `server/src/routes/assets.ts` has notification integration
- [ ] Verify `server/src/index.ts` includes notifications route
- [ ] Rebuild the backend TypeScript code
- [ ] Restart the backend server

### 3. Frontend Changes
- [ ] Verify `src/components/NotificationDropdown.tsx` exists
- [ ] Verify `src/lib/api-client.ts` has notification methods
- [ ] Verify `src/components/Dashboard.tsx` includes NotificationDropdown
- [ ] Rebuild the frontend (if using production build)

## 🗄️ Database Migration

### Option 1: Using the Migration File (Recommended)

```bash
# Connect to your PostgreSQL database
psql -h <DB_HOST> -U <DB_USER> -d <DB_NAME>

# Run the migration
\i database/migrations/add_notifications_table.sql

# Or directly:
psql -h <DB_HOST> -U <DB_USER> -d <DB_NAME> -f database/migrations/add_notifications_table.sql
```

### Option 2: Manual SQL Execution

Copy and paste the SQL from `database/migrations/add_notifications_table.sql` into your database client and execute it.

### Verify Migration

```sql
-- Check if table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'notifications';

-- Check table structure
\d notifications

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'notifications';
```

## 🚀 Backend Deployment

### 1. Build Backend (if using TypeScript)

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
# Stop the current process and restart:
npm start
# or
node dist/index.js
```

### 3. Verify Backend Routes

Test that the notifications API is accessible:

```bash
# Health check
curl http://your-server:3001/health

# Test notifications endpoint (requires auth token)
curl -H "Authorization: Bearer <YOUR_TOKEN>" \
     http://your-server:3001/api/notifications/unread-count
```

## 🎨 Frontend Deployment

### Development Mode

If running in development mode, changes should be picked up automatically by Vite HMR.

```bash
cd /path/to/asset-management
npm run dev
```

### Production Build

If deploying a production build:

```bash
# Build the frontend
npm run build

# The built files will be in the 'dist' directory
# Serve them using your web server (nginx, Apache, etc.)
```

### Verify Frontend

1. Open the application in your browser
2. Log in as a Super Admin or Admin user
3. Look for the notification bell icon in the header (next to the Requests button)
4. Assign or return an asset to trigger a notification
5. Click the bell icon to see notifications

## ✅ Testing the Feature

### 1. Test Notification Creation

1. Log in as a user with Operator role or higher
2. Assign an asset to an employee
3. Check that notifications were created for all Super Admin/Admin users

```sql
-- Check notifications in database
SELECT * FROM notifications 
ORDER BY created_at DESC 
LIMIT 10;
```

### 2. Test Notification Display

1. Log in as a Super Admin or Admin user
2. Click the notification bell icon
3. Verify you see the notification about the asset assignment
4. Click on a notification to mark it as read
5. Verify it becomes dimmed and shows a checkmark

### 3. Test Mark All as Read

1. With multiple unread notifications
2. Click "Mark all read" button
3. Verify all notifications are marked as read

### 4. Test Auto-Refresh

1. Enable "Auto Refresh" toggle in the dashboard
2. Assign/return an asset from another session
3. Verify new notifications appear automatically (within 5 seconds)

## 🔍 Troubleshooting

### Notifications Not Appearing

1. **Check database connection**: Verify backend can connect to PostgreSQL
2. **Check user roles**: Ensure users have 'Super Admin' or 'Admin' role
3. **Check backend logs**: Look for errors in notification creation
4. **Check browser console**: Look for API errors in frontend

### Backend Errors

```bash
# Check backend logs
tail -f /path/to/server/logs/app.log

# Or if using PM2
pm2 logs asset-management-server
```

Common issues:
- Database connection errors
- Missing table (run migration)
- Permission errors (check user roles)

### Frontend Errors

1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed API calls
4. Verify API base URL is correct in environment variables

## 📝 Environment Variables

No new environment variables are required. The notification system uses:
- Existing database connection (same as rest of the app)
- Existing authentication system

## 🔄 Rollback Plan

If you need to rollback:

1. **Remove frontend component** (optional - notifications just won't show):
   - Remove `NotificationDropdown` from `Dashboard.tsx`

2. **Disable backend route** (optional - API will return 404):
   - Comment out notifications route in `server/src/index.ts`

3. **Drop notifications table** (if needed):
   ```sql
   DROP TABLE IF EXISTS public.notifications CASCADE;
   ```

## 📊 Monitoring

After deployment, monitor:
- Database size (notifications table will grow over time)
- API response times for `/api/notifications` endpoints
- Number of unread notifications per user

Consider adding cleanup job for old notifications (e.g., delete notifications older than 90 days).

## ✨ Feature Summary

- ✅ In-app notifications for Super Admin and Admin users
- ✅ Notifications appear when assets are assigned or returned
- ✅ Unread badge count on bell icon
- ✅ Mark individual notifications as read
- ✅ Mark all notifications as read
- ✅ Auto-refresh support
- ✅ No external dependencies (PostgreSQL only)
- ✅ No email functionality (in-app only)

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Notes**: _______________

