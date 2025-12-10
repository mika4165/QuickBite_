-- Add RLS policy to allow admins to delete ratings/reviews
-- This ensures admins can delete reported reviews from the ratings table

-- Enable RLS on ratings table if not already enabled
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running)
DROP POLICY IF EXISTS ratings_delete_admin ON ratings;
DROP POLICY IF EXISTS ratings_delete_own ON ratings;

-- Policy: Admins can delete any rating/review
CREATE POLICY ratings_delete_admin ON ratings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::text 
      AND users.role = 'admin'
    )
  );

-- Policy: Users can delete their own ratings/reviews (optional, for user self-deletion)
CREATE POLICY ratings_delete_own ON ratings
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

