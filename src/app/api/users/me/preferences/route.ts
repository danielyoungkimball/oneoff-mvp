import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '../../../../../services/userService';
import { UserPreferences } from '../../../../../types/db';
import { supabase } from '../../../../../../lib/supabase';

export async function GET() {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const preferences = await UserService.getUserPreferences(authUser.id);
    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body: UserPreferences = await request.json();
    const user = await UserService.updateUserPreferences(authUser.id, body);
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
} 