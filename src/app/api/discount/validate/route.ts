import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get('code')?.trim().toUpperCase();
  if (!code || code.length > 64) {
    return NextResponse.json({ valid: false });
  }

  const discount = await db.discountCode.findUnique({ where: { code } });
  if (!discount?.active || discount.usedCount >= discount.maxUses) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({ valid: true, code, percentage: discount.percentage });
}
