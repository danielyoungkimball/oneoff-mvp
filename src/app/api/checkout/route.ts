import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { OrderService } from '../../../services/orderService';
import { CreateOrderInput, BotTriggerPayload } from '../../../types/order';

export async function POST(request: NextRequest) {
  try {
    // Get current authenticated user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body: CreateOrderInput = await request.json();
    
    // Validate required fields
    if (!body.productId || !body.shippingAddress || !body.billingInfo) {
      return NextResponse.json(
        { error: 'Product ID, shipping address, and billing info are required' },
        { status: 400 }
      );
    }

    // Create the order
    const order = await OrderService.createOrder(authUser.id, body);
    
    // Get product details for bot trigger
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('source_url')
      .eq('id', body.productId)
      .single();

    if (productError) {
      console.error('Error fetching product for bot trigger:', productError);
      // Continue with order creation even if product fetch fails
    }

    // Trigger checkout bot (async - don't wait for response)
    if (product?.source_url) {
      triggerCheckoutBot({
        orderId: order.id,
        productUrl: product.source_url,
        shippingAddress: body.shippingAddress,
        billingInfo: body.billingInfo,
        webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/checkout/webhook`
      }).catch(error => {
        console.error('Error triggering checkout bot:', error);
        // Update bot status to failed
        OrderService.updateBotStatus(order.id, 'failed', [
          `Bot trigger failed: ${error.message}`
        ]).catch(updateError => {
          console.error('Error updating bot status:', updateError);
        });
      });
    } else {
      // No product URL available
      await OrderService.updateBotStatus(order.id, 'failed', [
        'No product URL available for bot processing'
      ]);
    }

    return NextResponse.json({
      orderId: order.id,
      status: 'pending',
      message: 'Checkout initiated successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in checkout:', error);
    return NextResponse.json(
      { error: 'Failed to process checkout' },
      { status: 500 }
    );
  }
}

// Trigger the checkout bot (this would typically call an external service)
async function triggerCheckoutBot(payload: BotTriggerPayload): Promise<void> {
  // This is where you would trigger your headless browser bot
  // Options include:
  // 1. AWS Lambda with Playwright
  // 2. External webhook to your bot service
  // 3. Queue system (SQS, Redis, etc.)
  // 4. Direct API call to your bot service

  const botServiceUrl = process.env.BOT_SERVICE_URL;
  
  if (botServiceUrl) {
    // Call external bot service
    const response = await fetch(botServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BOT_SERVICE_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Bot service responded with status: ${response.status}`);
    }
  } else {
    // For development, just log the payload
    console.log('Bot trigger payload:', JSON.stringify(payload, null, 2));
    
    // Simulate bot processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real implementation, you would:
    // 1. Send this to a queue (SQS, Redis, etc.)
    // 2. Have a separate service process the queue
    // 3. Use Playwright to automate the checkout
    // 4. Update the order status via webhook
    
    console.log('Bot processing would start here...');
    console.log('Using Playwright to automate checkout for:', payload.productUrl);
  }
} 