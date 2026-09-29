import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { checkRateLimit, formatPurchaseDelivery } from '@/lib/security';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to reveal delivery details.' },
        { status: 401 }
      );
    }

    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Rate limit: 5 reveals per 60 seconds per user
    const rateLimit = checkRateLimit(`reveal_${session.id}`, 6, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Please wait ${rateLimit.resetInSec}s before retrying.` },
        { status: 429 }
      );
    }

    // Find the order
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        deliveries: { include: { inventoryItem: { include: { product: true } } } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Ownership check: logged-in user must match order.userId or order.email or be an ADMIN
    const isOwner =
      order.userId === session.id ||
      order.email.toLowerCase() === session.email.toLowerCase() ||
      session.role === 'ADMIN';

    if (!isOwner) {
      return NextResponse.json(
        { error: 'Unauthorized. You do not own this order.' },
        { status: 403 }
      );
    }

    // Update audit timestamp for deliveries
    const now = new Date();
    for (const d of order.deliveries) {
      if (!d.revealedAt) {
        await db.delivery.update({
          where: { id: d.id },
          data: { revealedAt: now },
        });
      }
    }

    // Format credentials securely for client
    const revealedAccounts = order.deliveries.map((d) => {
      const p = d.inventoryItem.product;
      const formatted = formatPurchaseDelivery(
        p.name,
        p.type,
        d.inventoryItem.sensitiveCredentialsMasked,
        p.edition
      );

      return {
        deliveryId: d.id,
        productId: p.id,
        productName: p.name,
        productType: p.type,
        edition: p.edition,
        accountIdentifier: formatted.accountIdentifier,
        instructions: formatted.instructions,
        revealedAt: now.toISOString(),
      };
    });

    const response = NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      deliveries: revealedAccounts,
    });

    // Enforce no-cache security headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve delivery information' },
      { status: 500 }
    );
  }
}
