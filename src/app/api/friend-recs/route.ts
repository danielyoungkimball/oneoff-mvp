import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { FriendRecsService } from '../../../services/friendRecsService';
import { CreateFriendRecInput, FriendRecsResponse } from '../../../types/friendRecs';

export async function GET(request: NextRequest) {
  try {
    // Get current authenticated user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Not authenticated', recommendations: [] },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'received'; // 'sent' or 'received'
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let result: FriendRecsResponse[] = [];
    try {
      if (type === 'sent') {
        const sentRecs = await FriendRecsService.getSentRecommendations(authUser.id, limit, offset);
        result = Array.isArray(sentRecs) ? sentRecs : [];
      } else {
        const receivedRecs = await FriendRecsService.getReceivedRecommendations(authUser.id, limit, offset);
        result = Array.isArray(receivedRecs) ? receivedRecs : [];
      }
    } catch (e) {
      console.error('FriendRecsService error:', e);
      result = [];
    }

    return NextResponse.json({ recommendations: result });
  } catch (error) {
    console.error('Error fetching friend recommendations:', error);
    return NextResponse.json(
      { recommendations: [], error: 'Failed to fetch recommendations' },
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

    let body: CreateFriendRecInput;
    try {
      body = await request.json();
    } catch (e) {
      console.error('Error parsing JSON body:', e);
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }
    
    // Validate required fields
    if (!body.receiver_id || !body.product_id) {
      return NextResponse.json(
        { error: 'Receiver ID and Product ID are required' },
        { status: 400 }
      );
    }

    // Create the friend recommendation
    let recommendation = null;
    try {
      recommendation = await FriendRecsService.createFriendRec(authUser.id, body);
    } catch (e) {
      console.error('Error creating friend recommendation:', e);
      return NextResponse.json(
        { error: 'Failed to create recommendation' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(recommendation, { status: 201 });
  } catch (error) {
    console.error('Error creating friend recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to create recommendation' },
      { status: 500 }
    );
  }
} 