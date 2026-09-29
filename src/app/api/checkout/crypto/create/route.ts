import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getCryptoSettingBySymbol } from '@/lib/cryptoSettings';
import { getCryptoPriceUSD, calculateCryptoAmount } from '@/lib/crypto/rates';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, cryptoCurrency, discountCode } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items in checkout payload' }, { status: 400 });
    }

    const selectedCrypto = (cryptoCurrency || 'LTC').toUpperCase() as 'BTC' | 'LTC';
    if (!['BTC', 'LTC'].includes(selectedCrypto)) {
      return NextResponse.json(
        { error: 'Invalid crypto currency. Must be BTC or LTC.' },
        { status: 400 }
      );
    }

    // 1. Check Global Crypto Settings
    const cryptoSetting = await getCryptoSettingBySymbol(selectedCrypto);

    if (!cryptoSetting || !cryptoSetting.enabled || !cryptoSetting.address.trim()) {
      return NextResponse.json(
        {
          error: `${selectedCrypto} payments are currently not configured or disabled by store management. Please choose another payment method or contact support.`,
        },
        { status: 400 }
      );
    }

    // 2. Identify User (from Next Session or Supabase Auth)
    let sessionUser = await getSession();
    let userEmail = sessionUser?.email || '';
    let userId = sessionUser?.id || null;
    let discordId = sessionUser?.discordId || null;

    if (!userId) {
      try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);
        const {
          data: { user: sbUser },
        } = await supabase.auth.getUser();
        if (sbUser) {
          userEmail = sbUser.email || userEmail;
          discordId =
            sbUser.user_metadata?.provider_id ||
            sbUser.user_metadata?.sub ||
            sbUser.identities?.find((i) => i.provider === 'discord')?.id ||
            discordId;

          // Find or create in DB
          let dbUser = await db.user.findFirst({
            where: {
              OR: [
                ...(sbUser.email ? [{ email: sbUser.email }] : []),
                ...(discordId ? [{ discordId }] : []),
              ],
            },
          });
          if (dbUser) {
            userId = dbUser.id;
          }
        }
      } catch (e) {
        console.warn('Supabase session lookup error in crypto create:', e);
      }
    }

    if (!userEmail) {
      userEmail = body.email || 'customer@ghostalts.shop';
    }

    // 3. Validate Products & Stock & Crypto Acceptance
    let subtotal = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
        include: {
          inventoryItems: {
            where: { status: 'AVAILABLE' },
          },
        },
      });

      if (!product || !product.active) {
        return NextResponse.json(
          { error: `Product ${product?.name || item.productId} is no longer available.` },
          { status: 400 }
        );
      }

      // Check product accepted cryptos
      let accepted: string[] = ['LTC', 'BTC'];
      try {
        if (product.acceptedCryptos) {
          accepted = JSON.parse(product.acceptedCryptos);
        }
      } catch {}

      if (!accepted.includes(selectedCrypto)) {
        return NextResponse.json(
          {
            error: `Product "${product.name}" does not accept ${selectedCrypto}. Accepted: ${accepted.join(', ')}`,
          },
          { status: 400 }
        );
      }

      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      const availableStock = product.inventoryItems.length;

      if (availableStock < quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for "${product.name}". Available: ${availableStock}, Requested: ${quantity}`,
          },
          { status: 400 }
        );
      }

      const itemTotal = product.price * quantity;
      subtotal += itemTotal;

      orderItemsData.push({
        productId: product.id,
        price: product.price,
        quantity,
      });
    }

    // 4. Calculate Discounts
    let discountAmount = 0;
    let validDiscountCode = null;

    if (discountCode) {
      const codeRecord = await db.discountCode.findUnique({
        where: { code: discountCode.trim().toUpperCase() },
      });

      if (codeRecord && codeRecord.active && codeRecord.usedCount < codeRecord.maxUses) {
        discountAmount = (subtotal * codeRecord.percentage) / 100;
        validDiscountCode = codeRecord.code;
      }
    }

    const totalAmount = Math.max(0.01, parseFloat((subtotal - discountAmount).toFixed(2)));

    // 5. Fetch Live Crypto Rate and Calculate Exact Crypto Amount
    const cryptoPriceUSD = await getCryptoPriceUSD(selectedCrypto);
    const cryptoAmountExpected = calculateCryptoAmount(totalAmount, cryptoPriceUSD);

    // 6. Generate Order ID and Pending Order Record
    const randPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    const timePart = Date.now().toString().slice(-4);
    const orderNumber = `GA-${selectedCrypto}-${randPart}${timePart}`;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes expiry

    const order = await db.order.create({
      data: {
        orderNumber,
        userId,
        discordId,
        email: userEmail,
        totalAmount,
        subtotal,
        discountAmount,
        discountCode: validDiscountCode,
        status: 'PENDING',
        paymentMethod: `crypto_${selectedCrypto.toLowerCase()}`,
        cryptoCurrency: selectedCrypto,
        cryptoAmountExpected,
        cryptoAmountReceived: 0,
        receivingAddress: cryptoSetting.address.trim(),
        exchangeRate: cryptoPriceUSD,
        paymentStatus: 'awaiting_payment',
        expiresAt,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      cryptoCurrency: selectedCrypto,
      cryptoAmountExpected,
      receivingAddress: order.receivingAddress,
      totalAmount,
      subtotal,
      discountAmount,
      exchangeRate: cryptoPriceUSD,
      expiresAt: order.expiresAt,
      minConfirmations: cryptoSetting.minConfirmations,
    });
  } catch (err: any) {
    console.error('[Crypto Checkout Create] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create crypto order' },
      { status: 500 }
    );
  }
}
