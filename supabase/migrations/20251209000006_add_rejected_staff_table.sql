-- Create rejected_staff table to track rejected merchant/staff applications
CREATE TABLE IF NOT EXISTS rejected_staff (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  email varchar NOT NULL,
  store_name varchar NOT NULL,
  description text,
  phone varchar,
  category varchar,
  reason text, -- Optional reason for rejection
  rejected_at timestamp DEFAULT CURRENT_TIMESTAMP,
  rejected_by varchar REFERENCES users(id) ON DELETE SET NULL, -- Admin who rejected it
  original_application_id integer REFERENCES merchant_applications(id) ON DELETE SET NULL -- Link to original application if it exists
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_rejected_staff_email ON rejected_staff(email);
CREATE INDEX IF NOT EXISTS idx_rejected_staff_rejected_at ON rejected_staff(rejected_at);
CREATE INDEX IF NOT EXISTS idx_rejected_staff_rejected_by ON rejected_staff(rejected_by);

-- Enable RLS
ALTER TABLE rejected_staff ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all rejected staff records
CREATE POLICY rejected_staff_select_admin ON rejected_staff
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::text 
      AND users.role = 'admin'
    )
  );

-- Policy: Admins can insert rejected staff records
CREATE POLICY rejected_staff_insert_admin ON rejected_staff
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::text 
      AND users.role = 'admin'
    )
  );

-- Policy: Admins can update rejected staff records
CREATE POLICY rejected_staff_update_admin ON rejected_staff
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::text 
      AND users.role = 'admin'
    )
  );

-- Policy: Admins can delete rejected staff records
CREATE POLICY rejected_staff_delete_admin ON rejected_staff
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::text 
      AND users.role = 'admin'
    )
  );

