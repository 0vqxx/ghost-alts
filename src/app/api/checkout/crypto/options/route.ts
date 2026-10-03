import { NextResponse } from 'next/server';
import { getCryptoSettings } from '@/lib/cryptoSettings';
import { getCryptoPriceUSD } from '@/lib/crypto/rates';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getCryptoSettings();
    const btcSetting = settings.find((s) => s.symbol === 'BTC');
    const ltcSetting = settings.find((s) => s.symbol === 'LTC');

    const btcPrice = await getCryptoPriceUSD('BTC');
    const ltcPrice = await getCryptoPriceUSD('LTC');

    const options = [
      {
        symbol: 'LTC',
        name: 'Litecoin',
        icon: 'Ł',
        enabled: Boolean(ltcSetting?.enabled && ltcSetting?.address?.trim()),
        addressConfigured: Boolean(ltcSetting?.address?.trim()),
        priceUsd: ltcPrice,
        minConfirmations: ltcSetting?.minConfirmations || 1,
      },
    ];

    return NextResponse.json({ options });
  } catch (err: any) {
    console.error('[Crypto Options GET] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch payment options' }, { status: 500 });
  }
}
