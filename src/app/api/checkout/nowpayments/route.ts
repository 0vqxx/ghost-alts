import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { createNowPaymentsInvoice, createNowPaymentsPayment } from '@/lib/nowpayments';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in with Discord to checkout.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { items, payCurrency } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Calculate total and verify products
    let subtotal = 0;
    const orderItemsData: any[] = [];

    for (const item of items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 });
      }

      const quantity = Math.max(1, parseInt(item.quantity) || 1);
      const itemTotal = product.price * quantity;
      subtotal += itemTotal;

      orderItemsData.push({
        productId: product.id,
        price: product.price,
        quantity,
      });
    }

    if (subtotal <= 0) {
      return NextResponse.json({ error: 'Invalid order amount' }, { status: 400 });
    }

    const orderNumber = `GA-${Math.floor(10000 + Math.random() * 90000)}`;
    const origin = request.headers.get('origin') || 'https://ghostalts.shop';
    const ipnCallbackUrl = `${origin}/api/checkout/nowpayments/ipn`;
    const successUrl = `${origin}/checkout/success?orderNumber=${orderNumber}`;
    const cancelUrl = `${origin}/checkout`;

    // Create pending Order in DB
    const order = await db.order.create({
      data: {
        orderNumber,
        userId: session.id,
        discordId: session.discordId || null,
        email: session.email,
        subtotal,
        totalAmount: subtotal,
        status: 'PENDING',
        paymentMethod: 'nowpayments_crypto',
        items: {
          create: orderItemsData,
        },
      },
    });

    let nowpaymentsResponse: any = null;

    if (payCurrency && typeof payCurrency === 'string') {
      // Direct crypto address payment
      nowpaymentsResponse = await createNowPaymentsPayment({
        priceAmount: subtotal,
        payCurrency,
        orderId: order.orderNumber,
        orderDescription: `GhostAlts Order ${order.orderNumber}`,
        ipnCallbackUrl,
        customerEmail: session.email,
      });

      if (nowpaymentsResponse?.payment_id) {
        await db.order.update({
          where: { id: order.id },
          data: { paymentId: String(nowpaymentsResponse.payment_id) },
        });
      }
    } else {
      // Hosted Invoice URL
      nowpaymentsResponse = await createNowPaymentsInvoice({
        priceAmount: subtotal,
        orderId: order.orderNumber,
        orderDescription: `GhostAlts Order ${order.orderNumber}`,
        ipnCallbackUrl,
        successUrl,
        cancelUrl,
      });

      if (nowpaymentsResponse?.id) {
        await db.order.update({
          where: { id: order.id },
          data: { paymentId: String(nowpaymentsResponse.id) },
        });
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalAmount: subtotal,
      invoiceUrl: nowpaymentsResponse?.invoice_url || null,
      paymentData: nowpaymentsResponse,
    });
  } catch (error: any) {
    console.error('NOWPayments checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize crypto checkout' },
      { status: 500 }
    );
  }
}
