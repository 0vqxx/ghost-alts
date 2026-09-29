import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyIpnSignature } from '@/lib/nowpayments';
import { sendDiscordDeliveryMessage } from '@/lib/discordBot';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    let body: any = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const signature = request.headers.get('x-nowpayments-sig');
    const isValid = verifyIpnSignature(body, signature);

    if (!isValid) {
      console.warn('Invalid NOWPayments IPN signature received');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const { order_id, payment_status, payment_id } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { orderNumber: String(order_id) },
      include: {
        user: true,
        items: { include: { product: true } },
        deliveries: { include: { inventoryItem: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check payment status
    // NOWPayments statuses: 'waiting', 'confirming', 'confirmed', 'sending', 'finished', 'failed', 'refunded', 'expired'
    if (payment_status === 'finished' || payment_status === 'confirmed') {
      if (order.status !== 'DELIVERED' && order.status !== 'COMPLETED') {
        const deliveredItems: { email: string; password: string; token?: string | null; productName: string }[] = [];

        // Fulfill the order by assigning real available inventory items
        for (const item of order.items) {
          const availKeys = await db.inventoryItem.findMany({
            where: {
              productId: item.productId,
              status: 'AVAILABLE',
            },
            take: item.quantity,
          });

          for (const key of availKeys) {
            await db.inventoryItem.update({
              where: { id: key.id },
              data: {
                status: 'SOLD',
                soldAt: new Date(),
                orderId: order.id,
              },
            });

            await db.delivery.create({
              data: {
                orderId: order.id,
                inventoryItemId: key.id,
              },
            });

            // Parse delivered credentials
            const creds = key.sensitiveCredentialsMasked || '';
            let accEmail = order.email;
            let accPassword = '••••••••';
            let accToken: string | null = null;

            if (creds.includes(':')) {
              const parts = creds.split(':');
              accEmail = parts[0];
              accPassword = parts[1] || '••••••••';
              accToken = parts[2] || null;
            } else if (creds) {
              accEmail = creds;
            }

            deliveredItems.push({
              email: accEmail,
              password: accPassword,
              token: accToken,
              productName: item.product.name,
            });
          }

          // Update stock count
          const totalAvail = await db.inventoryItem.count({
            where: { productId: item.productId, status: 'AVAILABLE' },
          });
          await db.product.update({
            where: { id: item.productId },
            data: { stockCount: totalAvail },
          });
        }

        await db.order.update({
          where: { id: order.id },
          data: {
            status: 'DELIVERED',
            paymentId: payment_id ? String(payment_id) : order.paymentId,
          },
        });

        // Send Discord Delivery DM
        const discordUserId = order.discordId || order.user?.discordId || (order.userId && /^\d+$/.test(order.userId) ? order.userId : null);
        if (discordUserId && deliveredItems.length > 0) {
          for (const dItem of deliveredItems) {
            await sendDiscordDeliveryMessage({
              discordUserId,
              orderNumber: order.orderNumber,
              productName: dItem.productName,
              quantity: 1,
              email: dItem.email,
              password: dItem.password,
              token: dItem.token,
              deliveredAt: new Date(),
            });
          }
        }
      }
    } else if (payment_status === 'failed' || payment_status === 'expired') {
      await db.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('IPN processing error:', error);
    return NextResponse.json({ error: error.message || 'IPN error' }, { status: 500 });
  }
}
