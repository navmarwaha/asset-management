# Asset Management System - Backend API

Backend API server for the Asset Management System, built with Express.js and PostgreSQL.

## Prerequisites

- Node.js 18+ 
- PostgreSQL 13+
- npm or yarn

## Setup

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - Database connection details
   - JWT secret
   - Google OAuth credentials
   - Frontend URL

3. **Set up database:**
   - Create a PostgreSQL database
   - Run the migrations from `../supabase/migrations/` (you'll need to adapt them to remove Supabase-specific features)

4. **Run the server:**
   ```bash
   # Development mode (with hot reload)
   npm run dev

   # Production mode
   npm run build
   npm start
   ```

## API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh JWT token

### Assets
- `GET /api/assets` - Get all assets (paginated)
- `GET /api/assets/all` - Get all assets (no pagination)
- `GET /api/assets/:id` - Get asset by ID
- `POST /api/assets` - Create asset
- `PUT /api/assets/:id` - Update asset
- `DELETE /api/assets/:id` - Delete asset (Super Admin only)
- `GET /api/assets/:id/history` - Get asset edit history
- `POST /api/assets/:id/history` - Log edit history

### Pending Requests
- `GET /api/pending-requests` - Get all pending requests
- `GET /api/pending-requests/count` - Get count of pending requests
- `GET /api/pending-requests/:id` - Get request by ID
- `POST /api/pending-requests` - Create request
- `PUT /api/pending-requests/:id` - Update/approve/reject request
- `DELETE /api/pending-requests/:id` - Delete request

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create employee
- `POST /api/employees/bulk` - Create multiple employees
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/me` - Get current user
- `GET /api/users/:email` - Get user by email
- `POST /api/users` - Create user (Admin only)
- `PUT /api/users/:email` - Update user
- `DELETE /api/users/:email` - Delete user (Admin only)

### Orders
- `GET /api/orders` - Get all orders (with filters)
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Authorization

Routes are protected by role-based access control:
- **Super Admin**: Full access
- **Admin**: Most operations except deletion
- **Operator**: Limited operations (requires approval workflow)
- **Viewer**: Read-only access

## Database Schema

The API expects the following tables:
- `assets`
- `employees`
- `users`
- `pending_requests`
- `asset_edit_history`
- `orders`

See `../supabase/migrations/` for the schema (adapt to remove Supabase-specific features).

## Development

- The server runs on port 3001 by default
- Health check endpoint: `GET /health`
- CORS is configured for the frontend URL
- All database queries use parameterized queries to prevent SQL injection

## Notes

- Real-time subscriptions are NOT implemented (removed as per requirements)
- Row Level Security (RLS) policies should be removed from migrations
- All authorization is handled at the application level

