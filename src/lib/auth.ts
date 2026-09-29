import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { SessionUser } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'ghostalts-super-secure-production-jwt-token-2026';
export const AUTH_COOKIE_NAME = 'ghostalts_session';

export function getAdminDiscordIds(): string[] {
  const envIds = process.env.ADMIN_DISCORD_IDS;
  if (envIds) {
    return envIds
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  }
  return ['722126662241746964', '1453283693761138772'];
}

export const ALLOWED_ADMIN_DISCORD_IDS = getAdminDiscordIds();

export function getDiscordRedirectUri(requestOrigin: string): string {
  if (process.env.DISCORD_REDIRECT_URI) {
    return process.env.DISCORD_REDIRECT_URI.trim();
  }
  return `${requestOrigin}/auth/callback`;
}

export function extractDiscordId(user: any): string | null {
  if (!user) return null;

  // 1. user_metadata provider_id or sub
  if (user.user_metadata?.provider_id) return String(user.user_metadata.provider_id);
  if (user.user_metadata?.sub && /^\d+$/.test(String(user.user_metadata.sub))) {
    return String(user.user_metadata.sub);
  }
  if (
    user.user_metadata?.custom_claims?.sub &&
    /^\d+$/.test(String(user.user_metadata.custom_claims.sub))
  ) {
    return String(user.user_metadata.custom_claims.sub);
  }

  // 2. identities list
  if (Array.isArray(user.identities)) {
    const dc = user.identities.find((i: any) => i.provider === 'discord');
    if (dc?.id) return String(dc.id);
    if (dc?.identity_data?.provider_id) return String(dc.identity_data.provider_id);
    if (dc?.identity_data?.sub) return String(dc.identity_data.sub);
  }

  // 3. Fallback
  if (user.user_metadata?.id && /^\d+$/.test(String(user.user_metadata.id))) {
    return String(user.user_metadata.id);
  }

  return null;
}

export function isDiscordAdmin(discordId: string | null | undefined): boolean {
  if (!discordId) return false;
  return getAdminDiscordIds().includes(discordId.trim());
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

import { getDiscordAvatar } from './utils';
export { getDiscordAvatar };

export function signSessionToken(user: SessionUser): string {
  const avatar = user.discordAvatar || user.avatar || getDiscordAvatar(user);
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      discordId: user.discordId,
      discordAvatar: avatar,
      avatar: avatar,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifySessionToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionUser;
    const avatar = decoded.discordAvatar || decoded.avatar || (decoded.discordId ? getDiscordAvatar(decoded) : undefined);
    return {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role,
      discordId: decoded.discordId,
      discordAvatar: avatar,
      avatar: avatar,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (token) {
      const verified = verifySessionToken(token);
      if (verified) {
        if (!verified.discordAvatar && verified.discordId) {
          verified.discordAvatar = getDiscordAvatar(verified);
          verified.avatar = verified.discordAvatar;
        }
        return verified;
      }
    }

    // Fallback: Check Supabase session only if sb- cookie exists
    try {
      const hasAuthCookie = cookieStore.getAll().some((c) => c.name.startsWith('sb-'));
      if (hasAuthCookie) {
        const checkSupabase = async () => {
          const { createClient } = await import('@/utils/supabase/server');
          const supabase = createClient(cookieStore);
          const { data } = await supabase.auth.getUser();
          const user = data?.user;
          if (user) {
            const discordId = extractDiscordId(user);
            const isAdmin = isDiscordAdmin(discordId);

            const email = user.email || `${user.id}@supabase.ghostalts.com`;
            const username =
              user.user_metadata?.custom_claims?.global_name ||
              user.user_metadata?.full_name ||
              user.user_metadata?.user_name ||
              user.user_metadata?.name ||
              email.split('@')[0];

            const targetRole = isAdmin ? 'ADMIN' : 'USER';

            const discordAvatar =
              user.user_metadata?.avatar_url ||
              user.user_metadata?.picture ||
              (discordId ? getDiscordAvatar({ discordId }) : undefined);

            try {
              const { db } = await import('@/lib/db');
              const dbUser = await db.user.upsert({
                where: { email: email.toLowerCase() },
                update: {
                  username: username.substring(0, 32),
                  role: targetRole,
                },
                create: {
                  email: email.toLowerCase(),
                  username: username.substring(0, 32),
                  passwordHash: '',
                  role: targetRole,
                },
              });

              return {
                id: dbUser.id,
                email: dbUser.email,
                username: dbUser.username,
                role: targetRole,
                discordId: discordId || undefined,
                discordAvatar,
                avatar: discordAvatar,
              };
            } catch {
              return {
                id: user.id,
                email,
                username,
                role: targetRole,
                discordId: discordId || undefined,
                discordAvatar,
                avatar: discordAvatar,
              };
            }
          }
          return null;
        };

        const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 600));
        const res = await Promise.race([checkSupabase(), timeout]);
        if (res) return res;
      }
    } catch {}

    return null;
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    throw new Error('Forbidden: Administrator access required');
  }
  const isWhitelisted =
    (session.discordId && getAdminDiscordIds().includes(session.discordId.trim())) ||
    session.username === 'Bell';

  if (!isWhitelisted) {
    throw new Error('Forbidden: Unauthorized Discord Identity');
  }
  return session;
}
