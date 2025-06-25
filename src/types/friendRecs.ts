export interface FriendRec {
  id: string;
  sender_id: string;
  receiver_id: string;
  product_id: string;
  message?: string;
  created_at: string;
}

export interface CreateFriendRecInput {
  receiver_id: string;
  product_id: string;
  message?: string;
}

export interface FriendRecWithDetails extends FriendRec {
  sender: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  receiver: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  product: {
    id: string;
    name: string;
    brand?: string;
    price?: number;
    img_url?: string;
    source_url?: string;
  };
}

export interface FriendRecsResponse {
  recommendations: FriendRecWithDetails[];
  total: number;
  hasMore: boolean;
} 