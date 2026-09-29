import { NextResponse, type NextRequest } from 'next/server';
import { getDiscordRedirectUri } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get('next') || requestUrl.searchParams.get('redirect') || '/dashboard';
  
  const clientId = process.env.DISCORD_CLIENT_ID || '1552159927022129162';
  
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || requestUrl.host;
  const proto = request.headers.get('x-forwarded-proto') || requestUrl.protocol.replace(':', '') || 'http';
  const origin = `${proto}://${host}`;
  
  const customRedirect = requestUrl.searchParams.get('redirect_uri');
  const redirectUri = customRedirect || getDiscordRedirectUri(origin);

  // Encode the destination in state
  const state = Buffer.from(JSON.stringify({ next, origin, redirectUri })).toString('base64');

  const discordAuthUrl = new URL('https://discord.com/oauth2/authorize');
  discordAuthUrl.searchParams.set('client_id', clientId);
  discordAuthUrl.searchParams.set('redirect_uri', redirectUri);
  discordAuthUrl.searchParams.set('response_type', 'code');
  discordAuthUrl.searchParams.set('scope', 'identify email');
  discordAuthUrl.searchParams.set('state', state);
  discordAuthUrl.searchParams.set('prompt', 'consent');

  return NextResponse.redirect(discordAuthUrl.toString());
}
