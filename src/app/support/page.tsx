'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  LifeBuoy,
  MessageSquare,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Search,
  User,
  Shield,
  Copy,
  Check,
  Paperclip,
  X,
  Users,
  Info,
  CheckCircle,
  ChevronDown,
} from 'lucide-react';

interface TicketMessage {
  id: string;
  senderName: string;
  senderRole: 'SELLER' | 'ADMIN' | 'USER';
  badgeTitle?: string;
  message: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  disputeTag: string;
  category: string;
  buyerName: string;
  buyerIgn: string;
  price: string;
  status: 'AWAITING SELLER' | 'IN_PROGRESS' | 'OPEN' | 'CLOSED' | 'RESOLVED';
  statusFilter: 'ACTIVE' | 'OPEN' | 'CLOSED';
  soldAt: string;
  openedAt: string;
  expiresIn: string;
  currentStep: number; // 1 = Opened, 2 = Seller reply, 3 = Discussion, 4 = Resolution
  escalated: boolean;
  messages: TicketMessage[];
}

const DISPUTE_REASONS = [
  {
    value: 'Account Dispute (Recovered / Invalid)',
    label: 'Account Dispute (Recovered / Invalid Credentials)',
    desc: 'Password stopped working or account recovered by original owner',
  },
  {
    value: 'Hypixel / DonutSMP Ban Appeal',
    label: 'Unexpected Server Ban (Hypixel / DonutSMP)',
    desc: 'Account was marked unbanned but could not connect upon delivery',
  },
  {
    value: 'Order & Payment Issue',
    label: 'Order / Crypto Payment Confirmation',
    desc: 'Crypto payment detected or order delivery assistance',
  },
  {
    value: 'General Support',
    label: 'General Assistance',
    desc: 'General questions or launcher technical assistance',
  },
];

export default function DisputesAndSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ALL' | 'OPEN' | 'CLOSED'>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [loading, setLoading] = useState(true);

  // Message input state
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // New ticket / dispute modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reasonDropdownOpen, setReasonDropdownOpen] = useState(false);
  const [formCategory, setFormCategory] = useState('Account Dispute (Recovered / Invalid)');
  const [formOrderId, setFormOrderId] = useState('');
  const [formIgn, setFormIgn] = useState('');
  const [formPrice, setFormPrice] = useState('$7.50');
  const [formMessage, setFormMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load real tickets from database & localStorage on mount
  useEffect(() => {
    async function loadUserTickets() {
      try {
        setLoading(true);
        const res = await fetch('/api/support/ticket');
        const data = await res.json();

        let loadedTickets: Ticket[] = [];

        if (Array.isArray(data.tickets) && data.tickets.length > 0) {
          loadedTickets = data.tickets.map((t: any) => {
            const hasStaffReply = t.messages?.some(
              (m: any) => m.senderRole === 'ADMIN' || m.senderRole === 'SELLER'
            );
            const isClosed = t.status === 'CLOSED' || t.status === 'RESOLVED';

            return {
              id: t.id,
              ticketNumber: t.ticketNumber || `SUP-${t.id.substring(0, 8).toUpperCase()}`,
              title: t.order?.orderNumber
                ? `Order #${t.order.orderNumber} Dispute`
                : t.subject || 'Account Dispute',
              disputeTag: t.category?.includes('Recovered')
                ? 'Recovered'
                : t.category?.includes('Replacement')
                ? 'Replacement'
                : 'Inquiry',
              category: t.category || 'Account Replacement',
              buyerName: t.user?.username || 'You',
              buyerIgn: t.user?.username || 'Steve',
              price: t.order?.totalAmount
                ? `$${Number(t.order.totalAmount).toFixed(2)}`
                : '$0.00',
              status: isClosed
                ? 'CLOSED'
                : hasStaffReply
                ? 'IN_PROGRESS'
                : 'AWAITING SELLER',
              statusFilter: isClosed ? 'CLOSED' : 'ACTIVE',
              soldAt: new Date(t.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
              openedAt: new Date(t.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
              expiresIn: '23h 45m left',
              currentStep: isClosed ? 4 : hasStaffReply ? 3 : 2,
              escalated: true,
              messages: (t.messages || []).map((m: any) => ({
                id: m.id || String(Math.random()),
                senderName: m.senderName || (m.senderRole === 'ADMIN' ? 'Staff' : 'You'),
                senderRole: m.senderRole || 'USER',
                badgeTitle:
                  m.senderRole === 'ADMIN' || m.senderRole === 'SELLER'
                    ? 'GHOSTALTS STAFF'
                    : undefined,
                message: m.message,
                createdAt: new Date(m.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              })),
            };
          });
        }

        // Merge with local storage tickets
        try {
          const localSaved = JSON.parse(
            localStorage.getItem('ghostalts_user_disputes') || '[]'
          );
          if (Array.isArray(localSaved) && localSaved.length > 0) {
            const existingIds = new Set(loadedTickets.map((t) => t.id));
            const uniqueLocal = localSaved.filter((t: Ticket) => !existingIds.has(t.id));
            loadedTickets = [...loadedTickets, ...uniqueLocal];
          }
        } catch {}

        setTickets(loadedTickets);
        if (loadedTickets.length > 0) {
          setSelectedTicketId(loadedTickets[0].id);
        }
      } catch {
        // If API fails or is offline, check local storage
        try {
          const localSaved = JSON.parse(
            localStorage.getItem('ghostalts_user_disputes') || '[]'
          );
          if (Array.isArray(localSaved) && localSaved.length > 0) {
            setTickets(localSaved);
            setSelectedTicketId(localSaved[0].id);
          }
        } catch {}
      } finally {
        setLoading(false);
      }
    }

    loadUserTickets();
  }, []);

  const selectedTicket = useMemo(() => {
    return tickets.find((t) => t.id === selectedTicketId) || null;
  }, [tickets, selectedTicketId]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (activeTab === 'ACTIVE' && t.statusFilter !== 'ACTIVE' && t.status === 'CLOSED') {
        return false;
      }
      if (activeTab === 'OPEN' && t.status === 'CLOSED') return false;
      if (activeTab === 'CLOSED' && t.status !== 'CLOSED') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.ticketNumber.toLowerCase().includes(q) ||
          t.buyerName.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.disputeTag.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tickets, activeTab, searchQuery]);

  const handleCopySupportId = (idText: string) => {
    navigator.clipboard.writeText(idText);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedTicket) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);

    const newMsg: TicketMessage = {
      id: 'msg-' + Date.now(),
      senderName: 'You',
      senderRole: 'USER',
      message: messageText,
      createdAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const updatedTicket: Ticket = {
      ...selectedTicket,
      messages: [...selectedTicket.messages, newMsg],
    };

    const updatedList = tickets.map((t) => (t.id === updatedTicket.id ? updatedTicket : t));
    setTickets(updatedList);
    try {
      localStorage.setItem('ghostalts_user_disputes', JSON.stringify(updatedList));
    } catch {}

    try {
      await fetch('/api/support/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          message: messageText,
        }),
      });
    } catch {} finally {
      setIsSending(false);
    }
  };

  const handleCloseDispute = async () => {
    if (!selectedTicket) return;
    const updated: Ticket = {
      ...selectedTicket,
      status: 'CLOSED',
      statusFilter: 'CLOSED',
    };
    const updatedList = tickets.map((t) => (t.id === updated.id ? updated : t));
    setTickets(updatedList);
    try {
      localStorage.setItem('ghostalts_user_disputes', JSON.stringify(updatedList));
      await fetch('/api/support/ticket', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          status: 'CLOSED',
        }),
      });
    } catch {}
  };

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMessage.trim()) return;

    setIsSubmitting(true);
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randomPrefix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newSupportId = `SUP-${randomPrefix}-${randomSuffix}`;

    try {
      const res = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: formOrderId ? `Order #${formOrderId} Dispute` : 'Account Dispute',
          category: formCategory,
          message: formMessage.trim(),
          orderId: formOrderId.trim() || undefined,
        }),
      });
      const data = await res.json();
      const serverTicket = data.ticket;

      const newTicket: Ticket = {
        id: serverTicket?.id || 'disp-' + Date.now(),
        ticketNumber: serverTicket?.ticketNumber || newSupportId,
        title: formOrderId ? `Order #${formOrderId} Dispute` : 'Account Dispute',
        disputeTag: formCategory.includes('Recovered') ? 'Recovered' : 'Replacement',
        category: formCategory,
        buyerName: formIgn.trim() || 'You',
        buyerIgn: formIgn.trim() || 'Steve',
        price: formPrice || '$0.00',
        status: 'AWAITING SELLER',
        statusFilter: 'ACTIVE',
        soldAt: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        openedAt: 'Just now',
        expiresIn: '23h 59m left',
        currentStep: 2,
        escalated: true,
        messages: [
          {
            id: 'msg-init-' + Date.now(),
            senderName: formIgn.trim() || 'You',
            senderRole: 'USER',
            message: formMessage.trim(),
            createdAt: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
        ],
      };

      const updated = [newTicket, ...tickets];
      setTickets(updated);
      setSelectedTicketId(newTicket.id);
      try {
        localStorage.setItem('ghostalts_user_disputes', JSON.stringify(updated));
      } catch {}

      setIsModalOpen(false);
      setFormMessage('');
      setFormOrderId('');
      setFormIgn('');
    } catch {
      // Local fallback
      const newTicket: Ticket = {
        id: 'disp-' + Date.now(),
        ticketNumber: newSupportId,
        title: formOrderId ? `Order #${formOrderId} Dispute` : 'Account Dispute',
        disputeTag: formCategory.includes('Recovered') ? 'Recovered' : 'Replacement',
        category: formCategory,
        buyerName: formIgn.trim() || 'You',
        buyerIgn: formIgn.trim() || 'Steve',
        price: formPrice || '$0.00',
        status: 'AWAITING SELLER',
        statusFilter: 'ACTIVE',
        soldAt: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        openedAt: 'Just now',
        expiresIn: '23h 59m left',
        currentStep: 2,
        escalated: true,
        messages: [
          {
            id: 'msg-init',
            senderName: formIgn.trim() || 'You',
            senderRole: 'USER',
            message: formMessage.trim(),
            createdAt: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
        ],
      };

      const updated = [newTicket, ...tickets];
      setTickets(updated);
      setSelectedTicketId(newTicket.id);
      try {
        localStorage.setItem('ghostalts_user_disputes', JSON.stringify(updated));
      } catch {}

      setIsModalOpen(false);
      setFormMessage('');
      setFormOrderId('');
      setFormIgn('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07061a] text-white relative overflow-hidden flex flex-col">
      <main className="flex-1 w-full max-w-[1360px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Top Title & Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-white/40 block">
              SUPPORT CENTER
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-0.5">
              Disputes &amp; Support
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:gap-4">
            <div className="flex items-center gap-2 text-[11px] text-white/50 bg-[#0a0f1d] border border-white/10 rounded-xl px-3.5 py-2">
              <Info size={14} className="text-white/40 shrink-0" />
              <span>
                <strong className="text-white/70">Note:</strong> Keep it on site — sharing any social handles like Discord or anything else results in a scam and being banned from the site.
              </span>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#5a61e2] hover:bg-[#737bea] text-white text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer"
            >
              <Plus size={14} />
              <span>Contact support</span>
            </button>
          </div>
        </div>

        {/* Main 2-Column Dashboard matching EnchantAlts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Tickets & Disputes List */}
          <div className="lg:col-span-4 bg-[#0a0f1d] border border-white/10 rounded-2xl p-4 space-y-3.5 shadow-xl">
            {/* Search Input */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35"
              />
              <input
                type="text"
                placeholder="Search account, id..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#070a14] border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-[#737bea]/60 transition-colors"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-black/40 rounded-xl border border-white/5">
              {(['ACTIVE', 'ALL', 'OPEN', 'CLOSED'] as const).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#24263e] text-white shadow-sm'
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Ticket Cards List */}
            <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredTickets.length > 0 ? (
                filteredTickets.map((t) => {
                  const isSelected = selectedTicketId === t.id;
                  const lastMessage =
                    t.messages.length > 0
                      ? t.messages[t.messages.length - 1].message
                      : 'No messages yet';

                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0f142b] border-[#5a61e2] shadow-[0_0_20px_rgba(90,97,226,0.15)]'
                          : 'bg-[#070a14] border-white/5 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={`https://mc-heads.net/avatar/${t.buyerIgn}/48`}
                          alt={t.buyerName}
                          className="w-9 h-9 rounded-lg bg-black/50 border border-white/10 shrink-0"
                        />

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-white truncate">
                              {t.buyerName}
                            </span>
                            <span className="text-xs font-bold text-[#968bf7] font-mono shrink-0">
                              {t.price}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300">
                              DISPUTE • {t.disputeTag.toUpperCase()}
                            </span>
                          </div>

                          <p className="text-[11px] text-white/55 line-clamp-1 font-sans">
                            {lastMessage}
                          </p>

                          <div className="flex items-center justify-between pt-1 text-[10px]">
                            <span className="inline-flex items-center gap-1 text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                              {t.status}
                            </span>

                            <span className="text-white/40 font-medium font-mono flex items-center gap-1">
                              <Clock size={11} />
                              {t.expiresIn}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center space-y-2">
                  <MessageSquare size={24} className="text-white/20 mx-auto" />
                  <p className="text-xs text-white/40 font-medium">No disputes or tickets open</p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="text-xs text-[#968bf7] hover:underline font-bold pt-1 block mx-auto cursor-pointer"
                  >
                    Open a dispute
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Ticket / Dispute Thread View */}
          <div className="lg:col-span-8">
            {selectedTicket ? (
              <div className="bg-[#0a0f1d] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xl flex flex-col min-h-[640px]">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={`https://mc-heads.net/avatar/${selectedTicket.buyerIgn}/56`}
                      alt={selectedTicket.buyerName}
                      className="w-11 h-11 rounded-xl bg-black/50 border border-white/10 shrink-0"
                    />
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5">
                        <span>{selectedTicket.title}</span>
                        <span className="text-rose-400 font-bold">| {selectedTicket.disputeTag}</span>
                      </h2>

                      <div className="flex items-center gap-3 text-[11px] text-white/45 flex-wrap mt-0.5">
                        <span className="flex items-center gap-1 font-mono">
                          SUPPORT ID
                          <strong className="text-white/80">{selectedTicket.ticketNumber}</strong>
                          <button
                            type="button"
                            onClick={() => handleCopySupportId(selectedTicket.ticketNumber)}
                            className="text-white/40 hover:text-white p-0.5 rounded cursor-pointer"
                            title="Copy Support ID"
                          >
                            {copiedId ? (
                              <Check size={12} className="text-emerald-400" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </span>
                        <span>•</span>
                        <span>Account sold at: <strong className="text-white/70">{selectedTicket.soldAt}</strong></span>
                      </div>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider self-start sm:self-center">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    {selectedTicket.status}
                  </span>
                </div>

                {/* 4-Step Visual Stepper (matches screenshot exactly) */}
                <div className="py-3 px-2">
                  <div className="grid grid-cols-4 gap-2 relative text-center">
                    {/* Step 1: Opened */}
                    <div className="flex flex-col items-center space-y-1.5 relative z-10">
                      <div className="w-7 h-7 rounded-full bg-[#5a61e2] text-white flex items-center justify-center text-xs font-bold shadow-md">
                        <Check size={13} />
                      </div>
                      <span className="text-xs font-bold text-white block">Opened</span>
                      <span className="text-[10px] text-white/40 font-mono">
                        {selectedTicket.openedAt}
                      </span>
                    </div>

                    {/* Step 2: Seller reply */}
                    <div className="flex flex-col items-center space-y-1.5 relative z-10">
                      <div className="w-7 h-7 rounded-full bg-[#5a61e2] text-white flex items-center justify-center text-xs font-bold shadow-[0_0_12px_rgba(90,97,226,0.5)]">
                        <MessageSquare size={13} />
                      </div>
                      <span className="text-xs font-bold text-white block">Seller reply</span>
                      <span className="text-[10px] text-[#968bf7] font-bold">
                        Current step
                      </span>
                    </div>

                    {/* Step 3: Discussion */}
                    <div className="flex flex-col items-center space-y-1.5 relative z-10">
                      <div className="w-7 h-7 rounded-full bg-white/10 text-white/40 flex items-center justify-center text-xs font-bold">
                        <Users size={13} />
                      </div>
                      <span className="text-xs font-semibold text-white/50 block">Discussion</span>
                      <span className="text-[10px] text-white/30">
                        Waiting for both sides
                      </span>
                    </div>

                    {/* Step 4: Resolution */}
                    <div className="flex flex-col items-center space-y-1.5 relative z-10">
                      <div className="w-7 h-7 rounded-full bg-white/10 text-white/40 flex items-center justify-center text-xs font-bold">
                        <Shield size={13} />
                      </div>
                      <span className="text-xs font-semibold text-white/50 block">Resolution</span>
                      <span className="text-[10px] text-white/30">
                        Pending decision
                      </span>
                    </div>

                    {/* Connecting Stepper Bar */}
                    <div className="absolute top-3.5 left-[12%] right-[12%] h-[2px] bg-white/10 -z-0">
                      <div className="h-full bg-[#5a61e2] w-[35%]" />
                    </div>
                  </div>
                </div>

                {/* Countdown Alert Banner */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-white/60">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-white/40 shrink-0" />
                    <span>The seller has 24 hours to respond. If they don&apos;t, support automatically steps in.</span>
                  </div>
                  <span className="text-white/50 font-mono font-bold shrink-0">
                    {selectedTicket.expiresIn}
                  </span>
                </div>

                {/* Chat Conversation Thread */}
                <div className="flex-1 overflow-y-auto space-y-4 py-2 custom-scrollbar pr-1">
                  {selectedTicket.messages.map((msg) => {
                    const isUser = msg.senderRole === 'USER';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          isUser ? 'items-end ml-auto' : 'items-start mr-auto'
                        } max-w-[85%]`}
                      >
                        {!isUser && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-bold text-emerald-400 mb-1">
                            <Shield size={10} />
                            <span>{msg.badgeTitle || 'GHOSTALTS STAFF'}</span>
                          </div>
                        )}

                        <div
                          className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                            isUser
                              ? 'bg-[#24263e] border border-white/10 text-white rounded-tr-xs'
                              : 'bg-[#0f1424] border border-white/10 text-white/90 rounded-tl-xs'
                          }`}
                        >
                          {msg.message}
                          <div className="text-[10px] text-white/40 text-right mt-1.5 font-mono flex items-center justify-end gap-1">
                            <span>{msg.createdAt}</span>
                            {isUser && <Check size={11} className="text-[#968bf7]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Resolution / Escalation Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10 gap-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                    <ShieldCheck size={14} />
                    <span>Resolution | Escalated to Admins</span>
                  </div>

                  <button
                    onClick={handleCloseDispute}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/70 hover:text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    <X size={13} />
                    <span>Close</span>
                  </button>
                </div>

                {/* Message Input Box (matches screenshot) */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    className="w-10 h-10 rounded-xl bg-black/40 hover:bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all cursor-pointer shrink-0"
                    title="Attach file / screenshot"
                  >
                    <Paperclip size={16} />
                  </button>

                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendMessage();
                      }}
                      placeholder="Write a message... (Enter to send, Shift+Enter for a new line)"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/35 outline-none focus:border-[#737bea]/60 transition-colors"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isSending}
                    className="w-10 h-10 rounded-xl bg-[#5a61e2] hover:bg-[#737bea] disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 disabled:cursor-not-allowed shadow-md"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
            ) : (
              /* No Disputes / No Tickets Open State */
              <div className="bg-[#0a0f1d] border border-white/10 rounded-2xl p-12 text-center space-y-4 shadow-2xl flex flex-col items-center justify-center min-h-[500px]">
                <div className="w-16 h-16 rounded-2xl bg-[#737bea]/10 border border-[#737bea]/25 flex items-center justify-center text-[#968bf7] shadow-lg">
                  <ShieldCheck size={32} />
                </div>
                <div className="max-w-md space-y-1">
                  <h3 className="text-xl font-bold text-white">No Disputes Open</h3>
                  <p className="text-xs text-white/50 leading-relaxed">
                    You currently have no active support disputes or tickets open. If you need assistance with an account or order, click below to open a dispute.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5a61e2] hover:bg-[#737bea] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Open a new dispute</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Contact Support / Dispute Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-lg bg-[#0a0f1d] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl relative">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-5 top-5 text-white/40 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#968bf7] block">
                  SUPPORT CENTER
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">
                  Open Support Dispute
                </h3>
                <p className="text-xs text-white/50 mt-1">
                  Submit a claim to the seller or request staff assistance with your account.
                </p>
              </div>

              <form onSubmit={handleCreateDispute} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-white/60">
                    Dispute Reason
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setReasonDropdownOpen(!reasonDropdownOpen)}
                      className="w-full bg-[#070a14] border border-white/10 hover:border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white flex items-center justify-between transition-all cursor-pointer shadow-inner"
                    >
                      <span className="font-semibold text-white truncate text-left mr-2">
                        {formCategory}
                      </span>
                      <ChevronDown
                        size={14}
                        className={`text-white/40 transition-transform duration-200 shrink-0 ${
                          reasonDropdownOpen ? 'rotate-180 text-white' : ''
                        }`}
                      />
                    </button>

                    {reasonDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0a0f1d] border border-white/15 rounded-2xl shadow-2xl p-1.5 space-y-1 z-50 animate-in fade-in zoom-in-95">
                        {DISPUTE_REASONS.map((reason) => {
                          const isSelected = formCategory === reason.value;
                          return (
                            <button
                              key={reason.value}
                              type="button"
                              onClick={() => {
                                setFormCategory(reason.value);
                                setReasonDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2.5 rounded-xl text-xs flex items-center justify-between text-left transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#5a61e2]/25 border border-[#5a61e2]/45 text-white font-bold'
                                  : 'text-white/70 hover:text-white hover:bg-white/[0.06] border border-transparent'
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <span className="block truncate text-xs font-semibold">{reason.label}</span>
                                <span className="text-[10px] text-white/40 font-normal block mt-0.5 truncate">
                                  {reason.desc}
                                </span>
                              </div>
                              {isSelected && <Check size={14} className="text-[#968bf7] shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-white/60">
                      Order # (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 517"
                      value={formOrderId}
                      onChange={(e) => setFormOrderId(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/35 outline-none focus:border-[#737bea]/60 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-white/60">
                      Your Minecraft IGN
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. XiaoChiQing"
                      value={formIgn}
                      onChange={(e) => setFormIgn(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/35 outline-none focus:border-[#737bea]/60"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-white/60">
                    Message Details
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe what happened with your account or order..."
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-white/35 outline-none focus:border-[#737bea]/60 resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-[#5a61e2] hover:bg-[#737bea] disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Opening Dispute...' : 'Submit Dispute'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
