import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';
import { FriendRecsService } from '../../../../services/friendRecsService';

function getIdFromRequest(request: NextRequest): string | null {
  // /api/friend-recs/[id] => get last segment
  const segments = request.nextUrl.pathname.split('/');
  return segments[segments.length - 1] || null;
}

export async function GET(request: NextRequest) {
  try {
    const id = getIdFromRequest(request);
    if (!id) {
      return NextResponse.json(
        { error: 'Missing recommendation id' },
        { status: 400 }
      );
    }
    // Get current authenticated user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const recommendation = await FriendRecsService.getRecommendation(id);
    
    if (!recommendation) {
      return NextResponse.json(
        { error: 'Recommendation not found' },
        { status: 404 }
      );
    }

    // Check if user is authorized to view this recommendation
    if (recommendation.sender_id !== authUser.id && recommendation.receiver_id !== authUser.id) {
      return NextResponse.json(
        { error: 'Not authorized to view this recommendation' },
        { status: 403 }
      );
    }

    return NextResponse.json(recommendation);
  } catch (error) {
    console.error('Error fetching friend recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendation' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = getIdFromRequest(request);
    if (!id) {
      return NextResponse.json(
        { error: 'Missing recommendation id' },
        { status: 400 }
      );
    }
    // Get current authenticated user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await FriendRecsService.deleteRecommendation(id, authUser.id);
    
    return NextResponse.json({ message: 'Recommendation deleted successfully' });
  } catch (error) {
    console.error('Error deleting friend recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to delete recommendation' },
      { status: 500 }
    );
  }
} 