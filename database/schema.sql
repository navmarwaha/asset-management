-- =====================================================
-- Asset Management System - PostgreSQL Schema
-- =====================================================
-- This schema file creates all tables needed for the
-- Asset Management System without RLS policies.
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table: assets
-- =====================================================
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  asset_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  brand TEXT NOT NULL,
  configuration TEXT,
  serial_number TEXT NOT NULL UNIQUE,
  far_code TEXT,
  assigned_to TEXT,
  employee_id TEXT,
  status TEXT NOT NULL DEFAULT 'Available',
  location TEXT NOT NULL,
  assigned_date TIMESTAMP WITH TIME ZONE,
  received_by TEXT,
  return_date TIMESTAMP WITH TIME ZONE,
  remarks TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  asset_check TEXT DEFAULT '',
  warranty_start TIMESTAMP WITH TIME ZONE,
  warranty_end TIMESTAMP WITH TIME ZONE,
  warranty_status TEXT,
  provider TEXT,
  asset_value_recovery NUMERIC,
  asset_condition TEXT,
  amc_start TIMESTAMP WITH TIME ZONE,
  amc_end TIMESTAMP WITH TIME ZONE
);

-- Indexes for assets table
CREATE INDEX IF NOT EXISTS idx_assets_asset_id ON public.assets(asset_id);
CREATE INDEX IF NOT EXISTS idx_assets_serial_number ON public.assets(serial_number);
CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_location ON public.assets(location);
CREATE INDEX IF NOT EXISTS idx_assets_employee_id ON public.assets(employee_id);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON public.assets(created_at DESC);

-- =====================================================
-- Table: asset_edit_history
-- =====================================================
CREATE TABLE IF NOT EXISTS public.asset_edit_history (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for asset_edit_history
CREATE INDEX IF NOT EXISTS idx_asset_edit_history_asset_id ON public.asset_edit_history(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_edit_history_updated_at ON public.asset_edit_history(updated_at DESC);

-- =====================================================
-- Table: employees
-- =====================================================
CREATE TABLE IF NOT EXISTS public.employees (
  employee_id TEXT NOT NULL PRIMARY KEY,
  employee_name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for employees
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department);

-- =====================================================
-- Table: users
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- =====================================================
-- Table: pending_requests
-- =====================================================
CREATE TABLE IF NOT EXISTS public.pending_requests (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  request_type TEXT NOT NULL CHECK (request_type IN ('assign', 'return', 'change_location', 'change_status')),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  requested_by TEXT NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  cancelled_by TEXT,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  approver_comments TEXT,
  
  -- For assign requests
  assign_to TEXT,
  employee_id TEXT,
  employee_email TEXT,
  
  -- For return requests
  return_remarks TEXT,
  return_location TEXT,
  return_status TEXT,
  asset_condition TEXT,
  received_by TEXT,
  configuration TEXT,
  
  -- For location/status change requests
  new_location TEXT,
  new_status TEXT,
  
  -- Original values (for return requests)
  original_assigned_to TEXT,
  original_employee_id TEXT,
  
  -- Asset value recovery (for sold assets)
  asset_value_recovery NUMERIC,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for pending_requests
CREATE INDEX IF NOT EXISTS idx_pending_requests_status ON public.pending_requests(status);
CREATE INDEX IF NOT EXISTS idx_pending_requests_asset_id ON public.pending_requests(asset_id);
CREATE INDEX IF NOT EXISTS idx_pending_requests_requested_by ON public.pending_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_pending_requests_requested_at ON public.pending_requests(requested_at DESC);

-- =====================================================
-- Table: orders
-- =====================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_type TEXT NOT NULL,
  material_type TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  model TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  warehouse TEXT NOT NULL,
  sales_order TEXT,
  employee_id TEXT,
  employee_name TEXT,
  serial_numbers TEXT[], -- Array of serial numbers (PostgreSQL array type)
  order_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  configuration TEXT,
  product TEXT DEFAULT 'Lead',
  sd_card_size TEXT,
  profile_id TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Note: If your PostgreSQL version doesn't support TEXT[] arrays,
-- you can use JSONB instead:
-- serial_numbers JSONB DEFAULT '[]'::jsonb

-- Indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON public.orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_material_type ON public.orders(material_type);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON public.orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_warehouse ON public.orders(warehouse);
CREATE INDEX IF NOT EXISTS idx_orders_sales_order ON public.orders(sales_order);

-- =====================================================
-- Functions and Triggers
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for assets table
DROP TRIGGER IF EXISTS update_assets_updated_at ON public.assets;
CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for employees table
DROP TRIGGER IF EXISTS update_employees_updated_at ON public.employees;
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for pending_requests table
DROP TRIGGER IF EXISTS update_pending_requests_updated_at ON public.pending_requests;
CREATE TRIGGER update_pending_requests_updated_at
  BEFORE UPDATE ON public.pending_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for orders table
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Sample Data (Optional - Remove in production)
-- =====================================================

-- Uncomment below to insert sample data for testing

-- =====================================================
-- Sample Data (Optional - Remove in production)
-- =====================================================

-- Uncomment below to insert sample data for testing

-- Sample user (Super Admin)
-- Replace 'admin@example.com' with your actual email
-- INSERT INTO public.users (email, role, department) 
-- VALUES ('admin@example.com', 'Super Admin', 'IT')
-- ON CONFLICT (email) DO NOTHING;

-- Sample employee
-- INSERT INTO public.employees (employee_id, employee_name, email, department, role)
-- VALUES ('LBPL001', 'John Doe', 'john.doe@example.com', 'IT', 'Developer')
-- ON CONFLICT (employee_id) DO NOTHING;

-- =====================================================
-- Schema Creation Complete
-- =====================================================

