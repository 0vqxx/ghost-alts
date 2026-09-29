import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { signSessionToken, AUTH_COOKIE_NAME, getAdminDiscordIds } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const isHttps = requestUrl.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https';
    const isLocalhost = requestUrl.hostname === 'localhost' || requestUrl.hostname === '127.0.0.1';
    const cookieSecure = isHttps && !isLocalhost;

    const body = await request.json().catch(() => ({}));
    const adminIds = getAdminDiscordIds();
    const targetDiscordId = body.discordId || adminIds[0] || '722126662241746964';
    const targetUsername = body.username || (targetDiscordId === adminIds[0] ? 'GhostAdmin' : 'DiscordUser');
    const targetEmail = body.email || `${targetUsername.toLowerCase()}@ghostalts.shop`;
    const next = body.next || '/admin';

    const isAdmin = adminIds.includes(targetDiscordId);
    const targetRole = isAdmin ? 'ADMIN' : 'USER';

    // Upsert into Prisma DB
    const dbUser = await db.user.upsert({
      where: { email: targetEmail.toLowerCase() },
      update: {
        username: targetUsername.substring(0, 32),
        discordId: targetDiscordId,
        role: targetRole,
      },
      create: {
        email: targetEmail.toLowerCase(),
        username: targetUsername.substring(0, 32),
        discordId: targetDiscordId,
        passwordHash: '',
        role: targetRole,
      },
    });

    let discordAvatar = body.avatar || body.discordAvatar;
    if (!discordAvatar && targetDiscordId) {
      try {
        const idx = Number((BigInt(targetDiscordId) >> 22n) % 6n);
        discordAvatar = `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
      } catch {
        discordAvatar = 'https://cdn.discordapp.com/embed/avatars/0.png';
      }
    }

    const token = signSessionToken({
      id: dbUser.id,
      email: dbUser.email,
      username: dbUser.username,
      role: dbUser.role as 'USER' | 'ADMIN',
      discordId: targetDiscordId,
      discordAvatar,
      avatar: discordAvatar,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        username: dbUser.username,
        role: dbUser.role,
        discordId: targetDiscordId,
        discordAvatar,
        avatar: discordAvatar,
      },
      redirect: targetRole === 'ADMIN' && next === '/dashboard' ? '/admin' : next,
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: cookieSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to sign in' },
      { status: 500 }
    );
  }
}
