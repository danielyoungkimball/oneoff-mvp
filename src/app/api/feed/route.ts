import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { UserService } from '../../../services/userService';
import { ProductService } from '../../../services/productService';
import { EmbeddingService } from '../../../utils/embeddings';
import { UserPreferences } from '../../../types/db';

export async function GET(req: NextRequest) {
  try {
    // Get current authenticated user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user preferences
    const userPrefs = await UserService.getUserPreferences(authUser.id);
    
    // Get personalized product recommendations
    const similarProducts = await matchProductsToUser(userPrefs);
    
    return NextResponse.json({
      products: similarProducts,
      userPreferences: userPrefs,
      total: similarProducts.length
    });
  } catch (error) {
    console.error('Error generating feed:', error);
    return NextResponse.json(
      { error: 'Failed to generate feed' },
      { status: 500 }
    );
  }
}

async function matchProductsToUser(userPrefs: UserPreferences) {
  try {
    // Build a query based on user preferences
    const queryText = buildQueryFromPreferences(userPrefs);
    
    if (!queryText.trim()) {
      // If no specific preferences, return recent products
      return await ProductService.getProducts(20, 0);
    }

    // Generate embedding for the user's preference query
    const embedding = await EmbeddingService.generateEmbedding(queryText);
    
    // Search for similar products using vector similarity
    const similarProducts = await ProductService.searchProductsByText(
      queryText,
      embedding,
      20, // limit
      0.6  // lower threshold for broader recommendations
    );

    // If we don't have enough vector results, supplement with filtered results
    if (similarProducts.length < 10) {
      const filteredProducts = await getFilteredProducts(userPrefs);
      const combinedProducts = [...similarProducts, ...filteredProducts];
      
      // Remove duplicates and return unique products
      const uniqueProducts = combinedProducts.filter((product, index, self) => 
        index === self.findIndex(p => p.id === product.id)
      );
      
      return uniqueProducts.slice(0, 20);
    }

    return similarProducts;
  } catch (error) {
    console.error('Error matching products to user:', error);
    // Fallback to recent products
    return await ProductService.getProducts(20, 0);
  }
}

function buildQueryFromPreferences(userPrefs: UserPreferences): string {
  const queryParts: string[] = [];

  // Add favorite brands
  if (userPrefs.favorite_brands && userPrefs.favorite_brands.length > 0) {
    queryParts.push(userPrefs.favorite_brands.join(' '));
  }

  // Add price range context
  if (userPrefs.price_range) {
    const { min, max } = userPrefs.price_range;
    if (min && max) {
      if (max < 100) {
        queryParts.push('budget affordable');
      } else if (max < 500) {
        queryParts.push('mid-range quality');
      } else {
        queryParts.push('premium luxury');
      }
    }
  }

  // Add search history context (if available)
  if (userPrefs.search_history && userPrefs.search_history.length > 0) {
    // Use the most recent searches
    const recentSearches = userPrefs.search_history.slice(-3);
    queryParts.push(recentSearches.join(' '));
  }

  return queryParts.join(' ');
}

async function getFilteredProducts(userPrefs: UserPreferences) {
  const filters: any = {};

  // Apply brand filter
  if (userPrefs.favorite_brands && userPrefs.favorite_brands.length > 0) {
    // Get products from favorite brands
    const brandProducts = await Promise.all(
      userPrefs.favorite_brands.map((brand: string) => 
        ProductService.getProductsByBrand(brand, 5, 0)
      )
    );
    return brandProducts.flat();
  }

  // Apply price range filter
  if (userPrefs.price_range) {
    const { min, max } = userPrefs.price_range;
    if (min !== undefined || max !== undefined) {
      filters.min_price = min;
      filters.max_price = max;
    }
  }

  // Get filtered products
  const result = await ProductService.searchProducts({
    ...filters,
    limit: 10,
    offset: 0
  });

  return result.products;
} 