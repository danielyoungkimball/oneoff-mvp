-- Create the friend_recs table for product sharing
CREATE TABLE friend_recs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  product_id UUID NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_friend_recs_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_friend_recs_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_friend_recs_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_friend_recs_sender ON friend_recs(sender_id);
CREATE INDEX idx_friend_recs_receiver ON friend_recs(receiver_id);
CREATE INDEX idx_friend_recs_product ON friend_recs(product_id);
CREATE INDEX idx_friend_recs_created_at ON friend_recs(created_at);

-- Create a composite index for common queries
CREATE INDEX idx_friend_recs_receiver_created ON friend_recs(receiver_id, created_at DESC);

-- Add some sample data for testing (optional)
-- INSERT INTO friend_recs (sender_id, receiver_id, product_id, message) VALUES
--   ('user-uuid-1', 'user-uuid-2', 'product-uuid-1', 'Check out this amazing smartphone!'),
--   ('user-uuid-2', 'user-uuid-1', 'product-uuid-2', 'This laptop would be perfect for you'); 