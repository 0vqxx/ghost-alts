import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ticketId, message } = await request.json();
    if (!ticketId || !message) {
      return NextResponse.json(
        { error: 'Ticket ID and message are required' },
        { status: 400 }
      );
    }

    const ticket = await db.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (ticket.userId !== session.id && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const newMessage = await db.ticketMessage.create({
      data: {
        ticketId,
        senderId: session.id,
        senderName: session.username,
        senderRole: session.role === 'ADMIN' ? 'ADMIN' : 'USER',
        message,
      },
    });

    // If admin replies, change ticket to IN_PROGRESS or RESOLVED
    if (session.role === 'ADMIN') {
      await db.supportTicket.update({
        where: { id: ticketId },
        data: { updatedAt: new Date() },
      });
    }

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}
