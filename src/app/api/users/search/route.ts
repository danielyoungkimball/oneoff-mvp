import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';
import { FriendRecsService } from '../../../../services/friendRecsService';
import { User } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Get current authenticated user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Not authenticated', users: [] },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    let users: User[] = [];
    try {
      if (query.trim()) {
        users = ((await FriendRecsService.searchUsersForSharing(authUser.id, query, limit)) || []) as unknown as User[];
      } else {
        users = ((await FriendRecsService.getUsersForSharing(authUser.id, limit)) || []) as unknown as User[];
      }
    } catch (e) {
      console.error('FriendRecsService user search error:', e);
      users = [];
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { users: [], error: 'Failed to search users' },
      { status: 500 }
    );
  }
} 