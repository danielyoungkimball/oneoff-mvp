export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

export interface BillingInfo {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
  billingAddress: ShippingAddress;
}

export interface CreateOrderInput {
  productId: string;
  shippingAddress: ShippingAddress;
  billingInfo: BillingInfo;
}

export interface Order {
  id: string;
  user_id: string;
  product_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  shipping_address: ShippingAddress;
  billing_info: BillingInfo;
  order_total?: number;
  bot_status: 'queued' | 'running' | 'completed' | 'failed';
  bot_logs?: string[];
  created_at: string;
  updated_at: string;
}

export interface OrderWithDetails extends Order {
  product_name: string;
  product_brand?: string;
  product_price?: number;
  product_source_url?: string;
  product_img_url?: string;
}

export interface CheckoutResponse {
  orderId: string;
  status: string;
  message: string;
}

export interface BotTriggerPayload {
  orderId: string;
  productUrl: string;
  shippingAddress: ShippingAddress;
  billingInfo: BillingInfo;
  webhookUrl?: string;
}

export interface BotStatusUpdate {
  orderId: string;
  botStatus: 'queued' | 'running' | 'completed' | 'failed';
  logs?: string[];
  error?: string;
} 