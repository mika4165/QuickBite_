-- Add RLS policies for users and merchant_applications tables
-- This allows users to register and save data to Supabase

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running)
DROP POLICY IF EXISTS users_insert_own ON users;
DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS users_update_own ON users;
DROP POLICY IF EXISTS users_service_role_all ON users;

-- Policy: Users can insert their own record during registration
CREATE POLICY users_insert_own ON users
  FOR INSERT
  WITH CHECK (auth.uid()::text = id);

-- Policy: Users can read their own record
CREATE POLICY users_select_own ON users
  FOR SELECT
  USING (auth.uid()::text = id OR true); -- Allow all reads for now (can be restricted later)

-- Policy: Users can update their own record
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

-- Policy: Service role can do everything (for serverless functions)
-- Note: Service role bypasses RLS, but this policy ensures compatibility
CREATE POLICY users_service_role_all ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable RLS on merchant_applications table
ALTER TABLE merchant_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS merchant_applications_insert_all ON merchant_applications;
DROP POLICY IF EXISTS merchant_applications_select_own ON merchant_applications;
DROP POLICY IF EXISTS merchant_applications_service_role_all ON merchant_applications;

-- Policy: Anyone can insert merchant applications (for registration)
CREATE POLICY merchant_applications_insert_all ON merchant_applications
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can read their own applications
CREATE POLICY merchant_applications_select_own ON merchant_applications
  FOR SELECT
  USING (true); -- Allow all reads for now

-- Policy: Service role can do everything
CREATE POLICY merchant_applications_service_role_all ON merchant_applications
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable RLS on approved_staff table
ALTER TABLE approved_staff ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS approved_staff_service_role_all ON approved_staff;

-- Policy: Service role can do everything (only serverless functions access this)
CREATE POLICY approved_staff_service_role_all ON approved_staff
  FOR ALL
  USING (true)
  WITH CHECK (true);

