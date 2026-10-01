import React from 'react';
import Link from 'next/link';
import { db, withDbTimeout } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import { Headphones, Plus, MessageSquare, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardSupportPage() {
  const user = await requireUser();

  const tickets = await withDbTimeout(
    db.supportTicket.findMany({
      where: { userId: user.id },
      include: {
        order: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    [],
    350
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'IN_PROGRESS':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'RESOLVED':
        return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
      case 'CLOSED':
        return 'bg-soft border-card-border text-secondary';
      default:
        return 'bg-soft border-card-border text-secondary';
    }
  };

  return (
    <div className="bg-surface border border-card-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm font-mono text-primary">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-card-border">
        <div>
          <h2 className="text-xl font-bold text-primary">Support Tickets</h2>
          <p className="text-xs text-secondary mt-0.5">
            Track inquiries, replacement requests, and specialist responses.
          </p>
        </div>

        <Link
          href="/support"
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md shadow-purple-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create New Ticket
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="p-12 text-center text-xs text-secondary bg-soft rounded-2xl border border-card-border space-y-3">
          <p className="text-base font-semibold text-primary">No support tickets</p>
          <p>You have not opened any tickets. Need help with an account?</p>
          <Link
            href="/support"
            className="inline-block px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-purple-500/20 uppercase tracking-wide cursor-pointer"
          >
            Open Ticket
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((t) => (
            <div
              key={t.id}
              className="bg-soft border border-card-border rounded-2xl p-5 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-card-border">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-purple-400 text-xs">
                    {t.ticketNumber}
                  </span>
                  <span className="text-xs font-mono font-bold text-primary">{t.subject}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-secondary px-2 py-0.5 rounded bg-surface border border-card-border">
                    {t.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getStatusBadge(
                      t.status
                    )}`}
                  >
                    {t.status}
                  </span>
                </div>
              </div>

              {/* Messages thread preview */}
              <div className="space-y-3">
                {t.messages.map((m: { id: string; senderRole: string; senderName: string; createdAt: Date; message: string }) => (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-xl text-xs space-y-1 font-mono ${
                      m.senderRole === 'ADMIN'
                        ? 'bg-purple-500/10 border border-purple-500/30 text-purple-300'
                        : 'bg-surface border border-card-border text-primary'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span
                        className={`font-bold ${
                          m.senderRole === 'ADMIN' ? 'text-purple-400' : 'text-primary'
                        }`}
                      >
                        {m.senderName}{' '}
                        {m.senderRole === 'ADMIN' && '(Support Specialist)'}
                      </span>
                      <span className="text-secondary">{formatDate(m.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
