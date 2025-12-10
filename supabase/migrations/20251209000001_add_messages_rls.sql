-- Add RLS policies for messages table
-- This allows both customers (students) and staff to send and read messages for orders they're involved in

-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running)
DROP POLICY IF EXISTS messages_select_order_participants ON messages;
DROP POLICY IF EXISTS messages_insert_order_participants ON messages;

-- Allow users to read messages for orders they're involved in
-- Students can see messages for their orders
-- Staff can see messages for orders in their store
CREATE POLICY messages_select_order_participants ON messages
  FOR SELECT
  USING (
    -- Student can see messages for their orders
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = messages.order_id
      AND o.student_id = auth.uid()::text
    )
    OR
    -- Staff can see messages for orders in their store
    EXISTS (
      SELECT 1 FROM orders o
      INNER JOIN stores s ON s.id = o.store_id
      WHERE o.id = messages.order_id
      AND s.owner_id = auth.uid()::text
    )
  );

-- Allow users to insert messages for orders they're involved in
-- Students can send messages for their orders
-- Staff can send messages for orders in their store
CREATE POLICY messages_insert_order_participants ON messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()::text
    AND (
      -- Student can send messages for their orders
      EXISTS (
        SELECT 1 FROM orders o
        WHERE o.id = messages.order_id
        AND o.student_id = auth.uid()::text
      )
      OR
      -- Staff can send messages for orders in their store
      EXISTS (
        SELECT 1 FROM orders o
        INNER JOIN stores s ON s.id = o.store_id
        WHERE o.id = messages.order_id
        AND s.owner_id = auth.uid()::text
      )
    )
  );

