import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { EmbeddingService } from '../../../utils/embeddings';

export async function GET() {
  try {
    // Get current authenticated user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user profile and preferences
    const { data: userProfile } = await supabase
      .from('users')
      .select('preferences, search_history')
      .eq('id', authUser.id)
      .single();

    // Get friend recommendations first
    const { data: friendRecs } = await supabase
      .from('friend_recs')
      .select(`
        *,
        sender:users!friend_recs_sender_id_fkey(id, name, email, avatar_url),
        product:products!friend_recs_product_id_fkey(id, name, brand, price, img_url, source_url, tags)
      `)
      .eq('receiver_id', authUser.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Build semantic query from user preferences
    let semanticQuery = '';
    const preferences = userProfile?.preferences || [];
    
    if (preferences.length > 0) {
      semanticQuery = preferences.join(' ');
    } else {
      // Fallback to generic query
      semanticQuery = 'popular products trending items';
    }

    // Generate embedding for semantic search
    const embedding = await EmbeddingService.generateEmbedding(semanticQuery);
    
    // Perform vector search
    const { data: vectorResults } = await supabase.rpc('match_products', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: 20
    });

    // Get additional products if vector search didn't return enough
    let additionalProducts = [];
    if (!vectorResults || vectorResults.length < 10) {
      const { data: fallbackProducts } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      additionalProducts = fallbackProducts || [];
    }

    // Combine and deduplicate results
    const allProducts = [
      ...(vectorResults || []),
      ...additionalProducts
    ];

    // Remove duplicates based on product ID
    const uniqueProducts = allProducts.filter((product, index, self) => 
      index === self.findIndex(p => p.id === product.id)
    );

    // Update user's search history
    if (semanticQuery) {
      const currentHistory = userProfile?.search_history || [];
      const newHistory = [semanticQuery, ...currentHistory.slice(0, 9)]; // Keep last 10 searches
      
      await supabase
        .from('users')
        .update({ search_history: newHistory })
        .eq('id', authUser.id);
    }

    return NextResponse.json({
      products: uniqueProducts.slice(0, 20),
      recommendations: friendRecs || [],
      query: semanticQuery
    });

  } catch (error: unknown) {
    console.error('Error generating feed:', error);
    return NextResponse.json(
      { error: 'Failed to generate feed' },
      { status: 500 }
    );
  }
} 