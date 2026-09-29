import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const reviews = await db.review
      .findMany({
        include: {
          product: {
            select: {
              id: true,
              name: true,
              type: true,
              slug: true,
            },
          },
          user: {
            select: {
              username: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
      .catch(() => []);

    return NextResponse.json({ success: true, reviews });
  } catch (error: any) {
    return NextResponse.json({ success: true, reviews: [] });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { productId, rating, title, content, ign } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Find product or pick first available active product
    let targetProductId = productId;
    if (!targetProductId) {
      const firstProduct = await db.product.findFirst({
        where: { active: true },
        select: { id: true },
      }).catch(() => null);
      targetProductId = firstProduct?.id;
    }

    if (!targetProductId) {
      return NextResponse.json(
        { error: 'No valid product found to attach review' },
        { status: 400 }
      );
    }

    let userId = session?.id;
    let isVerifiedPurchase = false;

    if (userId) {
      const orderWithProduct = await db.order
        .findFirst({
          where: {
            userId,
            items: {
              some: { productId: targetProductId },
            },
          },
        })
        .catch(() => null);
      isVerifiedPurchase = !!orderWithProduct;
    } else {
      // Find or create a guest user for the review
      const guestName = (ign || 'Guest').substring(0, 32);
      const guestEmail = `guest_${Date.now()}@ghostalts.com`;
      try {
        const guestUser = await db.user.create({
          data: {
            email: guestEmail,
            username: guestName,
            passwordHash: '',
            role: 'USER',
          },
        });
        userId = guestUser.id;
      } catch {
        // quiet fallback
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Could not associate review with a user account' },
        { status: 400 }
      );
    }

    const review = await db.review.create({
      data: {
        productId: targetProductId,
        userId,
        rating: Math.min(5, Math.max(1, parseInt(rating) || 5)),
        title,
        content,
        isVerifiedPurchase,
        isDemo: false,
      },
      include: {
        product: { select: { name: true, type: true, slug: true } },
        user: { select: { username: true } },
      },
    });

    // Update product rating aggregate
    try {
      const allReviews = await db.review.findMany({
        where: { productId: targetProductId },
        select: { rating: true },
      });
      if (allReviews.length > 0) {
        const avgRating =
          allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        await db.product.update({
          where: { id: targetProductId },
          data: {
            reviewCount: allReviews.length,
            rating: parseFloat(avgRating.toFixed(2)),
          },
        });
      }
    } catch {}

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to submit review' },
      { status: 500 }
    );
  }
}
