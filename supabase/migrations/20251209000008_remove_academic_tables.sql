-- Remove academic-related tables that are not part of QuickBite
-- These tables appear to be from a different project

-- Drop tables in reverse order of dependencies (if any exist)
DROP TABLE IF EXISTS academic_submissions CASCADE;
DROP TABLE IF EXISTS academic_shared_files CASCADE;
DROP TABLE IF EXISTS academic_files CASCADE;
DROP TABLE IF EXISTS academic_enrollments CASCADE;
DROP TABLE IF EXISTS academic_teachers CASCADE;
DROP TABLE IF EXISTS academic_courses CASCADE;
DROP TABLE IF EXISTS academic_users CASCADE;

-- Note: CASCADE will also drop any dependent objects (foreign keys, views, etc.)

