import { supabase } from '../../lib/supabase';
import { FriendRec, CreateFriendRecInput, FriendRecWithDetails, FriendRecsResponse } from '../types/friendRecs';

export class FriendRecsService {
  // Create a new friend recommendation
  static async createFriendRec(senderId: string, input: CreateFriendRecInput): Promise<FriendRec> {
    const { data, error } = await supabase
      .from('friend_recs')
      .insert([{
        sender_id: senderId,
        receiver_id: input.receiver_id,
        product_id: input.product_id,
        message: input.message,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get recommendations sent by a user
  static async getSentRecommendations(userId: string, limit = 20, offset = 0): Promise<FriendRecsResponse> {
    const { data, error, count } = await supabase
      .from('friend_recs')
      .select(`
        *,
        receiver:users!friend_recs_receiver_id_fkey(id, name, email, avatar_url),
        product:products!friend_recs_product_id_fkey(id, name, brand, price, img_url, source_url)
      `, { count: 'exact' })
      .eq('sender_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      recommendations: data || [],
      total: count || 0,
      hasMore: (offset + limit) < (count || 0)
    };
  }

  // Get recommendations received by a user
  static async getReceivedRecommendations(userId: string, limit = 20, offset = 0): Promise<FriendRecsResponse> {
    const { data, error, count } = await supabase
      .from('friend_recs')
      .select(`
        *,
        sender:users!friend_recs_sender_id_fkey(id, name, email, avatar_url),
        product:products!friend_recs_product_id_fkey(id, name, brand, price, img_url, source_url)
      `, { count: 'exact' })
      .eq('receiver_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      recommendations: data || [],
      total: count || 0,
      hasMore: (offset + limit) < (count || 0)
    };
  }

  // Get a specific recommendation by ID
  static async getRecommendation(id: string): Promise<FriendRecWithDetails | null> {
    const { data, error } = await supabase
      .from('friend_recs')
      .select(`
        *,
        sender:users!friend_recs_sender_id_fkey(id, name, email, avatar_url),
        receiver:users!friend_recs_receiver_id_fkey(id, name, email, avatar_url),
        product:products!friend_recs_product_id_fkey(id, name, brand, price, img_url, source_url)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // Delete a recommendation
  static async deleteRecommendation(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('friend_recs')
      .delete()
      .eq('id', id)
      .eq('sender_id', userId); // Only allow sender to delete

    if (error) throw error;
  }

  // Get all users for sharing (excluding current user)
  static async getUsersForSharing(currentUserId: string, limit = 50): Promise<Array<{
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  }>> {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, avatar_url')
      .neq('id', currentUserId)
      .order('name')
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Search users by name or email for sharing
  static async searchUsersForSharing(currentUserId: string, query: string, limit = 10): Promise<Array<{
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  }>> {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, avatar_url')
      .neq('id', currentUserId)
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('name')
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Get recommendation statistics for a user
  static async getRecommendationStats(userId: string): Promise<{
    sent: number;
    received: number;
  }> {
    const [sentResult, receivedResult] = await Promise.all([
      supabase
        .from('friend_recs')
        .select('id', { count: 'exact' })
        .eq('sender_id', userId),
      supabase
        .from('friend_recs')
        .select('id', { count: 'exact' })
        .eq('receiver_id', userId)
    ]);

    if (sentResult.error) throw sentResult.error;
    if (receivedResult.error) throw receivedResult.error;

    return {
      sent: sentResult.count || 0,
      received: receivedResult.count || 0
    };
  }
} 