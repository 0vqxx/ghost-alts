import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { signSessionToken, AUTH_COOKIE_NAME, isDiscordAdmin, extractDiscordId, getDiscordRedirectUri } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const stateParam = requestUrl.searchParams.get('state');
  
  const isHttps = requestUrl.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https';
  const isLocalhost = requestUrl.hostname === 'localhost' || requestUrl.hostname === '127.0.0.1';
  const cookieSecure = isHttps && !isLocalhost;

  let next = requestUrl.searchParams.get('next') ?? '/dashboard';
  let stateRedirectUri = '';
  if (stateParam) {
    try {
      const decoded = JSON.parse(Buffer.from(stateParam, 'base64').toString('utf8'));
      if (decoded?.next) next = decoded.next;
      if (decoded?.redirectUri) stateRedirectUri = decoded.redirectUri;
    } catch {}
  }

  const errorParam = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  if (errorDescription || errorParam) {
    console.error('[Discord/Supabase Auth] Callback error:', errorParam, errorDescription);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || errorParam || 'Authentication failed')}`, requestUrl.origin)
    );
  }

  if (code) {
    // 1. Try direct Discord OAuth2 token exchange first
    try {
      const clientId = process.env.DISCORD_CLIENT_ID || '1552159927022129162';
      const clientSecret = process.env.DISCORD_CLIENT_SECRET || process.env.DISCORD_BOT_TOKEN || 'Yy5i6Qi7zvUpQuDIHWS91OfBT-eXJkLX';
      const redirectUri = stateRedirectUri || getDiscordRedirectUri(requestUrl.origin);

      const tokenParams = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      });

      const discordTokenRes = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenParams.toString(),
      });

      if (discordTokenRes.ok) {
        const tokenData = await discordTokenRes.json();
        const userRes = await fetch('https://discord.com/api/users/@me', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        if (userRes.ok) {
          const dcUser = await userRes.json();
          const discordId = String(dcUser.id);
          const username = dcUser.global_name || dcUser.username || `User_${discordId.slice(-4)}`;
          const email = (dcUser.email || `${discordId}@discord.ghostalts.shop`).toLowerCase();
          const isAdmin = isDiscordAdmin(discordId);
          const role = isAdmin ? 'ADMIN' : 'USER';

          const dbUser = await db.user.upsert({
            where: { email },
            update: {
              username: username.substring(0, 32),
              discordId,
              role,
            },
            create: {
              email,
              username: username.substring(0, 32),
              discordId,
              passwordHash: '',
              role,
            },
          });

          const discordAvatar = dcUser.avatar
            ? `https://cdn.discordapp.com/avatars/${discordId}/${dcUser.avatar}.${dcUser.avatar.startsWith('a_') ? 'gif' : 'png'}?size=128`
            : `https://cdn.discordapp.com/embed/avatars/${(BigInt(discordId) >> 22n) % 6n}.png`;

          const token = signSessionToken({
            id: dbUser.id,
            email: dbUser.email,
            username: dbUser.username,
            role: dbUser.role as 'USER' | 'ADMIN',
            discordId,
            discordAvatar,
            avatar: discordAvatar,
          });

          const targetUrl = role === 'ADMIN' && (next === '/dashboard' || next === '/') ? '/admin' : next;
          const response = NextResponse.redirect(new URL(targetUrl, requestUrl.origin));

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
        } else {
          console.error('[Direct Discord Auth] Failed to fetch @me user with access token');
        }
      } else {
        const errText = await discordTokenRes.text();
        console.error('[Direct Discord Auth] Token exchange failed:', discordTokenRes.status, errText);
        let errorMsg = 'Failed to exchange Discord authorization token';
        try {
          const errJson = JSON.parse(errText);
          if (errJson.error_description) errorMsg = `Discord error: ${errJson.error_description}`;
          else if (errJson.error) errorMsg = `Discord error: ${errJson.error}`;
        } catch {}

        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(errorMsg)}`, requestUrl.origin)
        );
      }
    } catch (dcErr) {
      console.warn('[Direct Discord Auth] Token exchange attempt failed, trying Supabase fallback:', dcErr);
    }

    // 2. Fallback to Supabase Auth exchange
    try {
      const cookieStore = await cookies();
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = createClient(cookieStore);
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data?.user) {
        const user = data.user;
        const email = (user.email || `${user.id}@supabase.ghostalts.com`).toLowerCase();
        const username =
          user.user_metadata?.custom_claims?.global_name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.user_name ||
          user.user_metadata?.name ||
          email.split('@')[0];

        const discordId = extractDiscordId(user);
        const isAdmin = isDiscordAdmin(discordId);
        const role = isAdmin ? 'ADMIN' : (email.includes('admin') ? 'ADMIN' : 'USER');

        const dbUser = await db.user.upsert({
          where: { email },
          update: {
            username: username.substring(0, 32),
            discordId: discordId || undefined,
            role,
          },
          create: {
            email,
            username: username.substring(0, 32),
            discordId: discordId || null,
            passwordHash: '',
            role,
          },
        });

        const discordAvatar =
          user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          (discordId ? `https://cdn.discordapp.com/embed/avatars/${(BigInt(discordId) >> 22n) % 6n}.png` : undefined);

        const token = signSessionToken({
          id: dbUser.id,
          email: dbUser.email,
          username: dbUser.username,
          role: dbUser.role as 'USER' | 'ADMIN',
          discordId: discordId || undefined,
          discordAvatar,
          avatar: discordAvatar,
        });

        const targetUrl = role === 'ADMIN' && (next === '/dashboard' || next === '/') ? '/admin' : next;
        const response = NextResponse.redirect(new URL(targetUrl, requestUrl.origin));

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
      }
    } catch (sbErr: any) {
      console.error('[Supabase Auth] Fallback exception:', sbErr);
    }
  }

  return NextResponse.redirect(
    new URL(`/login?error=${encodeURIComponent('Authentication could not be completed. Please try again.')}`, requestUrl.origin)
  );
}
