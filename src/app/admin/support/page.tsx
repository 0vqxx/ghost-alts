'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LifeBuoy,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Search,
  User,
  Shield,
  RefreshCw,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

interface TicketMessage {
  id: string;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  ticketNumber: string;
  category: string;
  subject: string;
  message?: string;
  status: string;
  createdAt: string;
  orderId?: string;
  user?: {
    username: string;
    email: string;
    discordId?: string;
  };
  messages?: TicketMessage[];
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [replying, setReplying] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/support/ticket');
      const data = await res.json();
      if (data.tickets) {
        setTickets(data.tickets);
        if (data.tickets.length > 0 && !selectedTicket) {
          setSelectedTicket(data.tickets[0]);
        }
      }
    } catch {
      // quiet catch
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    setReplying(true);
    const content = replyMessage.trim();
    setReplyMessage('');

    try {
      const res = await fetch('/api/support/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          message: content,
        }),
      });

      const data = await res.json();
      const newMsg: TicketMessage = data.message || {
        id: 'msg-' + Date.now(),
        senderName: 'GhostAlts Staff',
        senderRole: 'ADMIN',
        message: content,
        createdAt: new Date().toISOString(),
      };

      const updatedTicket: Ticket = {
        ...selectedTicket,
        messages: [...(selectedTicket.messages || []), newMsg],
      };

      setSelectedTicket(updatedTicket);
      setTickets((prev) =>
        prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t))
      );
    } catch {
      // fallback local update
      const newMsg: TicketMessage = {
        id: 'msg-' + Date.now(),
        senderName: 'GhostAlts Staff',
        senderRole: 'ADMIN',
        message: content,
        createdAt: new Date().toISOString(),
      };
      const updatedTicket = {
        ...selectedTicket,
        messages: [...(selectedTicket.messages || []), newMsg],
      };
      setSelectedTicket(updatedTicket);
    } finally {
      setReplying(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedTicket) return;

    setStatusUpdating(true);
    try {
      await fetch('/api/support/ticket', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          status: newStatus,
        }),
      });

      const updated = { ...selectedTicket, status: newStatus };
      setSelectedTicket(updated);
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } finally {
      setStatusUpdating(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus === 'OPEN' && t.status !== 'OPEN') return false;
    if (filterStatus === 'RESOLVED' && t.status !== 'RESOLVED') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.ticketNumber.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5 text-white font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Disputes &amp; Support
          </h1>
          <p className="text-xs text-white/50 mt-0.5">
            Customer warranty claims, account recovery disputes, and staff dispatch.
          </p>
        </div>

        <button
          onClick={loadTickets}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/80 hover:text-white transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Support Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Tickets Queue */}
        <div className="lg:col-span-5 rounded-2xl bg-[#0b0e14] border border-white/[0.08] p-4 space-y-3 shadow-sm">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-black/40 rounded-xl border border-white/[0.06]">
            {(['ALL', 'OPEN', 'RESOLVED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterStatus(tab)}
                className={`flex-1 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  filterStatus === tab
                    ? 'bg-white/[0.1] text-white shadow-xs'
                    : 'text-white/40 hover:text-white/80'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              type="text"
              placeholder="Search account, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/50 border border-white/[0.08] rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-[#737bea]/60"
            />
          </div>

          {/* Tickets List */}
          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                const isResolved = t.status === 'RESOLVED';
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#737bea]/10 border-[#737bea]/50 shadow-sm'
                        : 'bg-black/30 border-white/[0.05] hover:border-white/[0.12]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-xs font-mono font-bold text-white/70">
                          {t.user?.username ? t.user.username.slice(0, 1).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <span className="font-mono text-xs font-bold text-white block">
                            {t.user?.username || 'Customer'}
                          </span>
                          <span className="text-[10px] text-white/40 font-mono">
                            #{t.ticketNumber}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          !isResolved
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-white/[0.05] border-white/10 text-white/50'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-white/80 font-medium truncate">
                      {t.subject}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.04] text-[10px] text-white/40 font-mono">
                      <span>{t.category}</span>
                      <span>
                        {new Date(t.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center space-y-1">
                <LifeBuoy size={20} className="text-white/20 mx-auto" />
                <p className="text-xs text-white/40 font-medium">No tickets in this filter</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Ticket Inspector & Staff Responder */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <div className="rounded-2xl border border-white/[0.08] bg-[#0b0e14] flex flex-col h-[640px] shadow-sm overflow-hidden">
              {/* Header (Matching reference media_1790422648498.png) */}
              <div className="p-4 border-b border-white/[0.06] bg-black/30 space-y-3 shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center font-bold text-white font-mono">
                      {selectedTicket.user?.username
                        ? selectedTicket.user.username.slice(0, 1).toUpperCase()
                        : 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white tracking-tight">
                          {selectedTicket.user?.username || 'Customer'} Dispute
                        </h3>
                        <span className="text-xs text-rose-400 font-medium">
                          | {selectedTicket.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-white/[0.04] border border-white/[0.06]">
                          SUPPORT ID {selectedTicket.ticketNumber}
                        </span>
                        <span>•</span>
                        <span>
                          Opened: {new Date(selectedTicket.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        selectedTicket.status === 'OPEN'
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      • {selectedTicket.status === 'OPEN' ? 'AWAITING RESPONSE' : 'RESOLVED'}
                    </span>

                    {selectedTicket.status === 'OPEN' ? (
                      <button
                        onClick={() => handleUpdateStatus('RESOLVED')}
                        disabled={statusUpdating}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] text-white/70 hover:text-white text-xs font-medium transition-all cursor-pointer"
                      >
                        Close
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus('OPEN')}
                        disabled={statusUpdating}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] text-white/70 hover:text-white text-xs font-medium transition-all cursor-pointer"
                      >
                        Re-open
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Step Line (Exact match to reference) */}
                <div className="pt-2 border-t border-white/[0.04]">
                  <div className="flex items-center justify-between text-[10px] text-white/40 font-mono px-2">
                    <div className="flex items-center gap-1.5 text-white/80">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[9px] font-bold">✓</span>
                      <span>Opened</span>
                    </div>

                    <div className="h-px bg-white/10 flex-1 mx-3" />

                    <div className="flex items-center gap-1.5 text-[#968bf7]">
                      <span className="w-4 h-4 rounded-full bg-[#737bea]/20 text-[#968bf7] flex items-center justify-center text-[9px] font-bold">💬</span>
                      <span>Staff Reply</span>
                    </div>

                    <div className="h-px bg-white/10 flex-1 mx-3" />

                    <div className="flex items-center gap-1.5 text-white/30">
                      <span className="w-4 h-4 rounded-full bg-white/[0.05] text-white/30 flex items-center justify-center text-[9px]">👥</span>
                      <span>Discussion</span>
                    </div>

                    <div className="h-px bg-white/10 flex-1 mx-3" />

                    <div className="flex items-center gap-1.5 text-white/30">
                      <span className="w-4 h-4 rounded-full bg-white/[0.05] text-white/30 flex items-center justify-center text-[9px]">🛡️</span>
                      <span>Resolution</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informational Callout (Match to reference banner) */}
              <div className="px-4 py-2 bg-black/40 border-b border-white/[0.04] text-[11px] text-white/50 flex items-center gap-2">
                <Clock size={13} className="text-white/40 shrink-0" />
                <span>Customer support guarantee: 24h replacement warranty applies to verified invalid credentials.</span>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 custom-scrollbar bg-black/20">
                {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages.map((msg, i) => {
                    const isStaff = msg.senderRole === 'ADMIN';
                    return (
                      <div
                        key={msg.id || i}
                        className={`flex flex-col max-w-[85%] ${
                          isStaff ? 'ml-auto items-end' : 'mr-auto items-start'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-white/40">
                          {isStaff ? (
                            <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-[#737bea]/15 text-[#968bf7] border border-[#737bea]/30">
                              STAFF · OWNER
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-white/[0.05] text-white/70">
                              {msg.senderName || 'CUSTOMER'}
                            </span>
                          )}
                          <span>•</span>
                          <span className="font-mono">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div
                          className={`p-3 rounded-2xl text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap ${
                            isStaff
                              ? 'bg-[#181d2a] border border-[#737bea]/30 text-white shadow-sm'
                              : 'bg-white/[0.04] border border-white/[0.08] text-white/90'
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3.5 rounded-xl bg-white/[0.02] text-xs text-white/50">
                    {selectedTicket.message || 'No messages recorded yet.'}
                  </div>
                )}
              </div>

              {/* Admin Staff Reply Footer */}
              <div className="p-3 border-t border-white/[0.06] bg-black/40 flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendReply();
                  }}
                  placeholder="Write a message... (Enter to send, Shift+Enter for a new line)"
                  className="flex-1 bg-black/60 border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-[#737bea]/60"
                />
                <button
                  disabled={replying || !replyMessage.trim()}
                  onClick={handleSendReply}
                  className="px-4 py-2 rounded-xl bg-[#5a61e2] hover:bg-[#6b72e8] disabled:opacity-30 text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shadow-sm"
                >
                  <span>{replying ? 'Sending…' : 'Send'}</span>
                  <Send size={12} />
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.08] bg-[#0b0e14] p-12 text-center space-y-2">
              <LifeBuoy size={28} className="text-white/20 mx-auto" />
              <h3 className="text-sm font-semibold text-white">Select a dispute ticket</h3>
              <p className="text-xs text-white/40">
                Choose a customer warranty claim or ticket to review and dispatch a response.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
