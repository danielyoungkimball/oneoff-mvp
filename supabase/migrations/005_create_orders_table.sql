-- Create the orders table for checkout system
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  shipping_address JSONB NOT NULL,
  billing_info JSONB NOT NULL,
  order_total NUMERIC(10,2),
  bot_status TEXT DEFAULT 'queued' CHECK (bot_status IN ('queued', 'running', 'completed', 'failed')),
  bot_logs TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_orders_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_bot_status ON orders(bot_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Create a composite index for common queries
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_orders_bot_status_created ON orders(bot_status, created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create a function to get order with product details
CREATE OR REPLACE FUNCTION get_order_with_details(order_uuid UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  product_id UUID,
  status TEXT,
  shipping_address JSONB,
  billing_info JSONB,
  order_total NUMERIC,
  bot_status TEXT,
  bot_logs TEXT[],
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  product_name TEXT,
  product_brand TEXT,
  product_price NUMERIC,
  product_source_url TEXT,
  product_img_url TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.user_id,
    o.product_id,
    o.status,
    o.shipping_address,
    o.billing_info,
    o.order_total,
    o.bot_status,
    o.bot_logs,
    o.created_at,
    o.updated_at,
    p.name as product_name,
    p.brand as product_brand,
    p.price as product_price,
    p.source_url as product_source_url,
    p.img_url as product_img_url
  FROM orders o
  JOIN products p ON o.product_id = p.id
  WHERE o.id = order_uuid;
END;
$$; 