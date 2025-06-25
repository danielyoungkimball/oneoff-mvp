# OneOff MVP - Complete Setup Guide

This project includes a complete authentication system, user management, product management with vector search, and friend recommendations using Supabase and OpenAI embeddings.

## 🚀 Quick Start

### 1. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration (for vector embeddings)
OPENAI_API_KEY=your_openai_api_key
```

### 2. Database Setup

Run these SQL commands in your Supabase SQL editor in order:

#### Step 1: Enable pgvector extension
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

#### Step 2: Create users table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  preferences TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_preferences ON users USING GIN(preferences);

-- Create trigger for updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-create user records from auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

#### Step 3: Create products table
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT,
  price NUMERIC(10,2),
  source_url TEXT,
  img_url TEXT,
  tags TEXT[],
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_tags ON products USING GIN(tags);
CREATE INDEX idx_products_embedding ON products USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

#### Step 4: Create vector search function
```sql
CREATE OR REPLACE FUNCTION match_products(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  brand TEXT,
  price NUMERIC,
  source_url TEXT,
  img_url TEXT,
  tags TEXT[],
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    products.id,
    products.name,
    products.brand,
    products.price,
    products.source_url,
    products.img_url,
    products.tags,
    1 - (products.embedding <=> query_embedding) AS similarity
  FROM products
  WHERE products.embedding IS NOT NULL
    AND 1 - (products.embedding <=> query_embedding) > match_threshold
  ORDER BY products.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

#### Step 5: Create friend recommendations table
```sql
CREATE TABLE friend_recs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  product_id UUID NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_friend_recs_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_friend_recs_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_friend_recs_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_friend_recs_sender ON friend_recs(sender_id);
CREATE INDEX idx_friend_recs_receiver ON friend_recs(receiver_id);
CREATE INDEX idx_friend_recs_product ON friend_recs(product_id);
CREATE INDEX idx_friend_recs_created_at ON friend_recs(created_at);

-- Create a composite index for common queries
CREATE INDEX idx_friend_recs_receiver_created ON friend_recs(receiver_id, created_at DESC);
```

### 3. Authentication Setup

#### Google OAuth (Optional)
1. Go to your Supabase project dashboard
2. Navigate to Authentication > Providers
3. Enable Google provider
4. Add your Google OAuth credentials
5. Add redirect URL: `http://localhost:3000/auth/callback`

### 4. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000`

## 👥 Features

### Authentication & User Management
- ✅ **Google OAuth** - One-click sign-in with Google
- ✅ **Email/Password** - Traditional authentication
- ✅ **User Profiles** - Customizable user information
- ✅ **User Preferences** - Theme, notifications, favorite brands
- ✅ **Session Management** - Automatic session persistence
- ✅ **Protected Routes** - Secure access to all features

### Product Management
- ✅ **CRUD Operations** - Create, read, update, delete products
- ✅ **Vector Search** - Semantic search using OpenAI embeddings
- ✅ **Filtering** - Search by brand, price, tags
- ✅ **Real-time Updates** - Instant UI updates
- ✅ **Responsive Design** - Works on all devices
- ✅ **Product Sharing** - Share products with friends

### Vector Search
- ✅ **Semantic Search** - Find products by meaning, not just keywords
- ✅ **OpenAI Embeddings** - Uses text-embedding-ada-002 model
- ✅ **Cosine Similarity** - Accurate similarity matching
- ✅ **Configurable Threshold** - Adjust search sensitivity

### Personalized Feed
- ✅ **AI-Powered Recommendations** - Uses vector similarity to match user preferences
- ✅ **User Preference Integration** - Considers favorite brands, price range, search history
- ✅ **Dynamic Query Building** - Constructs semantic queries from user data
- ✅ **Fallback Mechanisms** - Provides filtered results when vector search is insufficient
- ✅ **Real-time Updates** - Feed refreshes based on preference changes

### Friend Recommendations
- ✅ **Product Sharing** - Share products with friends via email
- ✅ **Personal Messages** - Add custom messages when sharing
- ✅ **User Search** - Find users by name or email
- ✅ **Recommendation History** - View sent and received recommendations
- ✅ **Social Features** - Track sharing activity and recommendations

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── products/
│   │   │   ├── route.ts              # Product CRUD API
│   │   │   └── [id]/route.ts         # Individual product API
│   │   ├── users/
│   │   │   ├── search/route.ts       # User search API
│   │   │   └── me/
│   │   │       ├── route.ts           # Current user API
│   │   │       └── preferences/route.ts # User preferences API
│   │   ├── friend-recs/
│   │   │   ├── route.ts              # Friend recommendations API
│   │   │   └── [id]/route.ts         # Individual recommendation API
│   │   └── feed/route.ts             # Personalized feed API
│   ├── auth/callback/route.ts        # OAuth callback handler
│   ├── layout.tsx                    # Root layout with AuthProvider
│   └── page.tsx                      # Main page with tabs
├── components/
│   ├── SignIn.tsx                    # Authentication form
│   ├── ProductManager.tsx            # Product management interface
│   ├── UserProfile.tsx               # User profile management
│   ├── Feed.tsx                      # Personalized product feed
│   ├── ShareProduct.tsx              # Product sharing modal
│   └── FriendRecommendations.tsx     # Friend recommendations interface
├── contexts/
│   └── AuthContext.tsx               # Authentication context
├── services/
│   ├── productService.ts             # Product business logic
│   ├── userService.ts                # User business logic
│   └── friendRecsService.ts          # Friend recommendations logic
├── types/
│   ├── product.ts                    # Product TypeScript types
│   ├── friendRecs.ts                 # Friend recommendations types
│   └── db.ts                         # Database TypeScript types
├── utils/
│   └── embeddings.ts                 # OpenAI embedding utilities
└── lib/
    └── supabase.ts                   # Supabase client
```

## 🔍 API Endpoints

### Authentication
- `POST /api/auth/callback` - OAuth callback handler

### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile
- `GET /api/users/me/preferences` - Get user preferences
- `PUT /api/users/me/preferences` - Update user preferences
- `GET /api/users/search?q=query` - Search users for sharing

### Feed
- `GET /api/feed` - Get personalized product recommendations

### Products
- `GET /api/products` - Get all products with filters
- `GET /api/products?query=text` - Vector search by text
- `POST /api/products` - Create new product
- `GET /api/products/[id]` - Get specific product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

### Friend Recommendations
- `GET /api/friend-recs?type=sent|received` - Get sent or received recommendations
- `POST /api/friend-recs` - Create new recommendation
- `GET /api/friend-recs/[id]` - Get specific recommendation
- `DELETE /api/friend-recs/[id]` - Delete recommendation

### Search Examples
```bash
# Vector search
GET /api/products?query=wireless headphones

# Filter by brand
GET /api/products?brand=Apple

# Filter by price range
GET /api/products?min_price=100&max_price=500

# Filter by tags
GET /api/products?tags=smartphone,camera

# Search users for sharing
GET /api/users/search?q=john

# Get received recommendations
GET /api/friend-recs?type=received

# Get sent recommendations
GET /api/friend-recs?type=sent
```

## 👥 Friend Recommendations System

### How it Works
1. **Product Discovery** - Users browse and search products
2. **Sharing** - Click "Share" button on any product
3. **User Selection** - Search and select friends to share with
4. **Personal Message** - Add optional custom message
5. **Notification** - Friends receive recommendations in their feed

### Database Schema
```sql
CREATE TABLE friend_recs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  product_id UUID NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_friend_recs_sender FOREIGN KEY (sender_id) REFERENCES users(id),
  CONSTRAINT fk_friend_recs_receiver FOREIGN KEY (receiver_id) REFERENCES users(id),
  CONSTRAINT fk_friend_recs_product FOREIGN KEY (product_id) REFERENCES products(id)
);
```

### Features
- **User Search** - Find friends by name or email
- **Bulk Sharing** - Share with multiple friends at once
- **Personal Messages** - Add context to recommendations
- **Recommendation History** - Track sent and received recommendations
- **Delete Recommendations** - Remove sent recommendations
- **Real-time Updates** - Instant UI updates when sharing

### Security
- Users can only view recommendations they sent or received
- Only senders can delete their recommendations
- User search excludes current user
- All operations require authentication

## 🧠 Vector Search Details

### How it Works
1. **Text Input** - User enters search query
2. **Embedding Generation** - OpenAI converts text to 1536-dimensional vector
3. **Similarity Search** - pgvector finds products with similar embeddings
4. **Results** - Returns products ordered by similarity score

### Embedding Generation
- **Model**: `text-embedding-ada-002`
- **Dimensions**: 1536
- **Input**: Product name + brand + tags
- **Output**: Numerical vector for similarity comparison

### Performance
- **Index Type**: IVFFlat with 100 lists
- **Search Method**: Cosine similarity
- **Threshold**: Configurable (default: 0.7)
- **Results**: Configurable limit (default: 10)

## 👤 User Model

### Database Schema
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  preferences TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### User Preferences
- **Theme**: Light/Dark mode preference
- **Notifications**: Email notification settings
- **Favorite Brands**: User's preferred brands
- **Price Range**: Min/max price preferences
- **Search History**: Recent search queries

### Auto-User Creation
When a user signs up through Supabase Auth, a corresponding record is automatically created in the `users` table with:
- User ID from auth
- Email address
- Name (from OAuth or email)
- Avatar URL (from OAuth)

## 🔧 Development

### Adding New Products
1. Fill out the product form in the UI
2. System automatically generates embeddings
3. Product is stored with vector data
4. Immediately available for semantic search

### Sharing Products
1. Click "Share" button on any product
2. Search for users by name or email
3. Select friends to share with
4. Add optional personal message
5. Send recommendation

### Customizing User Preferences
- Add new preference fields in `types/db.ts`
- Update the UserProfile component
- Modify the preferences API endpoints

### Database Migrations
Use the SQL files in `supabase/migrations/` to set up your database:
- `001_create_products_table.sql` - Products table setup
- `002_create_vector_search_function.sql` - Vector search functions
- `003_create_users_table.sql` - Users table setup
- `004_create_friend_recs_table.sql` - Friend recommendations table

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository
2. Add environment variables
3. Deploy automatically on push

### Environment Variables for Production
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
OPENAI_API_KEY=your_openai_key
```

### Update OAuth Redirect URLs
- Add your production domain to Supabase OAuth settings
- Update redirect URL to: `https://your-domain.com/auth/callback`

## 🔒 Security Notes

- Environment variables are properly configured for client/server separation
- OAuth callback route handles session exchange securely
- Vector search uses server-side embedding generation
- All database operations are validated and sanitized
- Authentication state is managed through secure cookies
- User data is automatically synced between auth and users table
- Friend recommendations are properly secured with user authorization

## 📊 Monitoring

### Supabase Dashboard
- Monitor database performance
- View authentication logs
- Check API usage
- Track user registrations
- Monitor friend recommendation activity

### OpenAI Dashboard
- Monitor embedding API usage
- Track costs and rate limits

## 🎯 Next Steps

1. **Add More Providers** - Implement additional OAuth providers
2. **Advanced Search** - Add faceted search and filters
3. **Product Images** - Implement image upload and storage
4. **User Preferences** - Save user search history and preferences
5. **Analytics** - Track search patterns and popular products
6. **Admin Panel** - User management and analytics dashboard
7. **Friends System** - Add friend connections and social graph
8. **Notifications** - Email notifications for recommendations
9. **Recommendation Analytics** - Track sharing patterns and engagement 