import { supabase } from '../../lib/supabase';
import { Product, CreateProductInput, UpdateProductInput, ProductSearchParams, ProductSearchResult } from '../types/product';

export class ProductService {
  // Get all products with pagination
  static async getProducts(limit = 20, offset = 0): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  // Get a single product by ID
  static async getProduct(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // Create a new product
  static async createProduct(product: CreateProductInput): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update an existing product
  static async updateProduct(product: UpdateProductInput): Promise<Product> {
    const { id, ...updateData } = product;
    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete a product
  static async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Search products by text query using vector similarity
  static async searchProductsByText(
    query: string,
    embedding: number[],
    limit = 10,
    threshold = 0.7
  ): Promise<Product[]> {
    const { data, error } = await supabase
      .rpc('match_products', {
        query_embedding: embedding,
        match_threshold: threshold,
        match_count: limit
      });

    if (error) throw error;
    return data || [];
  }

  // Search products with filters
  static async searchProducts(params: ProductSearchParams): Promise<ProductSearchResult> {
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' });

    // Apply filters
    if (params.brand) {
      query = query.eq('brand', params.brand);
    }

    if (params.min_price !== undefined) {
      query = query.gte('price', params.min_price);
    }

    if (params.max_price !== undefined) {
      query = query.lte('price', params.max_price);
    }

    if (params.tags && params.tags.length > 0) {
      query = query.overlaps('tags', params.tags);
    }

    // Apply pagination
    const limit = params.limit || 20;
    const offset = params.offset || 0;
    query = query.range(offset, offset + limit - 1);

    // Order by creation date
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      products: data || [],
      total: count || 0,
      hasMore: (offset + limit) < (count || 0)
    };
  }

  // Get products by brand
  static async getProductsByBrand(brand: string, limit = 20, offset = 0): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('brand', brand)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  // Get products by tags
  static async getProductsByTags(tags: string[], limit = 20, offset = 0): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .overlaps('tags', tags)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  // Get unique brands
  static async getBrands(): Promise<string[]> {
    const { data, error } = await supabase
      .from('products')
      .select('brand')
      .not('brand', 'is', null);

    if (error) throw error;
    
    const brands = data?.map(item => item.brand).filter(Boolean) || [];
    return [...new Set(brands)]; // Remove duplicates
  }

  // Get unique tags
  static async getTags(): Promise<string[]> {
    const { data, error } = await supabase
      .from('products')
      .select('tags');

    if (error) throw error;
    
    const allTags = data?.flatMap(item => item.tags || []).filter(Boolean) || [];
    return [...new Set(allTags)]; // Remove duplicates
  }
} 