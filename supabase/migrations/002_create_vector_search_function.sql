-- Create a function for vector similarity search
CREATE OR REPLACE FUNCTION match_products(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  brand TEXT,
  price NUMERIC,
  source_url TEXT,
  img_url TEXT,
  tags TEXT[],
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    products.id,
    products.name,
    products.brand,
    products.price,
    products.source_url,
    products.img_url,
    products.tags,
    1 - (products.embedding <=> query_embedding) AS similarity
  FROM products
  WHERE products.embedding IS NOT NULL
    AND 1 - (products.embedding <=> query_embedding) > match_threshold
  ORDER BY products.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create a function to update product embeddings
CREATE OR REPLACE FUNCTION update_product_embedding(
  product_id UUID,
  new_embedding VECTOR(1536)
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE products
  SET embedding = new_embedding,
      updated_at = NOW()
  WHERE id = product_id;
END;
$$; 