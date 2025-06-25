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
    const { data: friendRecsRaw, error: friendRecsError } = await supabase
      .from('friend_recs')
      .select(`
        *,
        sender:users!friend_recs_sender_id_fkey(id, name, email, avatar_url),
        product:products!friend_recs_product_id_fkey(id, name, brand, price, img_url, source_url, tags)
      `)
      .eq('receiver_id', authUser.id)
      .order('created_at', { ascending: false })
      .limit(10);
    const friendRecs = friendRecsRaw || [];
    if (friendRecsError) console.error('Friend recs error:', friendRecsError);

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
    let embedding = null;
    try {
      embedding = await EmbeddingService.generateEmbedding(semanticQuery);
    } catch (e) {
      console.error('Embedding error:', e);
    }
    
    // Perform vector search
    let vectorResults = [];
    if (embedding) {
      try {
        const { data: vr, error: vrError } = await supabase.rpc('match_products', {
          query_embedding: embedding,
          match_threshold: 0.7,
          match_count: 20
        });
        if (vrError) console.error('Vector search error:', vrError);
        vectorResults = vr || [];
      } catch (e) {
        console.error('Vector search exception:', e);
      }
    }

    // Get additional products if vector search didn't return enough
    let additionalProducts = [];
    if (!vectorResults || vectorResults.length < 10) {
      try {
        const { data: fallbackProducts, error: fallbackError } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);
        if (fallbackError) console.error('Fallback products error:', fallbackError);
        additionalProducts = fallbackProducts || [];
      } catch (e) {
        console.error('Fallback products exception:', e);
      }
    }

    // Combine and deduplicate results
    const allProducts = [
      ...(vectorResults || []),
      ...additionalProducts
    ];

    // Remove duplicates based on product ID
    const uniqueProducts = allProducts.filter((product, index, self) => 
      product && product.id && index === self.findIndex(p => p && p.id === product.id)
    );

    // Update user's search history only if userProfile exists
    if (userProfile && semanticQuery) {
      const currentHistory = userProfile.search_history || [];
      const newHistory = [semanticQuery, ...currentHistory.slice(0, 9)]; // Keep last 10 searches
      try {
        await supabase
          .from('users')
          .update({ search_history: newHistory })
          .eq('id', authUser.id);
      } catch (e) {
        console.error('Search history update error:', e);
      }
    }

    return NextResponse.json({
      products: uniqueProducts.slice(0, 20),
      recommendations: friendRecs,
      query: semanticQuery
    });

  } catch (error) {
    console.error('Error generating feed:', error);
    return NextResponse.json(
      { products: [], recommendations: [], query: '', error: 'Failed to generate feed' },
      { status: 500 }
    );
  }
} 