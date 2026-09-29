import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'Public account registration is disabled. Please sign in with your authorized Ghost Alts account.',
    },
    { status: 403 }
  );
}
