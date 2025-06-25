import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { FriendRecsService } from '../../../services/friendRecsService';
import { CreateFriendRecInput } from '../../../types/friendRecs';

export async function GET(request: NextRequest) {
  try {
    // Get current authenticated user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'received'; // 'sent' or 'received'
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let result;
    if (type === 'sent') {
      result = await FriendRecsService.getSentRecommendations(authUser.id, limit, offset);
    } else {
      result = await FriendRecsService.getReceivedRecommendations(authUser.id, limit, offset);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching friend recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current authenticated user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body: CreateFriendRecInput = await request.json();
    
    // Validate required fields
    if (!body.receiver_id || !body.product_id) {
      return NextResponse.json(
        { error: 'Receiver ID and Product ID are required' },
        { status: 400 }
      );
    }

    // Create the friend recommendation
    const recommendation = await FriendRecsService.createFriendRec(authUser.id, body);
    
    return NextResponse.json(recommendation, { status: 201 });
  } catch (error) {
    console.error('Error creating friend recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to create recommendation' },
      { status: 500 }
    );
  }
} 