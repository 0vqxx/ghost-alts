import { NextResponse } from 'next/server';
import { isDatabaseAvailable } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const ready = await isDatabaseAvailable();
  return NextResponse.json({ ready }, { status: ready ? 200 : 503 });
}
