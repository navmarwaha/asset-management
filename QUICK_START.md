# Quick Start Guide

Get the Asset Management System up and running in 5 minutes.

## Prerequisites Check

```bash
# Check Node.js version (should be 18+)
node --version

# Check PostgreSQL is installed
psql --version

# Check PostgreSQL is running
pg_isready
```

## Step 1: Database Setup (2 minutes)

```bash
# Create database
createdb asset_management

# Or using psql
psql -U postgres
CREATE DATABASE asset_management;
\q

# Run schema
psql -U postgres -d asset_management -f database/schema.sql
```

## Step 2: Backend Setup (2 minutes)

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env file (minimum required):
# DATABASE_URL=postgresql://postgres:your_password@localhost:5432/asset_management
# JWT_SECRET=your-random-32-character-secret
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
# GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
# FRONTEND_URL=http://localhost:8080
# SESSION_SECRET=your-random-session-secret

# Start backend
npm run dev
```

**Generate secrets quickly:**
```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 3: Frontend Setup (1 minute)

```bash
# In a new terminal, navigate to project root
cd /path/to/asset-management

# Install dependencies (if not already done)
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:3001" > .env

# Start frontend
npm run dev
```

## Step 4: Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → Enable Google+ API
3. Create OAuth 2.0 Client ID
4. Add authorized redirect URI: `http://localhost:3001/api/auth/google/callback`
5. Copy Client ID and Secret to `server/.env`

## Step 5: Create First Admin User

```bash
psql -U postgres -d asset_management

INSERT INTO users (email, role, department, account_type) 
VALUES ('your-email@gmail.com', 'Super Admin', 'IT', 'Standard');
```

Replace `your-email@gmail.com` with your Google account email.

## Step 6: Test

1. Open browser: `http://localhost:8080`
2. Click "Continue with Google"
3. Sign in with your Google account
4. You should be redirected back and logged in!

## Troubleshooting

**Backend won't start:**
- Check database connection in `.env`
- Verify PostgreSQL is running
- Check port 3001 is available

**Frontend can't connect:**
- Verify `VITE_API_URL` in `.env`
- Check backend is running
- Check browser console for errors

**OAuth not working:**
- Verify callback URL matches exactly
- Check Google Console settings
- Ensure user exists in database

## Next Steps

- See `SETUP_GUIDE.md` for detailed instructions
- See `ENV_SETUP.md` for environment variable details
- See `DEPLOYMENT_CHECKLIST.md` for production deployment

