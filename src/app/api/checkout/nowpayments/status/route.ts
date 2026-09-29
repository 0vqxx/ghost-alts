import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getNowPaymentsPaymentStatus } from '@/lib/nowpayments';
import { sendDiscordDeliveryMessage } from '@/lib/discordBot';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('orderNumber');
    const paymentId = searchParams.get('paymentId');

    if (!orderNumber && !paymentId) {
      return NextResponse.json({ error: 'orderNumber or paymentId required' }, { status: 400 });
    }

    const order = await db.order.findFirst({
      where: orderNumber ? { orderNumber } : { paymentId: String(paymentId) },
      include: {
        user: true,
        items: { include: { product: true } },
        deliveries: { include: { inventoryItem: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Ownership check: user must own the order or be an ADMIN
    const isOwner =
      order.userId === session.id ||
      order.email.toLowerCase() === session.email.toLowerCase() ||
      session.role === 'ADMIN';

    if (!isOwner) {
      return NextResponse.json(
        { error: 'Unauthorized. You do not have permission to view this order.' },
        { status: 403 }
      );
    }

    // Check with NOWPayments API if paymentId is available and order is still pending
    let liveStatus = order.status;
    if (order.status === 'PENDING' && order.paymentId) {
      try {
        const paymentData = await getNowPaymentsPaymentStatus(order.paymentId);
        if (paymentData?.payment_status === 'finished' || paymentData?.payment_status === 'confirmed') {
          const deliveredItems: { email: string; password: string; token?: string | null; productName: string }[] = [];

          // Fulfill order
          for (const item of order.items) {
            const availKeys = await db.inventoryItem.findMany({
              where: { productId: item.productId, status: 'AVAILABLE' },
              take: item.quantity,
            });

            for (const key of availKeys) {
              await db.inventoryItem.update({
                where: { id: key.id },
                data: { status: 'SOLD', soldAt: new Date(), orderId: order.id },
              });
              await db.delivery.create({
                data: { orderId: order.id, inventoryItemId: key.id },
              });

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

            const totalAvail = await db.inventoryItem.count({
              where: { productId: item.productId, status: 'AVAILABLE' },
            });
            await db.product.update({
              where: { id: item.productId },
              data: { stockCount: totalAvail },
            });
          }

          const updated = await db.order.update({
            where: { id: order.id },
            data: { status: 'DELIVERED' },
          });
          liveStatus = updated.status;

          // Dispatch Discord Delivery Message
          const discordUserId = order.discordId || order.user?.discordId || session.discordId || (order.userId && /^\d+$/.test(order.userId) ? order.userId : null);
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
      } catch (err) {
        console.error('Error polling NOWPayments live status:', err);
      }
    }

    const freshOrder = await db.order.findUnique({
      where: { id: order.id },
      include: {
        deliveries: { include: { inventoryItem: true } },
      },
    });

    return NextResponse.json({
      orderNumber: order.orderNumber,
      status: liveStatus,
      isDelivered: liveStatus === 'DELIVERED' || liveStatus === 'COMPLETED',
      deliveries: (freshOrder?.deliveries || []).map((d) => ({
        id: d.id,
        credentials: d.inventoryItem?.sensitiveCredentialsMasked,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Status check failed' }, { status: 500 });
  }
}
