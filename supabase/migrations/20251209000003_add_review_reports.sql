-- Create review_reports table to track reported reviews
CREATE TABLE IF NOT EXISTS review_reports (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  review_id integer NOT NULL REFERENCES ratings(id) ON DELETE CASCADE,
  reporter_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason text,
  status varchar DEFAULT 'pending', -- pending, reviewed, dismissed
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  reviewed_at timestamp,
  reviewed_by varchar REFERENCES users(id) ON DELETE SET NULL
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_review_reports_review_id ON review_reports(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_status ON review_reports(status);
CREATE INDEX IF NOT EXISTS idx_review_reports_reporter_id ON review_reports(reporter_id);

-- Enable RLS
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can report reviews
CREATE POLICY review_reports_insert ON review_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = reporter_id);

-- Policy: Users can view their own reports
CREATE POLICY review_reports_select_own ON review_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = reporter_id);

-- Policy: Admins can view all reports
CREATE POLICY review_reports_select_admin ON review_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::text 
      AND users.role = 'admin'
    )
  );

-- Policy: Admins can update reports (to mark as reviewed/dismissed)
CREATE POLICY review_reports_update_admin ON review_reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::text 
      AND users.role = 'admin'
    )
  );

-- Policy: Admins can delete reports
CREATE POLICY review_reports_delete_admin ON review_reports
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::text 
      AND users.role = 'admin'
    )
  );

