-- Fix store settings functionality and add RLS policies
-- This migration:
-- 1. Adds missing contact_name columns
-- 2. Enables RLS on stores and meals tables
-- 3. Creates policies to allow only store owners (staff) to edit their stores and meals
-- 4. Sets up storage policies for staff to upload assets

-- 1. Add missing contact_name columns (idempotent)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS contact_name text;
ALTER TABLE merchant_applications ADD COLUMN IF NOT EXISTS contact_name text;

-- 2. Enable RLS on stores table
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running)
DROP POLICY IF EXISTS stores_select_all ON stores;
DROP POLICY IF EXISTS stores_owner_update ON stores;
DROP POLICY IF EXISTS stores_owner_insert ON stores;

-- Create RLS policies for stores
-- Allow everyone to read stores (for public storefront)
CREATE POLICY stores_select_all ON stores FOR SELECT USING (true);

-- Only store owners can update their store
CREATE POLICY stores_owner_update ON stores FOR UPDATE
  USING (auth.uid()::text = owner_id)
  WITH CHECK (auth.uid()::text = owner_id);

-- Only store owners can insert stores (though this is usually done via admin)
CREATE POLICY stores_owner_insert ON stores FOR INSERT
  WITH CHECK (auth.uid()::text = owner_id);

-- 3. Enable RLS on meals table
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS meals_select_all ON meals;
DROP POLICY IF EXISTS meals_owner_update ON meals;
DROP POLICY IF EXISTS meals_owner_insert ON meals;

-- Create RLS policies for meals
-- Allow everyone to read meals (for public menu)
CREATE POLICY meals_select_all ON meals FOR SELECT USING (true);

-- Only store owners can update meals in their store
CREATE POLICY meals_owner_update ON meals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stores s 
      WHERE s.id = meals.store_id 
      AND s.owner_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores s 
      WHERE s.id = meals.store_id 
      AND s.owner_id = auth.uid()::text
    )
  );

-- Only store owners can insert meals in their store
CREATE POLICY meals_owner_insert ON meals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores s 
      WHERE s.id = meals.store_id 
      AND s.owner_id = auth.uid()::text
    )
  );

-- 4. Storage policies for public bucket (store assets and meal images)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS staff_write_public_bucket ON storage.objects;
DROP POLICY IF EXISTS staff_update_public_bucket ON storage.objects;
DROP POLICY IF EXISTS staff_read_public_bucket ON storage.objects;

-- Allow authenticated users (staff) to upload to public bucket
CREATE POLICY staff_write_public_bucket ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'public');

-- Allow authenticated users to update files in public bucket
CREATE POLICY staff_update_public_bucket ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'public')
  WITH CHECK (bucket_id = 'public');

-- Allow everyone to read from public bucket
CREATE POLICY staff_read_public_bucket ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'public');

