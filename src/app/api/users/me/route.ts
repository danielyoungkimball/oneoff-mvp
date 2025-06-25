import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '../../../../services/userService';
import { UpdateUserInput } from '../../../../types/db';

export async function GET() {
  try {
    const user = await UserService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { user: null, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json(
      { user: null, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body: UpdateUserInput = await request.json();
    const user = await UserService.updateCurrentUserProfile(body);
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
} 