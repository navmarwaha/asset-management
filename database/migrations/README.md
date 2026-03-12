# Database Migrations

This directory contains migration scripts for the Asset Management System.

## Available Migrations

### 001_remove_rls_policies.sql

Removes all Row Level Security (RLS) policies and disables RLS on all tables.

**When to use:**
- When migrating from Supabase to standalone PostgreSQL
- If you have existing tables with RLS enabled

**How to run:**
```bash
psql -U postgres -d asset_management -f database/migrations/001_remove_rls_policies.sql
```

**What it does:**
- Drops all RLS policies from all tables
- Disables RLS on all tables
- Safe to run multiple times (uses IF EXISTS)

## Creating New Migrations

When creating new migrations:

1. Name them sequentially: `002_description.sql`, `003_description.sql`, etc.
2. Use `IF EXISTS` and `IF NOT EXISTS` for safety
3. Test on a copy of production data first
4. Document what the migration does
5. Include rollback instructions if needed

## Migration Best Practices

- Always backup your database before running migrations
- Test migrations on a development database first
- Run migrations during maintenance windows in production
- Keep migrations small and focused
- Document any breaking changes

