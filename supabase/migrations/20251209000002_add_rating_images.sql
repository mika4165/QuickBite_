-- Add image support to ratings table for review photos
-- Allow users to upload 1-3 photos with their review

ALTER TABLE ratings ADD COLUMN IF NOT EXISTS image_urls text[];

-- Add comment to explain the column
COMMENT ON COLUMN ratings.image_urls IS 'Array of image URLs (1-3 photos) for the review';

