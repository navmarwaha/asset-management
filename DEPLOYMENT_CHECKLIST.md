# Deployment Checklist

Use this checklist to ensure everything is set up correctly before deploying.

## Pre-Deployment

### Database
- [ ] PostgreSQL installed and running
- [ ] Database created (`asset_management`)
- [ ] Schema file executed successfully (`database/schema.sql`)
- [ ] RLS policies removed (if migrating from Supabase)
- [ ] Database user created with appropriate permissions
- [ ] Connection tested from backend

### Backend
- [ ] All dependencies installed (`cd server && npm install`)
- [ ] `.env` file created in `server/` directory
- [ ] All environment variables configured
- [ ] Database connection string verified
- [ ] JWT_SECRET generated and set (32+ characters)
- [ ] Google OAuth credentials configured
- [ ] Callback URL matches Google Console settings
- [ ] CORS configured for frontend URL
- [ ] Server starts without errors (`npm run dev`)
- [ ] Health check endpoint works (`/health`)

### Frontend
- [ ] All dependencies installed (`npm install`)
- [ ] `.env` file created in project root
- [ ] `VITE_API_URL` set correctly
- [ ] Frontend builds successfully (`npm run build`)
- [ ] No console errors in browser

### Google OAuth
- [ ] Google Cloud project created
- [ ] Google+ API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 Client ID created
- [ ] Authorized JavaScript origins added
- [ ] Authorized redirect URIs added
- [ ] Client ID and Secret copied to backend `.env`

### Initial Setup
- [ ] First admin user created in database
- [ ] Test login with Google OAuth
- [ ] Verify JWT token is stored
- [ ] Test API endpoints with authentication

## Production Deployment

### Security
- [ ] All secrets changed from defaults
- [ ] Strong passwords set for database
- [ ] JWT_SECRET is random and secure
- [ ] HTTPS enabled for production
- [ ] CORS restricted to production domain
- [ ] Environment variables secured (not in git)
- [ ] Database access restricted by IP (if possible)

### Backend Production
- [ ] `NODE_ENV=production` set
- [ ] Backend built (`npm run build`)
- [ ] Process manager configured (PM2, systemd, etc.)
- [ ] Logging configured
- [ ] Error handling tested
- [ ] Health check endpoint accessible
- [ ] Database connection pooling configured

### Frontend Production
- [ ] Frontend built (`npm run build`)
- [ ] `VITE_API_URL` points to production API
- [ ] Static files served correctly
- [ ] API calls work from production URL
- [ ] No console errors

### Database Production
- [ ] Database backups configured
- [ ] Connection string uses SSL (if remote)
- [ ] Database user has minimal required permissions
- [ ] Indexes created for performance

### Monitoring
- [ ] Error logging set up
- [ ] Application monitoring configured (optional)
- [ ] Database monitoring configured (optional)
- [ ] Uptime monitoring configured (optional)

## Post-Deployment

### Testing
- [ ] Login works
- [ ] All CRUD operations work
- [ ] Asset assignment/return works
- [ ] Pending requests workflow works
- [ ] Employee management works
- [ ] User management works
- [ ] Orders work
- [ ] Polling updates data correctly
- [ ] No console errors

### Documentation
- [ ] Deployment process documented
- [ ] Environment variables documented
- [ ] Backup procedures documented
- [ ] Rollback procedure documented

## Quick Verification Commands

```bash
# Check database connection
psql -U postgres -d asset_management -c "SELECT COUNT(*) FROM assets;"

# Check backend health
curl http://localhost:3001/health

# Check frontend API URL
# Open browser console and run:
# console.log(import.meta.env.VITE_API_URL)

# Test authentication
# Try logging in with Google OAuth
```

## Rollback Plan

If something goes wrong:

1. **Backend issues:**
   - Check logs: `pm2 logs` or `journalctl -u asset-management-api`
   - Verify environment variables
   - Check database connection

2. **Database issues:**
   - Restore from backup
   - Check connection string
   - Verify user permissions

3. **Frontend issues:**
   - Rebuild frontend
   - Check API URL
   - Clear browser cache

## Support Contacts

- Database Admin: [Your contact]
- Backend Developer: [Your contact]
- DevOps: [Your contact]

