import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    const order = await db.order.update({
      where: { id: orderId },
      data: { status },
    });

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update order status' },
      { status: 500 }
    );
  }
}
