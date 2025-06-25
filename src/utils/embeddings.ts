import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class EmbeddingService {
  // Generate embedding for product text
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  // Generate embedding for a product
  static async generateProductEmbedding(product: {
    name: string;
    brand?: string;
    tags?: string[];
  }): Promise<number[]> {
    const text = [
      product.name,
      product.brand,
      ...(product.tags || [])
    ].filter(Boolean).join(' ');

    return this.generateEmbedding(text);
  }

  // Generate embeddings for multiple products
  static async generateProductEmbeddings(products: Array<{
    name: string;
    brand?: string;
    tags?: string[];
  }>): Promise<number[][]> {
    const texts = products.map(product => 
      [product.name, product.brand, ...(product.tags || [])].filter(Boolean).join(' ')
    );

    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: texts,
      });

      return response.data.map(item => item.embedding);
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw new Error('Failed to generate embeddings');
    }
  }

  // Calculate cosine similarity between two embeddings
  static calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same length');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  }
} 