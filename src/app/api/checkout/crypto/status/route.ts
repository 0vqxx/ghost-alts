import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCryptoSettingBySymbol } from '@/lib/cryptoSettings';
import { checkAddressPayment } from '@/lib/crypto/blockchain';
import { sendDiscordDeliveryMessage } from '@/lib/discordBot';

export const dynamic = 'force-dynamic';

type CryptoOrderDelivery = {
  id: string;
  inventoryItem: { sensitiveCredentialsMasked: string };
  deliveredAt: Date;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('orderNumber');
    const orderId = searchParams.get('orderId');

    if (!orderNumber && !orderId) {
      return NextResponse.json({ error: 'orderNumber or orderId is required' }, { status: 400 });
    }

    const order = await db.order.findFirst({
      where: {
        OR: [
          ...(orderNumber ? [{ orderNumber }] : []),
          ...(orderId ? [{ id: orderId }] : []),
        ],
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        deliveries: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 1. If already delivered / paid
    if (order.status === 'DELIVERED' || order.paymentStatus === 'paid') {
      const deliveries = order.deliveries.map((d: CryptoOrderDelivery) => ({
        id: d.id,
        credentials: d.inventoryItem.sensitiveCredentialsMasked,
        deliveredAt: d.deliveredAt,
      }));

      return NextResponse.json({
        isDelivered: true,
        paymentStatus: 'paid',
        status: order.status,
        orderNumber: order.orderNumber,
        cryptoCurrency: order.cryptoCurrency,
        cryptoAmountExpected: order.cryptoAmountExpected,
        cryptoAmountReceived: order.cryptoAmountReceived,
        receivingAddress: order.receivingAddress,
        txHash: order.txHash,
        confirmations: order.confirmations || 1,
        paidAt: order.paidAt,
        deliveries,
      });
    }

    // 2. Check if expired
    if (order.expiresAt && new Date() > new Date(order.expiresAt)) {
      if (order.paymentStatus !== 'expired') {
        await db.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'expired', status: 'CANCELLED' },
        });
      }
      return NextResponse.json({
        isDelivered: false,
        paymentStatus: 'expired',
        status: 'CANCELLED',
        orderNumber: order.orderNumber,
      });
    }

    // 3. Query the blockchain for live transaction updates
    const cryptoSym = (order.cryptoCurrency || 'LTC') as 'BTC' | 'LTC';
    const receivingAddr = order.receivingAddress || '';
    const expectedAmt = order.cryptoAmountExpected || 0;
    const createdAtTime = new Date(order.createdAt).getTime();

    // Fetch minConfirmations from settings
    const setting = await getCryptoSettingBySymbol(cryptoSym);
    const minConf = setting?.minConfirmations || 1;

    const checkResult = await checkAddressPayment(
      cryptoSym,
      receivingAddr,
      expectedAmt,
      createdAtTime,
      minConf
    );

    // Update intermediate status if detected / confirming
    if (checkResult.status === 'detected' || checkResult.status === 'confirming') {
      await db.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: checkResult.status,
          txHash: checkResult.txHash || order.txHash,
          confirmations: checkResult.confirmations,
          cryptoAmountReceived: checkResult.amountReceived,
        },
      });

      return NextResponse.json({
        isDelivered: false,
        paymentStatus: checkResult.status,
        orderNumber: order.orderNumber,
        txHash: checkResult.txHash,
        confirmations: checkResult.confirmations,
        minConfirmations: minConf,
        cryptoAmountReceived: checkResult.amountReceived,
        cryptoAmountExpected: order.cryptoAmountExpected,
        explorerUrl: checkResult.explorerUrl,
      });
    }

    // 4. Payment confirmed! Execute atomic fulfillment
    if (checkResult.status === 'paid') {
      const fulfilledDeliveries: any[] = [];

      await db.$transaction(async (tx) => {
        // Re-check order status to ensure idempotency
        const freshOrder = await tx.order.findUnique({
          where: { id: order.id },
        });

        if (freshOrder?.status === 'DELIVERED') return;

        // Allocate inventory items for each ordered product
        for (const item of order.items) {
          const qty = item.quantity || 1;
          const availableKeys = await tx.inventoryItem.findMany({
            where: {
              productId: item.productId,
              status: 'AVAILABLE',
            },
            take: qty,
          });

          for (const key of availableKeys) {
            await tx.inventoryItem.update({
              where: { id: key.id },
              data: {
                status: 'SOLD',
                orderId: order.id,
                soldAt: new Date(),
              },
            });

            const delivery = await tx.delivery.create({
              data: {
                orderId: order.id,
                inventoryItemId: key.id,
              },
              include: {
                inventoryItem: true,
              },
            });

            fulfilledDeliveries.push({
              id: delivery.id,
              credentials: key.sensitiveCredentialsMasked,
              deliveredAt: delivery.deliveredAt,
              productName: item.product.name,
            });
          }
        }

        // Update Order to DELIVERED
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'DELIVERED',
            paymentStatus: 'paid',
            paidAt: new Date(),
            txHash: checkResult.txHash || order.txHash,
            confirmations: checkResult.confirmations,
            cryptoAmountReceived: checkResult.amountReceived,
          },
        });
      });

      // Dispatch Discord Bot DM Delivery if user linked Discord
      if (order.discordId && fulfilledDeliveries.length > 0) {
        try {
          const firstItem = order.items[0];
          const credentialsStr = fulfilledDeliveries.map((d) => d.credentials).join(' | ');

          await sendDiscordDeliveryMessage({
            discordUserId: order.discordId,
            orderNumber: order.orderNumber,
            productName: firstItem?.product?.name || 'Minecraft Account',
            quantity: order.items.reduce((sum: number, i: { quantity: number }) => sum + i.quantity, 0),
            email: order.email,
            password: credentialsStr,
            deliveredAt: new Date(),
          });
        } catch (botErr) {
          console.error('[Discord DM Delivery] Error:', botErr);
        }
      }

      return NextResponse.json({
        isDelivered: true,
        paymentStatus: 'paid',
        status: 'DELIVERED',
        orderNumber: order.orderNumber,
        cryptoCurrency: order.cryptoCurrency,
        cryptoAmountExpected: order.cryptoAmountExpected,
        cryptoAmountReceived: checkResult.amountReceived,
        receivingAddress: order.receivingAddress,
        txHash: checkResult.txHash,
        confirmations: checkResult.confirmations,
        paidAt: new Date().toISOString(),
        explorerUrl: checkResult.explorerUrl,
        deliveries: fulfilledDeliveries,
      });
    }

    // Default awaiting payment
    return NextResponse.json({
      isDelivered: false,
      paymentStatus: order.paymentStatus || 'awaiting_payment',
      orderNumber: order.orderNumber,
      cryptoCurrency: order.cryptoCurrency,
      cryptoAmountExpected: order.cryptoAmountExpected,
      cryptoAmountReceived: order.cryptoAmountReceived || 0,
      receivingAddress: order.receivingAddress,
      txHash: order.txHash,
      confirmations: order.confirmations || 0,
      minConfirmations: minConf,
      expiresAt: order.expiresAt,
    });
  } catch (err: any) {
    console.error('[Crypto Status Check] Error:', err);
    return NextResponse.json({ error: err.message || 'Status check failed' }, { status: 500 });
  }
}
