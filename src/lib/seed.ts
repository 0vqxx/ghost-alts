import { db } from './db';
import { hashPassword } from './auth';

export async function seedDatabase() {
  console.log('Seeding Ghost Alts Minecraft marketplace database...');

  // 1. Create Users
  const adminPasswordHash = await hashPassword('ghostadmin123');
  const customerPasswordHash = await hashPassword('ghostcustomer123');

  const admin = await db.user.upsert({
    where: { email: 'admin@ghostalts.com' },
    update: {},
    create: {
      email: 'admin@ghostalts.com',
      username: 'GhostAdmin',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });

  const customer = await db.user.upsert({
    where: { email: 'customer@ghostalts.com' },
    update: {},
    create: {
      email: 'customer@ghostalts.com',
      username: 'GhostRider99',
      passwordHash: customerPasswordHash,
      role: 'USER',
    },
  });

  // 2. Discount Codes
  await db.discountCode.upsert({
    where: { code: 'GHOST10' },
    update: {},
    create: {
      code: 'GHOST10',
      percentage: 10,
      active: true,
      maxUses: 500,
      usedCount: 14,
    },
  });

  await db.discountCode.upsert({
    where: { code: 'ENCHANT15' },
    update: {},
    create: {
      code: 'ENCHANT15',
      percentage: 15,
      active: true,
      maxUses: 200,
      usedCount: 31,
    },
  });

  // 3. Products — Focused on NFA Minecraft Accounts (Clean & Production Ready)
  const productsData = [
    {
      slug: 'nfa-hypixel-unbanned-ranked-mvp',
      name: 'NFA • [MVP+] Hypixel Unbanned • Fast Launcher Access',
      type: 'NFA',
      edition: 'Java + Bedrock',
      price: 5.99,
      compareAtPrice: 12.99,
      description:
        'Ready-to-play NFA Minecraft account with permanent Hypixel MVP+ rank active, full multiplayer compatibility, and instant launcher credential delivery.',
      beforeYouBuy:
        'NFA ACCOUNT: Instant launcher credentials delivered directly to your vault. Email and password modifications are not supported. 100% unbanned on Hypixel Network.',
      features: JSON.stringify([
        'Hypixel MVP+ Permanent Rank active',
        '100% Unbanned on Hypixel Network',
        'Java & Bedrock Dual Edition Launcher Access',
        'Instant automated vault delivery',
      ]),
      includedFeatures: JSON.stringify([
        'Direct login credentials for official Minecraft launcher',
        'Permanent Hypixel MVP+ rank perks & cosmetics',
        'Instant automated delivery via order vault',
      ]),
      excludedFeatures: JSON.stringify([
        'Email inbox access NOT included',
        'Password change NOT supported',
      ]),
      isHypixelReady: true,
      hasNameChange: false,
      hasSkinChange: true,
      hasEmailAccess: false,
      hasCape: true,
      isMicrosoftAccount: true,
      region: 'Global',
      deliveryType: 'Instant Digital Delivery',
      rating: 4.97,
      reviewCount: 248,
      stockCount: 45,
      badge: 'TOP SELLER',
      skinUsername: 'NightViper',
      capes: JSON.stringify(['Migrator Cape', '15th Anniversary']),
      rank: 'MVP+',
      hypixelLevel: null,
      bedwarsStars: null,
      bedwarsFKDR: null,
      bedwarsWins: null,
      skywarsLevel: null,
      skywarsWins: null,
      donutMoney: null,
      donutRank: null,
      donutPlaytime: null,
      donutKills: null,
      donutDeaths: null,
      creationYear: 2020,
      emailDomain: 'None (NFA)',
      banStatus: 'Hypixel Unbanned • Clean Record',
      hypixelBanned: false,
      donutBanned: false,
    },
    {
      slug: 'nfa-clean-hypixel-starter',
      name: 'NFA • Fresh Unbanned • Fast Launcher Access',
      type: 'NFA',
      edition: 'Java + Bedrock',
      price: 2.49,
      compareAtPrice: 5.0,
      description:
        'Clean, 100% unbanned NFA Minecraft account for instant casual gameplay, practice, or multiplayer gaming on any public server.',
      beforeYouBuy:
        'NFA ACCOUNT: Valid launcher credentials delivered immediately upon payment. Unbanned on Hypixel and multiplayer servers.',
      features: JSON.stringify([
        'Dual Edition (Java & Bedrock) License',
        '100% Unbanned across all public servers',
        'Instant Delivery to Dashboard Vault',
        'Compatible with Lunar, Feather, & Official Launcher',
      ]),
      includedFeatures: JSON.stringify([
        'Minecraft Java & Bedrock launcher access',
        'Instant automated delivery',
      ]),
      excludedFeatures: JSON.stringify([
        'Email mailbox access NOT included',
        'Password change NOT supported',
      ]),
      isHypixelReady: true,
      hasNameChange: false,
      hasSkinChange: false,
      hasEmailAccess: false,
      hasCape: false,
      isMicrosoftAccount: true,
      region: 'Global',
      deliveryType: 'Instant Digital Delivery',
      rating: 4.91,
      reviewCount: 382,
      stockCount: 120,
      badge: 'BEST BUDGET',
      skinUsername: 'FrostByte',
      capes: JSON.stringify([]),
      rank: null,
      hypixelLevel: null,
      bedwarsStars: null,
      bedwarsFKDR: null,
      bedwarsWins: null,
      skywarsLevel: null,
      skywarsWins: null,
      donutMoney: null,
      donutRank: null,
      donutPlaytime: null,
      donutKills: null,
      donutDeaths: null,
      creationYear: 2022,
      emailDomain: 'None (NFA)',
      banStatus: '100% Clean • Unbanned',
      hypixelBanned: false,
      donutBanned: false,
    },
    {
      slug: 'nfa-budget-java-launcher',
      name: 'NFA • Budget Java Launcher Access',
      type: 'NFA',
      edition: 'Java Edition',
      price: 3.99,
      compareAtPrice: 7.99,
      description:
        'Budget-friendly Non-Full Access Minecraft account for casual gaming and multiplayer. Authentic launcher credentials with instant delivery.',
      beforeYouBuy:
        'TRANSPARENT NFA LIMITATIONS: You receive valid launcher credentials to play Java Edition. You CANNOT change the email or password. Original email mailbox is NOT provided.',
      features: JSON.stringify([
        'Playable official launcher access',
        'Java Edition multiplayer access',
        'Instant digital credential delivery',
        'Budget casual entry point',
      ]),
      includedFeatures: JSON.stringify([
        'Direct login access to Minecraft Java Edition',
        'Official game launcher client access',
        'Instant automated delivery to order vault',
      ]),
      excludedFeatures: JSON.stringify([
        'Original email access NOT included',
        'Password CANNOT be modified',
      ]),
      isHypixelReady: true,
      hasNameChange: false,
      hasSkinChange: false,
      hasEmailAccess: false,
      hasCape: false,
      isMicrosoftAccount: true,
      region: 'Global',
      deliveryType: 'Instant Digital Delivery',
      rating: 4.65,
      reviewCount: 138,
      stockCount: 55,
      badge: 'BUDGET NFA',
      skinUsername: 'PixelSlayer',
      capes: JSON.stringify([]),
      rank: null,
      hypixelLevel: null,
      bedwarsStars: null,
      bedwarsFKDR: null,
      bedwarsWins: null,
      skywarsLevel: null,
      skywarsWins: null,
      donutMoney: null,
      donutRank: null,
      donutPlaytime: null,
      donutKills: null,
      donutDeaths: null,
      creationYear: 2021,
      emailDomain: 'None (NFA)',
      banStatus: 'Multiplayer Access Active',
      hypixelBanned: false,
      donutBanned: false,
    },
    {
      slug: 'nfa-java-bedrock-combo',
      name: 'NFA • Java + Bedrock Dual Access',
      type: 'NFA',
      edition: 'Java + Bedrock',
      price: 6.99,
      compareAtPrice: 14.99,
      description:
        'Dual Edition launcher access for both Java and Windows Bedrock. Ideal for casual play across multiple platforms with instant vault delivery.',
      beforeYouBuy:
        'TRANSPARENT NFA LIMITATIONS: Grants launcher access to both Java and Bedrock. Original email inbox is NOT provided. Changing passwords or security details is not supported.',
      features: JSON.stringify([
        'Both Java & Bedrock playable from launcher',
        'Crossplay compatible on Bedrock servers',
        'Instant credential display upon purchase',
      ]),
      includedFeatures: JSON.stringify([
        'Minecraft Java Edition gameplay access',
        'Minecraft Bedrock Edition gameplay access',
        'Instant digital vault delivery',
      ]),
      excludedFeatures: JSON.stringify([
        'Email mailbox access NOT included',
        'Email and password CANNOT be altered',
      ]),
      isHypixelReady: true,
      hasNameChange: false,
      hasSkinChange: false,
      hasEmailAccess: false,
      hasCape: false,
      isMicrosoftAccount: true,
      region: 'Global',
      deliveryType: 'Instant Digital Delivery',
      rating: 4.72,
      reviewCount: 65,
      stockCount: 42,
      badge: 'DUAL NFA',
      skinUsername: 'AuraPvP',
      capes: JSON.stringify([]),
      rank: null,
      hypixelLevel: null,
      bedwarsStars: null,
      bedwarsFKDR: null,
      bedwarsWins: null,
      skywarsLevel: null,
      skywarsWins: null,
      donutMoney: null,
      donutRank: null,
      donutPlaytime: null,
      donutKills: null,
      donutDeaths: null,
      creationYear: 2021,
      emailDomain: 'None (NFA)',
      banStatus: 'Dual Edition Active',
      hypixelBanned: false,
      donutBanned: false,
    },
    {
      slug: 'mcfa-og-migrator-vanilla-cape',
      name: 'MCFA • Dual Cape (Migrator + Vanilla) • Full Access',
      type: 'MCFA',
      edition: 'Java Edition',
      price: 49.5,
      compareAtPrice: 65.0,
      description:
        'Collectible MCFA account featuring both the official Mojang Migrator Cape and the Vanilla Cape. Comes with dedicated email mailbox access.',
      beforeYouBuy:
        'FULL ACCESS MCFA: Includes dual official capes visible on all multiplayer servers. Dedicated mailbox included for credential transfer.',
      features: JSON.stringify([
        'Official Migrator Cape + Vanilla Cape equipped',
        'Clean disciplinary history across all servers',
        'Dedicated Mailbox Access included',
        'Eligible for name change',
        'Global region license (No VPN required)',
      ]),
      includedFeatures: JSON.stringify([
        'Dual Official Mojang Capes (Migrator + Vanilla)',
        'Microsoft Account & full Mailbox login access',
        'Complete password & 2FA transfer capability',
        'Instant vault reveal upon purchase',
      ]),
      excludedFeatures: JSON.stringify([
        'Pre-existing ranks not included',
      ]),
      isHypixelReady: true,
      hasNameChange: true,
      hasSkinChange: true,
      hasEmailAccess: true,
      hasCape: true,
      isMicrosoftAccount: true,
      region: 'Global',
      deliveryType: 'Instant Digital Delivery',
      rating: 5.0,
      reviewCount: 47,
      stockCount: 6,
      badge: 'DUAL CAPE',
      skinUsername: 'CobaltGhost',
      capes: JSON.stringify(['Migrator Cape', 'Vanilla Cape']),
      rank: null,
      hypixelLevel: null,
      bedwarsStars: null,
      bedwarsFKDR: null,
      bedwarsWins: null,
      skywarsLevel: null,
      skywarsWins: null,
      donutMoney: null,
      donutRank: null,
      donutPlaytime: null,
      donutKills: null,
      donutDeaths: null,
      creationYear: 2014,
      emailDomain: 'Hotmail.com',
      banStatus: 'Clean • Never Banned',
      hypixelBanned: false,
      donutBanned: false,
    },
  ];

  for (const p of productsData) {
    const excludedJson =
      typeof p.excludedFeatures === 'string'
        ? p.excludedFeatures
        : JSON.stringify(p.excludedFeatures);

    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        type: p.type,
        edition: p.edition,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        description: p.description,
        beforeYouBuy: p.beforeYouBuy,
        features: p.features,
        includedFeatures: p.includedFeatures,
        excludedFeatures: excludedJson,
        stockCount: p.stockCount,
        badge: p.badge,
        skinUsername: p.skinUsername,
        capes: p.capes,
        rank: p.rank,
        hypixelLevel: p.hypixelLevel,
        bedwarsStars: p.bedwarsStars,
        bedwarsFKDR: p.bedwarsFKDR,
        bedwarsWins: p.bedwarsWins,
        skywarsLevel: p.skywarsLevel,
        skywarsWins: p.skywarsWins,
        donutMoney: p.donutMoney,
        donutRank: p.donutRank,
        donutPlaytime: p.donutPlaytime,
        donutKills: p.donutKills,
        donutDeaths: p.donutDeaths,
        creationYear: p.creationYear,
        emailDomain: p.emailDomain,
        banStatus: p.banStatus,
        hypixelBanned: p.hypixelBanned,
        donutBanned: p.donutBanned,
        active: true,
      },
      create: {
        slug: p.slug,
        name: p.name,
        type: p.type,
        edition: p.edition,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        description: p.description,
        beforeYouBuy: p.beforeYouBuy,
        features: p.features,
        includedFeatures: p.includedFeatures,
        excludedFeatures: excludedJson,
        isHypixelReady: p.isHypixelReady,
        hasNameChange: p.hasNameChange,
        hasSkinChange: p.hasSkinChange,
        hasEmailAccess: p.hasEmailAccess,
        hasCape: p.hasCape,
        isMicrosoftAccount: p.isMicrosoftAccount,
        region: p.region,
        deliveryType: p.deliveryType,
        rating: p.rating,
        reviewCount: p.reviewCount,
        stockCount: p.stockCount,
        badge: p.badge,
        skinUsername: p.skinUsername,
        capes: p.capes,
        rank: p.rank,
        hypixelLevel: p.hypixelLevel,
        bedwarsStars: p.bedwarsStars,
        bedwarsFKDR: p.bedwarsFKDR,
        bedwarsWins: p.bedwarsWins,
        skywarsLevel: p.skywarsLevel,
        skywarsWins: p.skywarsWins,
        donutMoney: p.donutMoney,
        donutRank: p.donutRank,
        donutPlaytime: p.donutPlaytime,
        donutKills: p.donutKills,
        donutDeaths: p.donutDeaths,
        creationYear: p.creationYear,
        emailDomain: p.emailDomain,
        banStatus: p.banStatus,
        hypixelBanned: p.hypixelBanned,
        donutBanned: p.donutBanned,
        active: true,
      },
    });

    // Populate synthetic inventory items for each
    const existingCount = await db.inventoryItem.count({
      where: { productId: product.id },
    });
    if (existingCount < 5) {
      for (let i = 1; i <= 6; i++) {
        await db.inventoryItem.create({
          data: {
            productId: product.id,
            sensitiveCredentialsMasked: `GA-${product.type}-${Math.random()
              .toString(36)
              .substring(2, 8)
              .toUpperCase()}:${Math.random().toString(36).substring(2, 10)}@ghostvault.internal`,
            status: 'AVAILABLE',
          },
        });
      }
    }
  }

  // 4. Crypto Payment Settings
  await db.cryptoSetting.upsert({
    where: { symbol: 'LTC' },
    update: {},
    create: {
      symbol: 'LTC',
      address: 'ltc1q9m8u2aefv3x953kgn6r6prm0a3rwxcm8x2x79m',
      enabled: true,
      minConfirmations: 1,
    },
  });

  await db.cryptoSetting.upsert({
    where: { symbol: 'BTC' },
    update: {},
    create: {
      symbol: 'BTC',
      address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      enabled: true,
      minConfirmations: 1,
    },
  });

  console.log('Ghost Alts database seeded with authentic Minecraft accounts and crypto payment settings!');
}
