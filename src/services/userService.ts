import { supabase } from '../../lib/supabase';
import { User, CreateUserInput, UpdateUserInput, UserPreferences } from '../types/db';

export class UserService {
  // Get user by ID
  static async getUser(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // Get user by email
  static async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) throw error;
    return data;
  }

  // Create a new user
  static async createUser(user: CreateUserInput): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update user
  static async updateUser(id: string, updates: UpdateUserInput): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete user
  static async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Get user preferences
  static async getUserPreferences(id: string): Promise<UserPreferences> {
    const user = await this.getUser(id);
    if (!user) throw new Error('User not found');

    try {
      return JSON.parse(user.preferences.join('')) as UserPreferences;
    } catch {
      return {};
    }
  }

  // Update user preferences
  static async updateUserPreferences(id: string, preferences: UserPreferences): Promise<User> {
    const preferencesArray = [JSON.stringify(preferences)];
    
    return this.updateUser(id, { preferences: preferencesArray });
  }

  // Add preference to user
  static async addPreference(id: string, preference: string): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error('User not found');

    const currentPreferences = user.preferences || [];
    const updatedPreferences = [...currentPreferences, preference];

    return this.updateUser(id, { preferences: updatedPreferences });
  }

  // Remove preference from user
  static async removePreference(id: string, preference: string): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error('User not found');

    const currentPreferences = user.preferences || [];
    const updatedPreferences = currentPreferences.filter(p => p !== preference);

    return this.updateUser(id, { preferences: updatedPreferences });
  }

  // Get current authenticated user
  static async getCurrentUser(): Promise<User | null> {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) return null;
    
    return this.getUser(authUser.id);
  }

  // Update current user profile
  static async updateCurrentUserProfile(updates: UpdateUserInput): Promise<User> {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) throw new Error('No authenticated user');
    
    return this.updateUser(authUser.id, updates);
  }

  // Get all users (admin only)
  static async getAllUsers(limit = 50, offset = 0): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }
} 