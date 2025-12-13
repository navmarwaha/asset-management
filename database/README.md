# Database Schema and Migrations

This directory contains the database schema and migration scripts for the Asset Management System.

## Files

- `schema.sql` - Complete database schema (use for fresh database)
- `migrations/001_remove_rls_policies.sql` - Migration to remove RLS policies

## Quick Start

### For Fresh Database

```bash
# Create database
createdb asset_management

# Run schema
psql -U postgres -d asset_management -f database/schema.sql
```

### For Existing Supabase Database

```bash
# Remove RLS policies
psql -U postgres -d asset_management -f database/migrations/001_remove_rls_policies.sql
```

## Schema Overview

### Tables

1. **assets** - Main asset inventory
2. **asset_edit_history** - Audit trail for asset changes
3. **employees** - Employee information
4. **users** - System users with roles
5. **pending_requests** - Approval workflow requests
6. **orders** - Order management

### Features

- UUID primary keys
- Automatic timestamp updates via triggers
- Foreign key constraints
- Indexes for performance
- No RLS (authorization at application level)

## Notes

- All timestamps use `TIMESTAMP WITH TIME ZONE`
- UUIDs are generated using `uuid_generate_v4()`
- Triggers automatically update `updated_at` columns
- Sample data is commented out (uncomment for testing)

