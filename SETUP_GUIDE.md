# Asset Management System - Setup & Deployment Guide

Complete guide to set up and deploy the Asset Management System with PostgreSQL backend.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Environment Variables](#environment-variables)
6. [Google OAuth Configuration](#google-oauth-configuration)
7. [Running the Application](#running-the-application)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js** 18+ and npm (or yarn)
- **PostgreSQL** 13+ 
- **Git**

### Optional (for development)
- **PostgreSQL client** (pgAdmin, DBeaver, or psql CLI)
- **VS Code** or your preferred IDE

---

## Database Setup

### Step 1: Install PostgreSQL

**macOS:**
```bash
brew install postgresql@13
brew services start postgresql@13
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)

### Step 2: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE asset_management;

# Create a user (optional, recommended for production)
CREATE USER asset_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE asset_management TO asset_user;

# Exit psql
\q
```

### Step 3: Run Schema Migration

```bash
# Navigate to project root
cd /path/to/asset-management

# Run the schema file
psql -U postgres -d asset_management -f database/schema.sql

# Or if using a specific user
psql -U asset_user -d asset_management -f database/schema.sql
```

**Verify tables were created:**
```bash
psql -U postgres -d asset_management -c "\dt"
```

You should see:
- assets
- asset_edit_history
- employees
- users
- pending_requests
- orders

### Step 4: Remove RLS Policies (if migrating from Supabase)

If you're migrating from an existing Supabase database, run:

```bash
psql -U postgres -d asset_management -f database/migrations/001_remove_rls_policies.sql
```

---

## Backend Setup

### Step 1: Navigate to Backend Directory

```bash
cd server
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Create Environment File

```bash
# Copy the example file
cp .env.example .env

# Edit the .env file (see Environment Variables section below)
nano .env  # or use your preferred editor
```

### Step 4: Configure Environment Variables

See [Environment Variables](#environment-variables) section for detailed configuration.

### Step 5: Test Database Connection

```bash
# Start the server
npm run dev

# In another terminal, test the health endpoint
curl http://localhost:3001/health
```

You should see:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-..."
}
```

---

## Frontend Setup

### Step 1: Navigate to Project Root

```bash
cd ..  # If you're in the server directory
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Create Environment File

```bash
# Create .env file in project root
touch .env
```

Add the following:
```env
VITE_API_URL=http://localhost:3001
```

### Step 4: Start Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:8080`

---

## Environment Variables

### Backend Environment Variables (`server/.env`)

Create `server/.env` file with the following:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
# Option 1: Use connection string (recommended)
DATABASE_URL=postgresql://user:password@localhost:5432/asset_management

# Option 2: Use individual parameters
DB_HOST=localhost
DB_PORT=5432
DB_NAME=asset_management
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=7d

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:8080

# Session Secret (for Passport.js)
SESSION_SECRET=your-session-secret-change-this-in-production
```

### Frontend Environment Variables (`.env`)

Create `.env` file in project root:

```env
# Backend API URL
VITE_API_URL=http://localhost:3001
```

**For production:**
```env
VITE_API_URL=https://api.yourdomain.com
```

---

## Google OAuth Configuration

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen:
   - User Type: External (or Internal for G Suite)
   - App name: Asset Management System
   - Authorized domains: your domain
6. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Name: Asset Management System
   - Authorized JavaScript origins:
     - `http://localhost:3001` (development)
     - `https://api.yourdomain.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:3001/api/auth/google/callback` (development)
     - `https://api.yourdomain.com/api/auth/google/callback` (production)

### Step 2: Add Credentials to Backend

Copy the **Client ID** and **Client Secret** to `server/.env`:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

### Step 3: Add First Admin User

After setting up the database, add your first admin user:

```sql
INSERT INTO public.users (email, role, department, account_type) 
VALUES ('your-email@gmail.com', 'Super Admin', 'IT', 'Standard');
```

Replace `your-email@gmail.com` with your Google account email.

---

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### Production Mode

**Build Backend:**
```bash
cd server
npm run build
npm start
```

**Build Frontend:**
```bash
npm run build
# Serve the dist folder with a web server (nginx, Apache, etc.)
```

---

## Deployment

### Backend Deployment

#### Option 1: Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Build the backend
cd server
npm run build

# Start with PM2
pm2 start dist/index.js --name asset-management-api

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Option 2: Using Docker

Create `server/Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

Build and run:
```bash
cd server
docker build -t asset-management-api .
docker run -p 3001:3001 --env-file .env asset-management-api
```

#### Option 3: Using Systemd (Linux)

Create `/etc/systemd/system/asset-management-api.service`:
```ini
[Unit]
Description=Asset Management API
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/asset-management/server
ExecStart=/usr/bin/node dist/index.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable asset-management-api
sudo systemctl start asset-management-api
```

### Frontend Deployment

#### Option 1: Static Hosting (Vercel, Netlify, etc.)

```bash
# Build the frontend
npm run build

# Deploy the dist folder
# Vercel: vercel deploy
# Netlify: netlify deploy --prod --dir=dist
```

#### Option 2: Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /path/to/asset-management/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Environment Variables in Production

**Backend:**
- Use environment variables from your hosting platform
- Never commit `.env` files to git
- Use secrets management (AWS Secrets Manager, HashiCorp Vault, etc.)

**Frontend:**
- Build-time variables: Use `VITE_*` prefix
- Update `VITE_API_URL` to production API URL before building

---

## Troubleshooting

### Database Connection Issues

**Error: "Connection refused"**
- Check PostgreSQL is running: `pg_isready` or `sudo systemctl status postgresql`
- Verify connection string in `.env`
- Check firewall settings

**Error: "password authentication failed"**
- Verify username and password in `.env`
- Check `pg_hba.conf` for authentication method

**Error: "database does not exist"**
- Create database: `CREATE DATABASE asset_management;`
- Run schema: `psql -U postgres -d asset_management -f database/schema.sql`

### Backend Issues

**Error: "Cannot find module"**
- Run `npm install` in `server/` directory
- Check Node.js version: `node --version` (should be 18+)

**Error: "Port 3001 already in use"**
- Change `PORT` in `server/.env`
- Or kill process: `lsof -ti:3001 | xargs kill`

**JWT errors**
- Ensure `JWT_SECRET` is set and at least 32 characters
- Check token expiration settings

### Frontend Issues

**Error: "Failed to fetch"**
- Check `VITE_API_URL` in `.env`
- Verify backend is running
- Check CORS settings in backend

**Authentication not working**
- Verify Google OAuth credentials
- Check callback URL matches exactly
- Ensure user exists in database

### Google OAuth Issues

**Error: "redirect_uri_mismatch"**
- Verify callback URL in Google Console matches exactly
- Check for trailing slashes
- Ensure protocol (http/https) matches

**Error: "invalid_client"**
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
- Check credentials are for correct project

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong `JWT_SECRET` (32+ characters, random)
- [ ] Use strong `SESSION_SECRET`
- [ ] Enable HTTPS in production
- [ ] Set secure CORS origins
- [ ] Use environment variables for all secrets
- [ ] Regularly update dependencies
- [ ] Enable database backups
- [ ] Use connection pooling
- [ ] Implement rate limiting (recommended)
- [ ] Set up monitoring and logging

---

## Next Steps

1. **Create first admin user** in database
2. **Test authentication** flow
3. **Import existing data** (if migrating)
4. **Set up backups** for database
5. **Configure monitoring** (optional)
6. **Set up CI/CD** (optional)

---

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review error logs in backend console
3. Check database connection
4. Verify environment variables

---

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)

