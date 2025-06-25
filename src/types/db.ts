export type User = {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  preferences: string[];
  created_at: string;
  updated_at: string;
};

export type CreateUserInput = {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  preferences?: string[];
};

export type UpdateUserInput = {
  name?: string;
  avatar_url?: string;
  preferences?: string[];
};

export type UserPreferences = {
  theme?: 'light' | 'dark';
  notifications?: boolean;
  search_history?: string[];
  favorite_brands?: string[];
  price_range?: {
    min?: number;
    max?: number;
  };
}; 