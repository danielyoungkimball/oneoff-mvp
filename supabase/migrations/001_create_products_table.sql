-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT,
  price NUMERIC(10,2),
  source_url TEXT,
  img_url TEXT,
  tags TEXT[],
  embedding VECTOR(1536),  -- OpenAI embedding dimension
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_tags ON products USING GIN(tags);
CREATE INDEX idx_products_embedding ON products USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add some sample data for testing
INSERT INTO products (name, brand, price, source_url, img_url, tags) VALUES
('iPhone 15 Pro', 'Apple', 999.99, 'https://apple.com/iphone-15-pro', 'https://example.com/iphone15pro.jpg', ARRAY['smartphone', 'apple', '5g', 'camera']),
('Samsung Galaxy S24', 'Samsung', 899.99, 'https://samsung.com/galaxy-s24', 'https://example.com/galaxys24.jpg', ARRAY['smartphone', 'android', '5g', 'camera']),
('MacBook Pro 14"', 'Apple', 1999.99, 'https://apple.com/macbook-pro', 'https://example.com/macbookpro.jpg', ARRAY['laptop', 'apple', 'macos', 'm3']),
('Dell XPS 13', 'Dell', 1299.99, 'https://dell.com/xps-13', 'https://example.com/dellxps13.jpg', ARRAY['laptop', 'windows', 'ultrabook', 'intel']),
('Sony WH-1000XM5', 'Sony', 349.99, 'https://sony.com/wh-1000xm5', 'https://example.com/sonyxm5.jpg', ARRAY['headphones', 'wireless', 'noise-cancelling', 'bluetooth']); 