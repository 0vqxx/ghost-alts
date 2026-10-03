import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

function clearSession(response: NextResponse) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
  return response;
}

export async function GET(request: NextRequest) {
  return clearSession(NextResponse.redirect(new URL('/', request.url)));
}

export async function POST() {
  return clearSession(NextResponse.json({ success: true }));
}
