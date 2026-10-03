import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 Hours
const MAX_DAILY_ADS = 3; // Max 3 ad claims per 24 hours

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({
      authenticated: false,
      canClaimDaily: false,
      canClaimAd: false,
      canClaim: false,
      dailyRemainingSeconds: 0,
      adClaimsToday: 0,
      adClaimsMax: MAX_DAILY_ADS,
      adClaimsRemaining: MAX_DAILY_ADS,
      activeDropCount: 0,
      message: 'Sign in with Discord to claim a free account.',
    });
  }

  try {
    let user = await db.user.findFirst({
      where: {
        OR: [{ id: session.id }, { email: session.email.toLowerCase() }],
      },
      include: {
        freeClaims: {
          orderBy: { claimedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          id: session.id,
          email: session.email.toLowerCase(),
          username: session.username || session.email.split('@')[0],
          passwordHash: '',
          role: session.role || 'USER',
        },
        include: {
          freeClaims: true,
        },
      });
    }

    // Check Daily Claim cooldown
    let canClaimDaily = true;
    let dailyRemainingSeconds = 0;

    if (user.lastFreeClaimAt) {
      const elapsed = Date.now() - new Date(user.lastFreeClaimAt).getTime();
      if (elapsed < COOLDOWN_MS) {
        canClaimDaily = false;
        dailyRemainingSeconds = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
      }
    }

    // Check Ad Claims count in last 24h
    const twentyFourHoursAgo = new Date(Date.now() - COOLDOWN_MS);
    const adClaimsToday = await db.freeClaim.count({
      where: {
        userId: user.id,
        claimType: 'ADS',
        claimedAt: { gte: twentyFourHoursAgo },
      },
    });

    const adClaimsRemaining = Math.max(0, MAX_DAILY_ADS - adClaimsToday);

    // Check pool availability
    const now = new Date();
    await db.freeAccountDrop.updateMany({
      where: {
        status: 'QUEUED',
        scheduledFor: { lte: now },
      },
      data: {
        status: 'ACTIVE',
      },
    });

    const activeDropCount = await db.freeAccountDrop.count({
      where: { status: 'ACTIVE' },
    });
    const hasStock = activeDropCount > 0;

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      canClaimDaily: canClaimDaily && hasStock,
      canClaimAd: adClaimsRemaining > 0 && hasStock,
      canClaim: (canClaimDaily || adClaimsRemaining > 0) && hasStock,
      remainingSeconds: dailyRemainingSeconds,
      dailyRemainingSeconds,
      adClaimsToday,
      adClaimsMax: MAX_DAILY_ADS,
      adClaimsRemaining,
      lastClaim: user.freeClaims[0] || null,
      activeDropCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        authenticated: true,
        user: session,
        canClaimDaily: false,
        canClaimAd: false,
        canClaim: false,
        activeDropCount: 0,
        error: 'Claims are temporarily unavailable. Your sign-in is still active.',
      },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: You must log in with Discord first.' },
        { status: 401 }
      );
    }

    let user = await db.user.findFirst({
      where: {
        OR: [{ id: session.id }, { email: session.email.toLowerCase() }],
      },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          id: session.id,
          email: session.email.toLowerCase(),
          username: session.username || session.email.split('@')[0],
          passwordHash: '',
          role: session.role || 'USER',
        },
      });
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {}

    const isAdReward = body.claimType === 'ADS' || body.adsCompleted === true;
    const twentyFourHoursAgo = new Date(Date.now() - COOLDOWN_MS);

    if (isAdReward) {
      // Enforce daily limit of 3 ad claims
      const adClaimsCount = await db.freeClaim.count({
        where: {
          userId: user.id,
          claimType: 'ADS',
          claimedAt: { gte: twentyFourHoursAgo },
        },
      });

      if (adClaimsCount >= MAX_DAILY_ADS) {
        return NextResponse.json(
          {
            error: `Daily ad limit reached! You have already claimed all ${MAX_DAILY_ADS} free ad accounts for today. Come back tomorrow or use your daily claim!`,
            adClaimsToday: adClaimsCount,
            adClaimsMax: MAX_DAILY_ADS,
            adClaimsRemaining: 0,
          },
          { status: 429 }
        );
      }
    } else {
      // Check 24-hour cooldown for DAILY non-ad claims
      if (user.lastFreeClaimAt) {
        const elapsed = Date.now() - new Date(user.lastFreeClaimAt).getTime();
        if (elapsed < COOLDOWN_MS) {
          const remainingSeconds = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
          return NextResponse.json(
            {
              error: 'Daily claim cooldown active! Watch an ad to unlock up to 3 extra accounts today, or wait for the timer.',
              remainingSeconds,
            },
            { status: 429 }
          );
        }
      }
    }

    const now = new Date();

    // Auto activate queued drops whose time has passed
    await db.freeAccountDrop.updateMany({
      where: {
        status: 'QUEUED',
        scheduledFor: { lte: now },
      },
      data: {
        status: 'ACTIVE',
      },
    });

    // 1. Try to get an account from admin FreeAccountDrop pool
    const poolDrop = await db.freeAccountDrop.findFirst({
      where: {
        status: 'ACTIVE',
      },
      orderBy: { scheduledFor: 'asc' },
    });

    if (!poolDrop) {
      return NextResponse.json(
        { error: 'No free accounts are in stock yet. Please check back after the next drop.' },
        { status: 503 }
      );
    }

    const isTokenOnly = poolDrop.password === 'TOKEN_AUTH_ONLY' || (Boolean(poolDrop.token) && !poolDrop.password);
    const credentials = isTokenOnly ? (poolDrop.token || poolDrop.email) : `${poolDrop.email}:${poolDrop.password}`;
    const token: string | null = poolDrop.token || (isTokenOnly ? poolDrop.email : null);

    await db.freeAccountDrop.update({
      where: { id: poolDrop.id },
      data: {
        status: 'CLAIMED',
        claimedAt: now,
        claimedById: user.id,
        claimType: isAdReward ? 'ADS' : 'DAILY',
      },
    });

    const ipAddress = request.headers.get('x-forwarded-for') || null;

    // Record free claim in database
    const claimRecord = await db.freeClaim.create({
      data: {
        userId: user.id,
        credentials,
        token,
        claimType: isAdReward ? 'ADS' : 'DAILY',
        ipAddress,
      },
    });

    // Update user cooldown timestamp only for DAILY claims
    if (!isAdReward) {
      await db.user.update({
        where: { id: user.id },
        data: {
          lastFreeClaimAt: now,
        },
      });
    }

    // Re-calculate remaining ad claims
    const adClaimsTodayAfter = await db.freeClaim.count({
      where: {
        userId: user.id,
        claimType: 'ADS',
        claimedAt: { gte: twentyFourHoursAgo },
      },
    });

    return NextResponse.json({
      success: true,
      credentials,
      token,
      isTokenOnly,
      claimType: isAdReward ? 'ADS' : 'DAILY',
      claimId: claimRecord.id,
      claimedAt: claimRecord.claimedAt.toISOString(),
      adClaimsToday: adClaimsTodayAfter,
      adClaimsMax: MAX_DAILY_ADS,
      adClaimsRemaining: Math.max(0, MAX_DAILY_ADS - adClaimsTodayAfter),
      nextClaimAt: isAdReward ? null : new Date(Date.now() + COOLDOWN_MS).toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to claim account' },
      { status: 500 }
    );
  }
}
