import { supabase } from '../../lib/supabase';
import { Order, CreateOrderInput, OrderWithDetails, BotTriggerPayload } from '../types/order';
import { Product } from '../types/product';

export class OrderService {
  // Create a new order
  static async createOrder(userId: string, input: CreateOrderInput): Promise<Order> {
    // Get product details to calculate total
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('price, source_url')
      .eq('id', input.productId)
      .single();

    if (productError) throw productError;

    const { data, error } = await supabase
      .from('orders')
      .insert([{
        user_id: userId,
        product_id: input.productId,
        shipping_address: input.shippingAddress,
        billing_info: input.billingInfo,
        order_total: product?.price || 0,
        bot_status: 'queued',
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get order by ID with product details
  static async getOrderWithDetails(orderId: string): Promise<OrderWithDetails | null> {
    const { data, error } = await supabase
      .rpc('get_order_with_details', { order_uuid: orderId });

    if (error) throw error;
    return data?.[0] || null;
  }

  // Get user's orders
  static async getUserOrders(userId: string, limit = 20, offset = 0): Promise<{
    orders: OrderWithDetails[];
    total: number;
    hasMore: boolean;
  }> {
    const { data, error, count } = await supabase
      .from('orders')
      .select(`
        *,
        product:products!orders_product_id_fkey(id, name, brand, price, source_url, img_url)
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const ordersWithDetails: OrderWithDetails[] = (data || []).map(order => ({
      ...order,
      product_name: order.product?.name || '',
      product_brand: order.product?.brand,
      product_price: order.product?.price,
      product_source_url: order.product?.source_url,
      product_img_url: order.product?.img_url,
    }));

    return {
      orders: ordersWithDetails,
      total: count || 0,
      hasMore: (offset + limit) < (count || 0)
    };
  }

  // Update order status
  static async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) throw error;
  }

  // Update bot status
  static async updateBotStatus(orderId: string, botStatus: Order['bot_status'], logs?: string[]): Promise<void> {
    const updateData: any = { bot_status: botStatus };
    if (logs) {
      updateData.bot_logs = logs;
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) throw error;
  }

  // Get orders pending bot processing
  static async getPendingBotOrders(limit = 10): Promise<OrderWithDetails[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        product:products!orders_product_id_fkey(id, name, brand, price, source_url, img_url)
      `)
      .eq('bot_status', 'queued')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(order => ({
      ...order,
      product_name: order.product?.name || '',
      product_brand: order.product?.brand,
      product_price: order.product?.price,
      product_source_url: order.product?.source_url,
      product_img_url: order.product?.img_url,
    }));
  }

  // Cancel order
  static async cancelOrder(orderId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: 'cancelled',
        bot_status: 'failed'
      })
      .eq('id', orderId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // Get order statistics for a user
  static async getUserOrderStats(userId: string): Promise<{
    total: number;
    pending: number;
    completed: number;
    failed: number;
  }> {
    const { data, error } = await supabase
      .from('orders')
      .select('status')
      .eq('user_id', userId);

    if (error) throw error;

    const orders = data || [];
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      completed: orders.filter(o => o.status === 'completed').length,
      failed: orders.filter(o => ['failed', 'cancelled'].includes(o.status)).length,
    };
  }
} 