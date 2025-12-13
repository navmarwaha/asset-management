# Environment Variables Setup Guide

Step-by-step guide to configure environment variables for the Asset Management System.

## Quick Start

### Backend Environment File

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

3. **Edit the `.env` file** with your values (see details below)

### Frontend Environment File

1. **Navigate to project root:**
   ```bash
   cd ..  # if you're in server directory
   ```

2. **Create `.env` file:**
   ```bash
   touch .env
   ```

3. **Add the API URL:**
   ```env
   VITE_API_URL=http://localhost:3001
   ```

---

## Backend Environment Variables (`server/.env`)

### 1. Server Configuration

```env
# Port for the backend API server
PORT=3001

# Environment: development, production, or test
NODE_ENV=development
```

**Explanation:**
- `PORT`: The port your backend API will run on (default: 3001)
- `NODE_ENV`: Set to `production` when deploying

---

### 2. Database Configuration

**Option A: Connection String (Recommended)**

```env
DATABASE_URL=postgresql://username:password@localhost:5432/asset_management
```

**Option B: Individual Parameters**

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=asset_management
DB_USER=postgres
DB_PASSWORD=your_password
```

**How to get these values:**

1. **DB_HOST**: Usually `localhost` for local development
2. **DB_PORT**: Default PostgreSQL port is `5432`
3. **DB_NAME**: The database name you created (e.g., `asset_management`)
4. **DB_USER**: Your PostgreSQL username (default: `postgres`)
5. **DB_PASSWORD**: Your PostgreSQL password

**Example for local development:**
```env
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/asset_management
```

**Example for production:**
```env
DATABASE_URL=postgresql://asset_user:secure_password@db.example.com:5432/asset_management
```

---

### 3. JWT Configuration

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=7d
```

**How to generate a secure JWT_SECRET:**

**Option 1: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 2: Using OpenSSL**
```bash
openssl rand -hex 32
```

**Option 3: Online generator**
- Visit: https://generate-secret.vercel.app/32

**Example:**
```env
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
JWT_EXPIRES_IN=7d  # Token expires in 7 days
```

**Security Notes:**
- Use a random, long string (minimum 32 characters)
- Never commit this to git
- Use different secrets for development and production
- `JWT_EXPIRES_IN` can be: `1h`, `1d`, `7d`, `30d`, etc.

---

### 4. Google OAuth Configuration

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
```

**How to get Google OAuth credentials:**

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/

2. **Create or select a project**

3. **Enable Google+ API:**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Configure OAuth Consent Screen:**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" (unless using G Suite)
   - Fill in app information:
     - App name: Asset Management System
     - User support email: your email
     - Developer contact: your email
   - Add scopes: `email`, `profile`
   - Add test users (if in testing mode)

5. **Create OAuth 2.0 Client ID:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: **Web application**
   - Name: Asset Management System
   - **Authorized JavaScript origins:**
     - Development: `http://localhost:3001`
     - Production: `https://api.yourdomain.com`
   - **Authorized redirect URIs:**
     - Development: `http://localhost:3001/api/auth/google/callback`
     - Production: `https://api.yourdomain.com/api/auth/google/callback`
   - Click "Create"

6. **Copy credentials:**
   - Copy the **Client ID** → `GOOGLE_CLIENT_ID`
   - Copy the **Client Secret** → `GOOGLE_CLIENT_SECRET`

**Example:**
```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
```

**For Production:**
```env
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/api/auth/google/callback
```

---

### 5. Frontend URL (CORS)

```env
FRONTEND_URL=http://localhost:8080
```

**Explanation:**
- This is the URL where your frontend is hosted
- Used for CORS configuration
- Must match exactly (including protocol and port)

**Development:**
```env
FRONTEND_URL=http://localhost:8080
```

**Production:**
```env
FRONTEND_URL=https://yourdomain.com
```

---

### 6. Session Secret

```env
SESSION_SECRET=your-session-secret-change-this-in-production
```

**Generate a secure session secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Example:**
```env
SESSION_SECRET=9a8b7c6d5e4f3g2h1i0j9k8l7m6n5o4p3q2r1s0t9u8v7w6x5y4z3
```

---

## Frontend Environment Variables (`.env`)

### API URL

```env
VITE_API_URL=http://localhost:3001
```

**Explanation:**
- This is the URL of your backend API
- Must start with `VITE_` to be accessible in the frontend
- No trailing slash

**Development:**
```env
VITE_API_URL=http://localhost:3001
```

**Production:**
```env
VITE_API_URL=https://api.yourdomain.com
```

---

## Complete Example Files

### `server/.env` (Development)

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/asset_management

# JWT Configuration
JWT_SECRET=dev-secret-key-change-in-production-32-chars-minimum
JWT_EXPIRES_IN=7d

# Google OAuth Configuration
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:8080

# Session Secret
SESSION_SECRET=dev-session-secret-change-in-production
```

### `server/.env` (Production)

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
DATABASE_URL=postgresql://asset_user:secure_password@db.example.com:5432/asset_management

# JWT Configuration
JWT_SECRET=production-secret-key-very-long-and-random-64-characters-minimum
JWT_EXPIRES_IN=7d

# Google OAuth Configuration
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/api/auth/google/callback

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# Session Secret
SESSION_SECRET=production-session-secret-very-long-and-random
```

### `.env` (Frontend - Development)

```env
VITE_API_URL=http://localhost:3001
```

### `.env` (Frontend - Production)

```env
VITE_API_URL=https://api.yourdomain.com
```

---

## Verification Steps

### 1. Verify Backend Environment

```bash
cd server
node -e "require('dotenv').config(); console.log('DB:', process.env.DATABASE_URL ? 'Set' : 'Missing'); console.log('JWT:', process.env.JWT_SECRET ? 'Set' : 'Missing');"
```

### 2. Verify Database Connection

```bash
cd server
npm run dev
# Check console for "✅ Connected to PostgreSQL database"
```

### 3. Verify Frontend Environment

```bash
# In browser console after starting frontend
console.log(import.meta.env.VITE_API_URL)
# Should show: http://localhost:3001
```

---

## Security Best Practices

1. **Never commit `.env` files to git**
   - Already in `.gitignore`
   - Double-check before committing

2. **Use different secrets for development and production**

3. **Rotate secrets regularly** (especially in production)

4. **Use environment variable management in production:**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Kubernetes Secrets
   - Docker Secrets

5. **Restrict database access:**
   - Use strong passwords
   - Limit IP access in production
   - Use SSL connections

---

## Troubleshooting

### "Cannot find module" errors
- Ensure you're in the correct directory
- Run `npm install` if needed

### Database connection fails
- Verify `DATABASE_URL` format
- Check PostgreSQL is running
- Verify credentials

### OAuth redirect errors
- Check callback URL matches exactly
- Verify domain is authorized in Google Console
- Check for trailing slashes

### CORS errors
- Verify `FRONTEND_URL` matches frontend URL exactly
- Check protocol (http vs https)
- Check port numbers

---

## Quick Reference

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `PORT` | Yes | `3001` | Backend port |
| `DATABASE_URL` | Yes | `postgresql://...` | Full connection string |
| `JWT_SECRET` | Yes | `random-32-chars+` | Generate securely |
| `GOOGLE_CLIENT_ID` | Yes | `xxx.apps.googleusercontent.com` | From Google Console |
| `GOOGLE_CLIENT_SECRET` | Yes | `GOCSPX-xxx` | From Google Console |
| `GOOGLE_CALLBACK_URL` | Yes | `http://localhost:3001/api/auth/google/callback` | Must match Google Console |
| `FRONTEND_URL` | Yes | `http://localhost:8080` | For CORS |
| `SESSION_SECRET` | Yes | `random-32-chars+` | Generate securely |
| `VITE_API_URL` | Yes | `http://localhost:3001` | Frontend only |

---

## Need Help?

If you encounter issues:
1. Check all required variables are set
2. Verify no typos in variable names
3. Check file is named exactly `.env` (not `.env.txt`)
4. Restart the server after changing `.env`
5. Check console for specific error messages

