import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const discordId = searchParams.get('id');

  if (!discordId) {
    return NextResponse.json({ avatarUrl: 'https://cdn.discordapp.com/embed/avatars/0.png' });
  }

  // Calculate default embed avatar
  let defaultAvatar = 'https://cdn.discordapp.com/embed/avatars/0.png';
  try {
    const idx = Number((BigInt(discordId) >> 22n) % 6n);
    defaultAvatar = `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
  } catch {}

  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ avatarUrl: defaultAvatar });
  }

  try {
    // 1.5s timeout to keep request instant
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);

    const res = await fetch(`https://discord.com/api/v10/users/${discordId}`, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
      signal: controller.signal,
      next: { revalidate: 3600 },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.avatar) {
        const ext = data.avatar.startsWith('a_') ? 'gif' : 'png';
        const customUrl = `https://cdn.discordapp.com/avatars/${discordId}/${data.avatar}.${ext}?size=128`;
        return NextResponse.json({ avatarUrl: customUrl });
      }
    }
  } catch {}

  return NextResponse.json({ avatarUrl: defaultAvatar });
}
