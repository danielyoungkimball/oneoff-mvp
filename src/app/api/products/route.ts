import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '../../../services/productService';
import { EmbeddingService } from '../../../utils/embeddings';
import { CreateProductInput, Product, ProductSearchParams } from '../../../types/product';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Check if this is a vector search
    const query = searchParams.get('query');
    if (query) {
      let embedding = null;
      try {
        embedding = await EmbeddingService.generateEmbedding(query);
      } catch (e) {
        console.error('Embedding error:', e);
        return NextResponse.json({ products: [] });
      }
      const limit = parseInt(searchParams.get('limit') || '10');
      const threshold = parseFloat(searchParams.get('threshold') || '0.7');
      
      let products: Product[] = [];
      try {
        products = (await ProductService.searchProductsByText(query, embedding, limit, threshold)) || [];
      } catch (e) {
        console.error('ProductService.searchProductsByText error:', e);
        products = [];
      }
      return NextResponse.json({ products });
    }

    // Regular search with filters
    const searchParamsObj: ProductSearchParams = {
      brand: searchParams.get('brand') || undefined,
      min_price: searchParams.get('min_price') ? parseFloat(searchParams.get('min_price')!) : undefined,
      max_price: searchParams.get('max_price') ? parseFloat(searchParams.get('max_price')!) : undefined,
      tags: searchParams.get('tags') ? searchParams.get('tags')!.split(',') : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    let result: { products: Product[] } = { products: [] };
    try {
      result = (await ProductService.searchProducts(searchParamsObj)) || { products: [] };
      if (!result.products) result.products = [];
    } catch (e) {
      console.error('ProductService.searchProducts error:', e);
      result = { products: [] };
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { products: [], error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateProductInput = await request.json();
    
    // Generate embedding for the product
    let embedding: number[] = [];
    try {
      embedding = await EmbeddingService.generateProductEmbedding({
        name: body.name,
        brand: body.brand,
        tags: body.tags,
      });
    } catch (e) {
      console.error('Embedding error:', e);
      embedding = [];
    }

    let product = null;
    try {
      product = await ProductService.createProduct({
        ...body,
        embedding,
      });
    } catch (e) {
      console.error('ProductService.createProduct error:', e);
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      );
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
} 