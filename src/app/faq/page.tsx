'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  Search,
  ChevronDown,
  ShieldCheck,
  Zap,
  KeyRound,
  Coins,
  Gamepad2,
  LifeBuoy,
  ArrowRight,
  ExternalLink,
  Lock,
  RefreshCw,
} from 'lucide-react';

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  icon: any;
  tag?: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    id: 'mcfa-explained',
    category: 'Account Types',
    question: 'What is a Minecraft Full Access (MCFA) account?',
    answer:
      'MCFA stands for Minecraft Full Access. When you purchase an MCFA account, you receive full ownership credentials including the linked Microsoft email and recovery access. You can change the password, modify security questions, update the skin and username, and bind your personal email address.',
    icon: KeyRound,
    tag: 'Full Ownership',
  },
  {
    id: 'nfa-explained',
    category: 'Account Types',
    question: 'What is a Non-Full Access (NFA) account?',
    answer:
      'NFA stands for Non-Full Access. These are budget-friendly accounts intended for casual gameplay, testing mods, or sandbox play. NFA accounts do not grant access to the original email mailbox, meaning you cannot change the email or password. They are ideal for quick sessions and cost a fraction of full-access accounts.',
    icon: Zap,
    tag: 'Budget Friendly',
  },
  {
    id: 'delivery-speed',
    category: 'Ordering & Delivery',
    question: 'How fast will I receive my account after payment?',
    answer:
      'Delivery is 100% automated and instantaneous. Once your cryptocurrency transaction is broadcast and detected by our automated nodes, your credentials are assigned immediately. You will find your account details in your Dashboard and can copy them with one click.',
    icon: RefreshCw,
    tag: 'Instant 24/7',
  },
  {
    id: 'crypto-payment',
    category: 'Ordering & Delivery',
    question: 'What payment methods do you accept?',
    answer:
      'We accept major cryptocurrencies including Bitcoin (BTC) and Litecoin (LTC). Crypto allows for decentralized, secure, and fee-efficient processing without chargebacks or regional payment blocks.',
    icon: Coins,
  },
  {
    id: 'hypixel-status',
    category: 'Bans & Networks',
    question: 'Are accounts guaranteed unbanned on Hypixel and DonutSMP?',
    answer:
      'Yes! Every listing clearly specifies its ban status. Accounts tagged as "Hypixel Unbanned" or "DonutSMP Ready" are pre-checked before listing. If any account delivered fails to connect to the specified network upon delivery, our 24-hour warranty covers an immediate replacement.',
    icon: Gamepad2,
    tag: 'Hypixel Ready',
  },
  {
    id: 'warranty-policy',
    category: 'Warranties & Replacements',
    question: 'What does your replacement warranty cover?',
    answer:
      'We guarantee that every account is fully functional upon delivery. If you experience invalid credentials or an unexpected server ban within our warranty window, open a ticket on our Support Desk. Our team verifies the transaction and issues a replacement without hassle.',
    icon: ShieldCheck,
    tag: '24h Guarantee',
  },
  {
    id: 'mcfa-security-setup',
    category: 'Warranties & Replacements',
    question: 'How should I secure my MCFA account right after purchase?',
    answer:
      'For MCFA accounts: 1) Log in to account.microsoft.com using your delivered credentials. 2) Navigate to Security and change the password. 3) Add your personal email address or mobile number as the primary alias/recovery method. 4) Enable Two-Factor Authentication (2FA) for permanent security.',
    icon: Lock,
  },
  {
    id: 'ranks-and-capes',
    category: 'Account Types',
    question: 'Do accounts come with Hypixel ranks or official capes?',
    answer:
      'Selected premium listings include ranks (such as VIP, VIP+, MVP, MVP+) and rare vanity capes (Migrator, Vanilla, 15th Anniversary, MCC, TikTok, Twitch). Look for rank and cape badges on our store catalog cards to pick accounts with your desired cosmetics.',
    icon: Gamepad2,
  },
  {
    id: 'free-nfa-drops',
    category: 'Ordering & Delivery',
    question: 'How do the Free 24h NFA Account Drops work?',
    answer:
      'Every 24 hours, our automated system generates a free NFA account drop directly on our Free Drops page. Any registered user can claim or inspect credentials once the timer unlocks. These are provided as a community perk for our player base.',
    icon: Zap,
    tag: 'Community Perk',
  },
];

const CATEGORIES = [
  'All',
  'Account Types',
  'Ordering & Delivery',
  'Bans & Networks',
  'Warranties & Replacements',
];

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [openIds, setOpenIds] = useState<string[]>(['mcfa-explained', 'delivery-speed']);

  const toggleAccordion = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      const matchesCat =
        activeCategory === 'All' || item.category === activeCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div
      className="min-h-screen text-white relative overflow-hidden flex flex-col"
      style={{
        background:
          'radial-gradient(ellipse 75% 55% at 50% 20%, rgba(35, 20, 90, 0.45) 0%, transparent 65%), #07061a',
      }}
    >
      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12">
        {/* Header matching enchantalts obsidian / periwinkle aesthetic */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#737bea]/10 border border-[#737bea]/30 text-[#968bf7] text-xs font-bold uppercase tracking-wider shadow-sm">
            <HelpCircle size={14} className="text-[#737bea]" />
            <span>Knowledge Base &amp; FAQ</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Frequently Asked Questions
          </h1>

          <p className="text-white/60 text-sm sm:text-base leading-relaxed">
            Everything you need to know about Minecraft Full Access (MCFA), Non-Full Access (NFA), instant automated delivery, and our 24-hour guarantee.
          </p>

          {/* Search Box */}
          <div className="pt-2 max-w-xl mx-auto">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
              />
              <input
                type="text"
                placeholder="Search questions (e.g. Hypixel, MCFA, crypto, replacement)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0a1224] border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-[#737bea]/60 transition-colors shadow-lg"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#5a61e2] text-white shadow-md shadow-[#5a61e2]/25'
                    : 'bg-[#0a1224] text-white/60 hover:text-white hover:bg-white/[0.04] border border-white/10'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3 max-w-3xl mx-auto">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isOpen = openIds.includes(faq.id);
              const Icon = faq.icon;
              return (
                <div
                  key={faq.id}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isOpen
                      ? 'bg-[#0a1224] border-[#737bea]/40 shadow-xl'
                      : 'bg-[#0a1224]/70 border-white/10 hover:border-white/20'
                  }`}
                >
                  <button
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between text-left gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          isOpen
                            ? 'bg-[#737bea]/20 border-[#737bea]/40 text-[#968bf7]'
                            : 'bg-white/[0.03] border-white/10 text-white/50'
                        }`}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm sm:text-base font-bold text-white block">
                          {faq.question}
                        </span>
                        {faq.tag && (
                          <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-[#968bf7] bg-[#737bea]/10 px-2 py-0.5 rounded border border-[#737bea]/20">
                            {faq.tag}
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-transform duration-200 ${
                        isOpen
                          ? 'rotate-180 bg-[#737bea]/20 border-[#737bea]/40 text-white'
                          : 'rotate-0 bg-white/[0.04] border-white/10 text-white/40'
                      }`}
                    >
                      <ChevronDown size={15} />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-white/65 leading-relaxed border-t border-white/5">
                      <div className="pl-12">{faq.answer}</div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 p-8 rounded-2xl bg-[#0a1224] border border-white/10 space-y-3">
              <HelpCircle size={32} className="text-white/20 mx-auto" />
              <p className="text-sm text-white/50 font-medium">
                No questions found matching &ldquo;{searchQuery}&rdquo;
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('All');
                }}
                className="text-xs text-[#968bf7] hover:underline font-bold"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>

        {/* Bottom Help Desk Callout */}
        <div className="max-w-3xl mx-auto rounded-3xl bg-gradient-to-r from-[#0a1224] to-[#120f38] border border-white/10 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-[#737bea]/15 border border-[#737bea]/30 text-[#968bf7] flex items-center justify-center shrink-0">
              <LifeBuoy size={24} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Have an issue with an order?
              </h3>
              <p className="text-xs text-white/55 mt-0.5">
                Our support desk is active 24/7. Submit a ticket for instant assistance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <Link
              href="/support"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#5a61e2] hover:bg-[#737bea] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              <span>Support Desk</span>
              <ArrowRight size={14} />
            </Link>

            <a
              href="https://discord.gg/ghostalts"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white text-xs font-bold transition-all"
            >
              <span>Discord</span>
              <ExternalLink size={12} className="text-white/40" />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
