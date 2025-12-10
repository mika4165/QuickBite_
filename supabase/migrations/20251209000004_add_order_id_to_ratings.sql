-- Add order_id to ratings table to allow users to review each claimed order separately
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS order_id integer REFERENCES orders(id) ON DELETE CASCADE;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_ratings_order_id ON ratings(order_id);

-- Add comment to explain the column
COMMENT ON COLUMN ratings.order_id IS 'The order this review is for. Allows users to review each claimed order separately.';

