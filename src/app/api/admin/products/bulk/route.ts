import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required for bulk upload' },
        { status: 400 }
      );
    }

    const createdList = [];

    for (const item of items) {
      const skinUsername = (item.skinUsername || item.ign || 'Steve').trim();
      const type = (item.type || 'MCFA').toUpperCase();
      const price = parseFloat(item.price) || (type === 'MCFA' ? 24.99 : 6.5);
      const comparePrice = item.compareAtPrice ? parseFloat(item.compareAtPrice) : null;
      const rank = item.rank && item.rank !== 'None' ? item.rank : null;
      const edition = item.edition || 'Java + Bedrock';
      const name = item.name || `${type} • ${rank ? `[${rank}] • ` : ''}${skinUsername}`;

      const capes = Array.isArray(item.capes) ? item.capes : [];
      const rawCredentials = Array.isArray(item.credentialsList)
        ? item.credentialsList
        : [item.credential || item.combo];
      const credentials = rawCredentials
        .filter((value: unknown): value is string =>
          typeof value === 'string' && Boolean(value.trim()) && !value.includes('@ghostvault.internal')
        )
        .map((value: string) => value.trim());

      const autoSlug =
        (item.slug || name)
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9-]/g, '-')
          .replace(/-+/g, '-')
          .slice(0, 45) +
        '-' +
        Math.random().toString(36).substring(2, 7);

      const defaultFeatures = [
        `${edition} Edition license`,
        type === 'MCFA' ? 'Full email mailbox access included' : 'Launcher direct access',
        'Official launcher compatibility',
        'Instant encrypted delivery',
      ];

      const product = await db.product.create({
        data: {
          name,
          slug: autoSlug,
          type,
          edition,
          price,
          compareAtPrice: comparePrice,
          description:
            item.description ||
            `Authentic Minecraft ${type} account (${skinUsername}) with full security guarantee.`,
          beforeYouBuy:
            type === 'MCFA'
              ? 'Full Access account. Change email and password immediately after receipt.'
              : 'Non-Full Access account. Credentials must remain unchanged. No email access.',
          features: JSON.stringify(defaultFeatures),
          includedFeatures: JSON.stringify([
            `Minecraft ${edition} gameplay access`,
            'Instant encrypted credential delivery',
          ]),
          excludedFeatures: JSON.stringify(
            type === 'MCFA'
              ? ['Custom cosmetics from third-party non-official clients']
              : ['Original email access NOT included', 'Password change NOT permitted']
          ),
          isHypixelReady: !Boolean(item.hypixelBanned),
          hasNameChange: type === 'MCFA',
          hasSkinChange: true,
          hasEmailAccess: type === 'MCFA',
          hasCape: capes.length > 0,
          badge: item.badge || null,
          blurName: Boolean(item.blurName),
          active: credentials.length > 0,
          skinUsername,
          capes: JSON.stringify(capes),
          rank,
          hypixelLevel: parseInt(item.hypixelLevel) || 0,
          bedwarsStars: parseInt(item.bedwarsStars) || 0,
          bedwarsFKDR: parseFloat(item.bedwarsFKDR) || 0.0,
          bedwarsWins: parseInt(item.bedwarsWins) || 0,
          skywarsLevel: parseInt(item.skywarsLevel) || 0,
          skywarsWins: parseInt(item.skywarsWins) || 0,
          donutMoney: item.donutMoney || '$0',
          donutRank: item.donutRank || 'Default',
          donutPlaytime: item.donutPlaytime || '0h',
          donutKills: parseInt(item.donutKills) || 0,
          donutDeaths: parseInt(item.donutDeaths) || 0,
          creationYear: parseInt(item.creationYear) || 2021,
          emailDomain: item.emailDomain || (type === 'MCFA' ? 'Outlook.com' : 'None'),
          banStatus: item.hypixelBanned ? 'Hypixel Banned' : 'Hypixel Unbanned',
          hypixelBanned: Boolean(item.hypixelBanned),
          donutBanned: Boolean(item.donutBanned),
          stockCount: credentials.length,
        },
      });

      // Never turn a quantity-only listing into synthetic stock.
      for (const credential of credentials) {
        await db.inventoryItem.create({
          data: {
            productId: product.id,
            sensitiveCredentialsMasked: credential,
            status: 'AVAILABLE',
          },
        });
      }

      createdList.push(product);
    }

    return NextResponse.json({
      success: true,
      createdCount: createdList.length,
      products: createdList,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to bulk upload accounts' },
      { status: 500 }
    );
  }
}
