import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const {
      name,
      slug,
      type,
      edition,
      price,
      compareAtPrice,
      description,
      beforeYouBuy,
      isHypixelReady,
      hasNameChange,
      hasSkinChange,
      hasEmailAccess,
      hasCape,
      badge,
      skinUsername,
      capes,
      rank,
      hypixelLevel,
      // BEDWARS
      bedwarsStars,
      bedwarsFKDR,
      bedwarsWins,
      bedwarsFinals,
      // SKYWARS
      skywarsLevel,
      skywarsKDR,
      skywarsWins,
      skywarsKills,
      // DUELS
      duelsTitle,
      duelsWins,
      duelsWLR,
      duelsStreak,
      // SKYBLOCK
      skyblockNetworth,
      skyblockSkillAvg,
      skyblockCata,
      skyblockCoins,
      // DONUTSMP
      donutMoney,
      donutRank,
      donutPlaytime,
      donutKills,
      donutDeaths,
      creationYear,
      emailDomain,
      hypixelBanned,
      donutBanned,
    } = body;

    if (!name || !type || !price) {
      return NextResponse.json(
        { error: 'Name, type, and price are required' },
        { status: 400 }
      );
    }

    const autoSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50) + '-' + Math.random().toString(36).substring(2, 6);

    const defaultFeatures = [
      `${edition || 'Java + Bedrock'} Edition playable license`,
      type === 'MCFA' ? 'Full email mailbox access' : 'No email access included',
      'Official launcher compatibility',
      'Instant digital delivery',
    ];

    const defaultIncluded = [
      `Minecraft ${edition || 'Java + Bedrock'} gameplay access`,
      'Instant digital credential delivery via private dashboard',
      type === 'MCFA' ? 'Full mailbox login credentials' : 'Launcher credentials',
    ];

    const defaultExcluded =
      type === 'MCFA'
        ? ['Custom cosmetics from third-party non-official clients']
        : [
            'Original email access NOT included',
            'Email change NOT permitted',
            'Password change NOT permitted',
          ];

    const parsedCapes = Array.isArray(capes) ? capes : [];

    const product = await db.product.create({
      data: {
        name,
        slug: autoSlug,
        type: type || 'MCFA',
        edition: edition || 'Java + Bedrock',
        price: parseFloat(price),
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        description: description || `Verified Minecraft ${type} account with ${skinUsername || 'custom skin'} and clean multiplayer history.`,
        beforeYouBuy:
          beforeYouBuy ||
          (type === 'MCFA'
            ? 'Full Access account. Change email and password immediately after receipt.'
            : 'Non-Full Access account. Credentials must remain unchanged. No email access.'),
        features: JSON.stringify(defaultFeatures),
        includedFeatures: JSON.stringify(defaultIncluded),
        excludedFeatures: JSON.stringify(defaultExcluded),
        isHypixelReady: !hypixelBanned,
        hasNameChange: type === 'MCFA' ? (hasNameChange ?? true) : false,
        hasSkinChange: hasSkinChange ?? true,
        hasEmailAccess: type === 'MCFA' ? (hasEmailAccess ?? true) : false,
        hasCape: parsedCapes.length > 0 || (hasCape ?? false),
        badge: badge || null,
        blurName: Boolean(body.blurName),
        // A listing is a draft until real account credentials are uploaded.
        active: false,
        skinUsername: skinUsername || 'Steve',
        capes: JSON.stringify(parsedCapes),
        rank: rank && rank !== 'None' ? rank : null,
        hypixelLevel: hypixelLevel ? parseInt(hypixelLevel) : 0,

        // BEDWARS
        bedwarsStars: bedwarsStars ? parseInt(bedwarsStars) : 0,
        bedwarsFKDR: bedwarsFKDR ? parseFloat(bedwarsFKDR) : 0.0,
        bedwarsWins: bedwarsWins ? parseInt(bedwarsWins) : 0,
        bedwarsFinals: bedwarsFinals ? parseInt(bedwarsFinals) : 0,

        // SKYWARS
        skywarsLevel: skywarsLevel ? parseInt(skywarsLevel) : 0,
        skywarsKDR: skywarsKDR ? parseFloat(skywarsKDR) : 0.0,
        skywarsWins: skywarsWins ? parseInt(skywarsWins) : 0,
        skywarsKills: skywarsKills ? parseInt(skywarsKills) : 0,

        // DUELS
        duelsTitle: duelsTitle || 'None',
        duelsWins: duelsWins ? parseInt(duelsWins) : 0,
        duelsWLR: duelsWLR ? parseFloat(duelsWLR) : 0.0,
        duelsStreak: duelsStreak ? parseInt(duelsStreak) : 0,

        // SKYBLOCK
        skyblockNetworth: skyblockNetworth || '$0',
        skyblockSkillAvg: skyblockSkillAvg ? parseFloat(String(skyblockSkillAvg)) : 0.0,
        skyblockCata: skyblockCata ? parseInt(String(skyblockCata)) : 0,
        skyblockCoins: skyblockCoins || '$0',

        // DONUTSMP
        donutMoney: donutMoney || '$0',
        donutRank: donutRank || 'Default',
        donutPlaytime: donutPlaytime || '0h',
        donutKills: donutKills ? parseInt(donutKills) : 0,
        donutDeaths: donutDeaths ? parseInt(donutDeaths) : 0,

        creationYear: creationYear ? parseInt(creationYear) : 2022,
        emailDomain: emailDomain || 'Outlook.com',
        banStatus: hypixelBanned ? 'Hypixel Banned' : 'Hypixel Unbanned',
        hypixelBanned: Boolean(hypixelBanned),
        donutBanned: Boolean(donutBanned),
        stockCount: 0,
        acceptedCryptos: body.acceptedCryptos
          ? (typeof body.acceptedCryptos === 'string'
              ? body.acceptedCryptos
              : JSON.stringify(body.acceptedCryptos))
          : '["LTC","BTC"]',
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const {
      id,
      name,
      price,
      compareAtPrice,
      active,
      badge,
      skinUsername,
      blurName,
      rank,
      hypixelLevel,
      bedwarsStars,
      bedwarsFKDR,
      bedwarsWins,
      bedwarsFinals,
      skywarsLevel,
      skywarsKDR,
      skywarsWins,
      skywarsKills,
      duelsTitle,
      duelsWins,
      duelsWLR,
      duelsStreak,
      skyblockNetworth,
      skyblockSkillAvg,
      skyblockCata,
      skyblockCoins,
      donutMoney,
      donutRank,
      donutPlaytime,
      donutKills,
      donutDeaths,
      hypixelBanned,
      donutBanned,
      capes,
      acceptedCryptos,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (compareAtPrice !== undefined) updateData.compareAtPrice = compareAtPrice ? parseFloat(compareAtPrice) : null;
    if (active !== undefined) updateData.active = Boolean(active);
    if (badge !== undefined) updateData.badge = badge;
    if (blurName !== undefined) updateData.blurName = Boolean(blurName);
    if (skinUsername !== undefined) updateData.skinUsername = skinUsername;
    if (rank !== undefined) updateData.rank = rank && rank !== 'None' ? rank : null;
    if (hypixelLevel !== undefined) updateData.hypixelLevel = parseInt(hypixelLevel) || 0;

    if (acceptedCryptos !== undefined) {
      updateData.acceptedCryptos =
        typeof acceptedCryptos === 'string'
          ? acceptedCryptos
          : JSON.stringify(acceptedCryptos);
    }

    // BEDWARS
    if (bedwarsStars !== undefined) updateData.bedwarsStars = parseInt(bedwarsStars) || 0;
    if (bedwarsFKDR !== undefined) updateData.bedwarsFKDR = parseFloat(bedwarsFKDR) || 0.0;
    if (bedwarsWins !== undefined) updateData.bedwarsWins = parseInt(bedwarsWins) || 0;
    if (bedwarsFinals !== undefined) updateData.bedwarsFinals = parseInt(bedwarsFinals) || 0;

    // SKYWARS
    if (skywarsLevel !== undefined) updateData.skywarsLevel = parseInt(skywarsLevel) || 0;
    if (skywarsKDR !== undefined) updateData.skywarsKDR = parseFloat(skywarsKDR) || 0.0;
    if (skywarsWins !== undefined) updateData.skywarsWins = parseInt(skywarsWins) || 0;
    if (skywarsKills !== undefined) updateData.skywarsKills = parseInt(skywarsKills) || 0;

    // DUELS
    if (duelsTitle !== undefined) updateData.duelsTitle = duelsTitle;
    if (duelsWins !== undefined) updateData.duelsWins = parseInt(duelsWins) || 0;
    if (duelsWLR !== undefined) updateData.duelsWLR = parseFloat(duelsWLR) || 0.0;
    if (duelsStreak !== undefined) updateData.duelsStreak = parseInt(duelsStreak) || 0;

    // SKYBLOCK
    if (skyblockNetworth !== undefined) updateData.skyblockNetworth = skyblockNetworth;
    if (skyblockSkillAvg !== undefined) updateData.skyblockSkillAvg = parseFloat(String(skyblockSkillAvg)) || 0.0;
    if (skyblockCata !== undefined) updateData.skyblockCata = parseInt(String(skyblockCata)) || 0;
    if (skyblockCoins !== undefined) updateData.skyblockCoins = skyblockCoins;

    // DONUTSMP
    if (donutMoney !== undefined) updateData.donutMoney = donutMoney;
    if (donutRank !== undefined) updateData.donutRank = donutRank;
    if (donutPlaytime !== undefined) updateData.donutPlaytime = donutPlaytime;
    if (donutKills !== undefined) updateData.donutKills = parseInt(donutKills) || 0;
    if (donutDeaths !== undefined) updateData.donutDeaths = parseInt(donutDeaths) || 0;

    if (hypixelBanned !== undefined) {
      updateData.hypixelBanned = Boolean(hypixelBanned);
      updateData.isHypixelReady = !Boolean(hypixelBanned);
    }
    if (donutBanned !== undefined) updateData.donutBanned = Boolean(donutBanned);
    if (capes !== undefined) {
      updateData.capes = typeof capes === 'string' ? capes : JSON.stringify(capes);
      updateData.hasCape = Array.isArray(capes) ? capes.length > 0 : true;
    }

    const product = await db.product.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    await db.product.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}
