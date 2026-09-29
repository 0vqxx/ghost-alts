import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getCryptoSettings, saveCryptoSettings } from '@/lib/cryptoSettings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();

    const settings = await getCryptoSettings();

    return NextResponse.json({
      settings,
    });
  } catch (err: any) {
    console.error('[Admin Crypto Settings GET] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Unauthorized or server error' },
      { status: err.message?.includes('Unauthorized') || err.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { settings } = body;

    if (!Array.isArray(settings)) {
      return NextResponse.json(
        { error: 'Invalid payload, settings array required' },
        { status: 400 }
      );
    }

    const updated = await saveCryptoSettings(settings);

    return NextResponse.json({
      success: true,
      settings: updated,
    });
  } catch (err: any) {
    console.error('[Admin Crypto Settings POST] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Unauthorized or server error' },
      { status: err.message?.includes('Unauthorized') || err.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}
