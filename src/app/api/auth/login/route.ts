import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, signSessionToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { checkRateLimit } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const rateLimit = checkRateLimit(`login_${email.toLowerCase()}`, 10, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many attempts. Please try again in ${rateLimit.resetInSec}s` },
        { status: 429 }
      );
    }

    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: email },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const token = signSessionToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role as 'USER' | 'ADMIN',
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });

    const requestUrl = new URL(request.url);
    const isHttps = requestUrl.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https';
    const isLocalhost = requestUrl.hostname === 'localhost' || requestUrl.hostname === '127.0.0.1';
    const cookieSecure = isHttps && !isLocalhost;

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: cookieSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
