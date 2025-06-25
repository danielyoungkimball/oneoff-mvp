import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '../../../../services/productService';
import { EmbeddingService } from '../../../../utils/embeddings';
import { UpdateProductInput } from '../../../../types/product';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await ProductService.getProduct(params.id);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: UpdateProductInput = await request.json();
    
    // Generate new embedding if product data changed
    let embedding = body.embedding;
    if (body.name || body.brand || body.tags) {
      const currentProduct = await ProductService.getProduct(params.id);
      if (currentProduct) {
        embedding = await EmbeddingService.generateProductEmbedding({
          name: body.name || currentProduct.name,
          brand: body.brand || currentProduct.brand,
          tags: body.tags || currentProduct.tags,
        });
      }
    }

    const { id, ...updateData } = body;
    const product = await ProductService.updateProduct({
      id: params.id,
      ...updateData,
      embedding,
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ProductService.deleteProduct(params.id);
    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
} 