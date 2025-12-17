# Deployment Documentation

Complete documentation for deploying the Asset Management System.

## 📚 Documentation Files

1. **QUICK_START.md** - Get started in 5 minutes
2. **SETUP_GUIDE.md** - Comprehensive setup and deployment guide
3. **ENV_SETUP.md** - Detailed environment variable configuration
4. **DEPLOYMENT_CHECKLIST.md** - Pre-deployment checklist
5. **database/schema.sql** - Complete database schema
6. **database/migrations/001_remove_rls_policies.sql** - RLS removal migration

## 🚀 Quick Links

- [Quick Start Guide](./QUICK_START.md) - Fastest way to get running
- [Setup Guide](./SETUP_GUIDE.md) - Complete setup instructions
- [Environment Variables](./ENV_SETUP.md) - Configure .env files
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) - Pre-deployment verification

## 📋 What You Need

1. **PostgreSQL Database** - Created and accessible
2. **Google OAuth Credentials** - From Google Cloud Console
3. **Node.js 18+** - For running backend and frontend
4. **Environment Variables** - Configured in `.env` files

## 🎯 Quick Setup (5 Steps)

1. **Create Database:**
   ```bash
   createdb asset_management
   psql -U postgres -d asset_management -f database/schema.sql
   ```

2. **Backend Setup:**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your values
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   echo "VITE_API_URL=http://localhost:3001" > .env
   npm run dev
   ```

4. **Configure Google OAuth:**
   - See [ENV_SETUP.md](./ENV_SETUP.md) for detailed steps

5. **Create Admin User:**
   ```sql
   INSERT INTO users (email, role, department) 
   VALUES ('your-email@gmail.com', 'Super Admin', 'IT');
   ```

## 📁 File Structure

```
asset-management/
├── server/                 # Backend API
│   ├── src/
│   │   ├── config/        # Database configuration
│   │   ├── middleware/    # Auth & authorization
│   │   └── routes/        # API endpoints
│   ├── .env.example       # Environment template
│   └── package.json
├── database/
│   ├── schema.sql         # Complete database schema
│   └── migrations/
│       └── 001_remove_rls_policies.sql
├── src/                   # Frontend React app
├── SETUP_GUIDE.md         # Main setup guide
├── ENV_SETUP.md           # Environment variables
├── QUICK_START.md         # Quick start guide
└── DEPLOYMENT_CHECKLIST.md
```

## 🔑 Key Configuration Points

### Backend (`server/.env`)
- Database connection
- JWT secret
- Google OAuth credentials
- CORS frontend URL

### Frontend (`.env`)
- Backend API URL

## 🆘 Need Help?

1. Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) troubleshooting section
2. Verify all environment variables are set
3. Check database connection
4. Review error logs

## ✅ Verification

After setup, verify:
- [ ] Backend health check: `curl http://localhost:3001/health`
- [ ] Database connection works
- [ ] Frontend loads at `http://localhost:8080`
- [ ] Google OAuth login works
- [ ] You can access the dashboard

---

**Ready to deploy?** Follow the [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions.

