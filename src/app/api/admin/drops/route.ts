import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // Auto-activate queued drops whose scheduled time has passed
    await db.freeAccountDrop.updateMany({
      where: {
        status: 'QUEUED',
        scheduledFor: { lte: now },
      },
      data: {
        status: 'ACTIVE',
      },
    });

    const [drops, claimedDrops] = await Promise.all([
      db.freeAccountDrop.findMany({
        where: {
          status: { in: ['ACTIVE', 'QUEUED'] },
        },
        orderBy: [{ status: 'asc' }, { scheduledFor: 'asc' }],
      }),
      db.freeAccountDrop.findMany({
        where: {
          status: 'CLAIMED',
        },
        include: {
          claimedBy: {
            select: { id: true, username: true, email: true },
          },
        },
        orderBy: { claimedAt: 'desc' },
        take: 50,
      }),
    ]);

    const activeCount = drops.filter((d) => d.status === 'ACTIVE').length;
    const queuedCount = drops.filter((d) => d.status === 'QUEUED').length;
    const totalClaimedCount = await db.freeAccountDrop.count({
      where: { status: 'CLAIMED' },
    });

    return NextResponse.json({
      activeCount,
      queuedCount,
      totalClaimedCount,
      drops,
      claimedDrops,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { mode, dropType, singleAccount, bulkText, bulkFormat, scheduleIntervalMinutes, startDelayMinutes } = body;

    const now = new Date();

    if (mode === 'single') {
      const { email, password, token, skinUsername, scheduledFor, isTokenOnly } = singleAccount || {};
      const isToken = isTokenOnly || dropType === 'token' || (!password && Boolean(token));

      if (isToken) {
        if (!token || !token.trim()) {
          return NextResponse.json({ error: 'Auth token is required for token-only drops' }, { status: 400 });
        }
      } else {
        if (!email || !password) {
          return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }
      }

      const releaseDate = scheduledFor ? new Date(scheduledFor) : now;
      const isQueued = releaseDate.getTime() > now.getTime();

      const created = await db.freeAccountDrop.create({
        data: {
          email: isToken ? (email?.trim() || `token-${Math.random().toString(36).substring(2, 8)}@free.ghostalts.shop`) : email.trim(),
          password: isToken ? 'TOKEN_AUTH_ONLY' : password.trim(),
          token: token ? token.trim() : null,
          skinUsername: skinUsername ? skinUsername.trim() : 'Steve',
          status: isQueued ? 'QUEUED' : 'ACTIVE',
          scheduledFor: releaseDate,
        },
      });

      return NextResponse.json({ success: true, count: 1, item: created });
    }

    if (mode === 'bulk') {
      if (!bulkText || typeof bulkText !== 'string') {
        return NextResponse.json({ error: 'No combo text provided' }, { status: 400 });
      }

      const lines = bulkText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length === 0) {
        return NextResponse.json({ error: 'No valid accounts detected' }, { status: 400 });
      }

      const intervalMins = Number(scheduleIntervalMinutes) || 0;
      const initialDelayMins = Number(startDelayMinutes) || 0;
      const isTokenFormat = bulkFormat === 'token' || dropType === 'token';

      const itemsToCreate = lines.map((line, index) => {
        let email = '';
        let password = '';
        let token: string | null = null;

        if (isTokenFormat) {
          email = `token-${Math.random().toString(36).substring(2, 8)}@free.ghostalts.shop`;
          password = 'TOKEN_AUTH_ONLY';
          token = line.trim();
        } else {
          const parts = line.split(':');
          if (parts.length >= 3) {
            email = parts[0].trim();
            password = parts[1].trim();
            token = parts.slice(2).join(':').trim();
          } else if (parts.length === 2) {
            email = parts[0].trim();
            password = parts[1].trim();
          } else if (line.length > 40 && !line.includes('@')) {
            // Raw token detected
            email = `token-${Math.random().toString(36).substring(2, 8)}@free.ghostalts.shop`;
            password = 'TOKEN_AUTH_ONLY';
            token = line.trim();
          } else {
            email = line.trim();
            password = 'DefaultPassword123';
          }
        }

        let releaseDate = new Date(now.getTime() + initialDelayMins * 60 * 1000);
        if (intervalMins > 0) {
          releaseDate = new Date(releaseDate.getTime() + index * intervalMins * 60 * 1000);
        }

        const isQueued = releaseDate.getTime() > now.getTime();

        return {
          email,
          password,
          token,
          skinUsername: 'Steve',
          status: isQueued ? 'QUEUED' : 'ACTIVE',
          scheduledFor: releaseDate,
        };
      });

      // Try createMany, fall back to individual creates if needed
      try {
        await db.freeAccountDrop.createMany({
          data: itemsToCreate,
        });
      } catch (insertErr) {
        console.warn('[drops] createMany failed, inserting sequentially:', insertErr);
        for (const item of itemsToCreate) {
          await db.freeAccountDrop.create({ data: item });
        }
      }

      return NextResponse.json({
        success: true,
        count: itemsToCreate.length,
        scheduled: intervalMins > 0 || initialDelayMins > 0,
      });
    }

    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save drop' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, action, email, password, token, scheduledFor } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    if (action === 'release_now') {
      const updated = await db.freeAccountDrop.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          scheduledFor: new Date(),
        },
      });
      return NextResponse.json({ success: true, item: updated });
    }

    const updateData: any = {};
    if (email !== undefined) updateData.email = email.trim();
    if (password !== undefined) updateData.password = password.trim();
    if (token !== undefined) updateData.token = token ? token.trim() : null;
    if (scheduledFor !== undefined) {
      updateData.scheduledFor = new Date(scheduledFor);
      if (updateData.scheduledFor.getTime() > Date.now()) {
        updateData.status = 'QUEUED';
      } else {
        updateData.status = 'ACTIVE';
      }
    }

    const updated = await db.freeAccountDrop.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.freeAccountDrop.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Delete failed' }, { status: 500 });
  }
}
