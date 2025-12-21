import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe - Add STRIPE_SECRET_KEY to your .env.local
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency, paymentMethodId, description, metadata } = body;

    // Validate inputs
    if (!amount || !paymentMethodId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency || 'kes', // Kenyan Shilling
      payment_method: paymentMethodId,
      confirm: true,
      description: description || 'Coin purchase',
      metadata: metadata || {},
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    });

    // Check payment status
    if (paymentIntent.status === 'succeeded') {
      return NextResponse.json({
        success: true,
        message: 'Payment successful',
        paymentIntentId: paymentIntent.id,
        transactionId: paymentIntent.id,
      });
    } else if (paymentIntent.status === 'requires_action') {
      // 3D Secure authentication required
      return NextResponse.json({
        success: false,
        requiresAction: true,
        clientSecret: paymentIntent.client_secret,
        message: 'Additional authentication required',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Payment failed',
          status: paymentIntent.status,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Stripe payment error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Payment processing failed',
        type: error.type,
      },
      { status: 500 }
    );
  }
}

// Create payment method endpoint
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { cardNumber, expMonth, expYear, cvc, cardholderName } = body;

    // Create payment method
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: cardNumber.replace(/\s/g, ''),
        exp_month: parseInt(expMonth),
        exp_year: parseInt(expYear),
        cvc: cvc,
      },
      billing_details: {
        name: cardholderName,
      },
    });

    return NextResponse.json({
      success: true,
      paymentMethodId: paymentMethod.id,
      card: {
        brand: paymentMethod.card?.brand,
        last4: paymentMethod.card?.last4,
      },
    });
  } catch (error: any) {
    console.error('Create payment method error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to create payment method',
      },
      { status: 500 }
    );
  }
}