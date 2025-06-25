export interface Product {
  id: string;
  name: string;
  brand?: string;
  price?: number;
  source_url?: string;
  img_url?: string;
  tags?: string[];
  embedding?: number[];
  created_at: string;
  updated_at: string;
}

export interface CreateProductInput {
  name: string;
  brand?: string;
  price?: number;
  source_url?: string;
  img_url?: string;
  tags?: string[];
  embedding?: number[];
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: string;
}

export interface ProductSearchParams {
  query?: string;
  brand?: string;
  min_price?: number;
  max_price?: number;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface ProductSearchResult {
  products: Product[];
  total: number;
  hasMore: boolean;
} 