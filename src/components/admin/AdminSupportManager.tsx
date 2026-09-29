'use client';

import React, { useState } from 'react';
import { formatDate } from '@/lib/utils';
import { Headphones, Send, CheckCircle2, MessageSquare, Clock, X, AlertCircle } from 'lucide-react';

interface TicketDTO {
  id: string;
  ticketNumber: string;
  username: string;
  email: string;
  category: string;
  subject: string;
  status: string;
  orderNumber: string | null;
  createdAt: string;
  messages: {
    id: string;
    senderName: string;
    senderRole: string;
    message: string;
    createdAt: string;
  }[];
}

export function AdminSupportManager({ initialTickets }: { initialTickets: TicketDTO[] }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [selectedTicket, setSelectedTicket] = useState<TicketDTO | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;
    setLoading(true);

    try {
      const res = await fetch('/api/support/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          message: replyText,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const newMsg = {
          id: data.message.id,
          senderName: data.message.senderName,
          senderRole: data.message.senderRole,
          message: data.message.message,
          createdAt: data.message.createdAt,
        };

        const updated = {
          ...selectedTicket,
          messages: [...selectedTicket.messages, newMsg],
          status: 'RESOLVED',
        };

        setSelectedTicket(updated);
        setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setReplyText('');
      }
    } catch {}
    setLoading(false);
  };

  return (
    <div className="bg-[#0b0e14] border border-white/[0.08] rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4 text-[#968bf7]" />
            <h2 className="text-base font-bold text-white tracking-tight">Support Desk &amp; Tickets</h2>
          </div>
          <p className="text-xs text-white/50 mt-0.5 font-sans">
            Resolve customer inquiries, order disputes, and ticket replacements.
          </p>
        </div>
        <span className="text-xs text-white/50">
          Total tickets: <strong className="text-white font-mono">{tickets.length}</strong>
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#07090e]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/[0.06] text-white/50 uppercase font-semibold text-[11px] tracking-wider">
              <th className="py-3 px-4">Ticket #</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Subject</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Order Ref</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-white/40">
                  No support tickets found in database.
                </td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-[#968bf7]">
                    {t.ticketNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-white">@{t.username}</p>
                    <p className="text-[11px] text-white/40">{t.email}</p>
                  </td>
                  <td className="py-3.5 px-4 text-white/70">{t.category}</td>
                  <td className="py-3.5 px-4 text-white max-w-xs truncate">{t.subject}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                        t.status === 'RESOLVED'
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                          : t.status === 'IN_PROGRESS'
                          ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                          : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-white/40">
                    {t.orderNumber || <span className="text-white/20">—</span>}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedTicket(t)}
                      className="px-2.5 py-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/60 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      Respond
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0b0e14] border border-white/[0.1] rounded-2xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl space-y-5 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[#968bf7] font-bold font-mono">{selectedTicket.ticketNumber}</span>
                  <span className="text-white/40">•</span>
                  <span className="text-xs text-white/50">{selectedTicket.category}</span>
                </div>
                <h3 className="text-sm font-bold text-white mt-1">{selectedTicket.subject}</h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/[0.06] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conversation Log */}
            <div className="max-h-72 overflow-y-auto space-y-3 p-4 bg-[#07090e] border border-white/[0.08] rounded-xl">
              {selectedTicket.messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl text-xs space-y-1 ${
                    m.senderRole === 'ADMIN'
                      ? 'bg-[#5a61e2]/15 border border-[#5a61e2]/30 text-white ml-8'
                      : 'bg-[#0e121a] border border-white/[0.06] text-white/90 mr-8'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-white/40">
                    <span className="font-semibold text-white">
                      {m.senderName} ({m.senderRole})
                    </span>
                    <span>{formatDate(m.createdAt)}</span>
                  </div>
                  <p className="leading-relaxed font-sans text-xs">{m.message}</p>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            <form onSubmit={handleSendReply} className="space-y-3">
              <textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your official administrative reply..."
                className="w-full bg-[#07090e] border border-white/[0.08] text-white p-3 rounded-xl focus:outline-none focus:border-[#5a61e2] text-xs font-sans placeholder-white/30"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-3.5 py-1.5 text-white/40 hover:text-white text-xs font-medium cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={loading || !replyText.trim()}
                  className="px-4 py-1.5 bg-[#5a61e2] hover:bg-[#6b72e8] disabled:opacity-50 text-white font-medium text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Reply</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
