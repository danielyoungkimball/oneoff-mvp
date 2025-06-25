# OneOff MVP - Complete Setup Guide

This project includes a complete authentication system and product management with vector search using Supabase and OpenAI embeddings.

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

Run these SQL commands in your Supabase SQL editor:

#### Step 1: Enable pgvector extension
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

#### Step 2: Create products table
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
```

#### Step 3: Create indexes
```sql
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_tags ON products USING GIN(tags);
CREATE INDEX idx_products_embedding ON products USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
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

## 🛍️ Features

### Authentication
- ✅ **Google OAuth** - One-click sign-in with Google
- ✅ **Email/Password** - Traditional authentication
- ✅ **Session Management** - Automatic session persistence
- ✅ **Protected Routes** - Secure access to product management

### Product Management
- ✅ **CRUD Operations** - Create, read, update, delete products
- ✅ **Vector Search** - Semantic search using OpenAI embeddings
- ✅ **Filtering** - Search by brand, price, tags
- ✅ **Real-time Updates** - Instant UI updates
- ✅ **Responsive Design** - Works on all devices

### Vector Search
- ✅ **Semantic Search** - Find products by meaning, not just keywords
- ✅ **OpenAI Embeddings** - Uses text-embedding-ada-002 model
- ✅ **Cosine Similarity** - Accurate similarity matching
- ✅ **Configurable Threshold** - Adjust search sensitivity

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── products/
│   │       ├── route.ts              # Product CRUD API
│   │       └── [id]/route.ts         # Individual product API
│   │   ├── auth/callback/route.ts        # OAuth callback handler
│   │   ├── layout.tsx                    # Root layout with AuthProvider
│   │   └── page.tsx                      # Main page with conditional rendering
│   ├── components/
│   │   ├── SignIn.tsx                    # Authentication form
│   │   ├── Dashboard.tsx                 # User dashboard
│   │   └── ProductManager.tsx            # Product management interface
│   ├── contexts/
│   │   └── AuthContext.tsx               # Authentication context
│   ├── services/
│   │   └── productService.ts             # Product business logic
│   ├── types/
│   │   └── product.ts                    # TypeScript types
│   └── utils/
│       └── embeddings.ts                 # OpenAI embedding utilities
└── lib/
    └── supabase.ts                   # Supabase client
```

## 🔍 API Endpoints

### Products
- `GET /api/products` - Get all products with filters
- `GET /api/products?query=text` - Vector search by text
- `POST /api/products` - Create new product
- `GET /api/products/[id]` - Get specific product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

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
```

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

## 🔧 Development

### Adding New Products
1. Fill out the product form in the UI
2. System automatically generates embeddings
3. Product is stored with vector data
4. Immediately available for semantic search

### Customizing Search
- Adjust similarity threshold in API calls
- Modify embedding generation logic in `embeddings.ts`
- Add new filters in `productService.ts`

### Database Migrations
Use the SQL files in `supabase/migrations/` to set up your database:
- `001_create_products_table.sql` - Basic table setup
- `002_create_vector_search_function.sql` - Vector search functions

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

## 📊 Monitoring

### Supabase Dashboard
- Monitor database performance
- View authentication logs
- Check API usage

### OpenAI Dashboard
- Monitor embedding API usage
- Track costs and rate limits

## 🎯 Next Steps

1. **Add More Providers** - Implement additional OAuth providers
2. **Advanced Search** - Add faceted search and filters
3. **Product Images** - Implement image upload and storage
4. **User Preferences** - Save user search history and preferences
5. **Analytics** - Track search patterns and popular products 