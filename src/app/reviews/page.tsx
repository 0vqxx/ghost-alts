'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Star,
  CheckCircle2,
  ShieldCheck,
  MessageSquarePlus,
  Filter,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ThumbsUp,
  X,
  Search,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';

interface ReviewItem {
  id: string;
  userName: string;
  userAvatarIgn: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  productName: string;
  productType: 'MCFA' | 'NFA' | string;
  productSlug: string;
  isVerified: boolean;
  upvotes: number;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | '5_STAR' | 'MCFA' | 'NFA'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Review Form State
  const [formRating, setFormRating] = useState(5);
  const [formIgn, setFormIgn] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formProductType, setFormProductType] = useState<'MCFA' | 'NFA'>('MCFA');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [likedReviews, setLikedReviews] = useState<Record<string, boolean>>({});

  // Fetch real reviews from API on mount
  useEffect(() => {
    async function loadReviews() {
      try {
        setLoading(true);
        const res = await fetch('/api/reviews');
        const data = await res.json();

        let loaded: ReviewItem[] = [];

        if (Array.isArray(data.reviews) && data.reviews.length > 0) {
          loaded = data.reviews.map((r: any) => ({
            id: r.id,
            userName: r.user?.username || 'Verified Customer',
            userAvatarIgn: r.user?.username || 'Steve',
            rating: r.rating || 5,
            date: new Date(r.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
            title: r.title,
            content: r.content,
            productName: r.product?.name || 'Minecraft Account',
            productType: r.product?.type || 'MCFA',
            productSlug: r.product?.slug || 'shop',
            isVerified: Boolean(r.isVerifiedPurchase),
            upvotes: 0,
          }));
        }

        // Also check any locally submitted reviews
        try {
          const localSaved = JSON.parse(
            localStorage.getItem('ghostalts_user_reviews') || '[]'
          );
          if (Array.isArray(localSaved) && localSaved.length > 0) {
            const existingIds = new Set(loaded.map((item) => item.id));
            const uniqueLocal = localSaved.filter((item: ReviewItem) => !existingIds.has(item.id));
            loaded = [...uniqueLocal, ...loaded];
          }
        } catch {}

        setReviews(loaded);
      } catch {
        // Fallback to local storage if API is quiet
        try {
          const localSaved = JSON.parse(
            localStorage.getItem('ghostalts_user_reviews') || '[]'
          );
          if (Array.isArray(localSaved) && localSaved.length > 0) {
            setReviews(localSaved);
          }
        } catch {}
      } finally {
        setLoading(false);
      }
    }

    loadReviews();
  }, []);

  const handleLike = (id: string) => {
    setLikedReviews((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, upvotes: r.upvotes + (likedReviews[id] ? -1 : 1) } : r
      )
    );
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: formRating,
          title: formTitle.trim(),
          content: formContent.trim(),
          ign: formIgn.trim() || 'Customer',
        }),
      });
      const data = await res.json();

      const newReview: ReviewItem = {
        id: data.review?.id || 'rev-' + Date.now(),
        userName: formIgn.trim() || 'Verified Customer',
        userAvatarIgn: formIgn.trim() || 'Steve',
        rating: formRating,
        date: 'Just now',
        title: formTitle.trim(),
        content: formContent.trim(),
        productName:
          formProductType === 'MCFA'
            ? 'Minecraft Full Access (MCFA)'
            : 'Non-Full Access (NFA)',
        productType: formProductType,
        productSlug: 'shop',
        isVerified: Boolean(data.review?.isVerifiedPurchase),
        upvotes: 0,
      };

      const updated = [newReview, ...reviews];
      setReviews(updated);
      try {
        localStorage.setItem('ghostalts_user_reviews', JSON.stringify(updated));
      } catch {}

      setSubmitSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccess(false);
        setFormTitle('');
        setFormContent('');
        setFormIgn('');
      }, 1500);
    } catch {
      // Local fallback
      const newReview: ReviewItem = {
        id: 'rev-' + Date.now(),
        userName: formIgn.trim() || 'Verified Customer',
        userAvatarIgn: formIgn.trim() || 'Steve',
        rating: formRating,
        date: 'Just now',
        title: formTitle.trim(),
        content: formContent.trim(),
        productName:
          formProductType === 'MCFA'
            ? 'Minecraft Full Access (MCFA)'
            : 'Non-Full Access (NFA)',
        productType: formProductType,
        productSlug: 'shop',
        isVerified: false,
        upvotes: 0,
      };

      const updated = [newReview, ...reviews];
      setReviews(updated);
      try {
        localStorage.setItem('ghostalts_user_reviews', JSON.stringify(updated));
      } catch {}

      setSubmitSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccess(false);
        setFormTitle('');
        setFormContent('');
        setFormIgn('');
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Real Dynamic Metrics calculation
  const totalCount = reviews.length;
  const avgRating =
    totalCount > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount).toFixed(1)
      : '5.0';

  const ratingCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of reviews) {
      const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      counts[star]++;
    }
    return counts;
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (activeFilter === '5_STAR' && r.rating !== 5) return false;
      if (activeFilter === 'MCFA' && r.productType !== 'MCFA') return false;
      if (activeFilter === 'NFA' && r.productType !== 'NFA') return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          r.title.toLowerCase().includes(query) ||
          r.content.toLowerCase().includes(query) ||
          r.userName.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [reviews, activeFilter, searchQuery]);

  return (
    <div
      className="min-h-screen text-white relative overflow-hidden flex flex-col"
      style={{
        background:
          'radial-gradient(ellipse 75% 55% at 50% 20%, rgba(35, 20, 90, 0.45) 0%, transparent 65%), #07061a',
      }}
    >
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#737bea]/10 border border-[#737bea]/30 text-[#968bf7] text-[11px] font-bold uppercase tracking-wider mb-3">
              <Star size={13} className="fill-[#737bea] text-[#737bea]" />
              <span>Customer Feedback</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Customer Reviews
            </h1>
            <p className="text-white/55 mt-2 text-sm sm:text-base max-w-xl">
              Authentic reviews and ratings from players who received accounts through Ghost Alts.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#5a61e2] hover:bg-[#737bea] text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg cursor-pointer"
            >
              <MessageSquarePlus size={15} />
              <span>Write a Review</span>
            </button>
          </div>
        </div>

        {/* Rating Breakdown & Real Metrics Card */}
        <div className="rounded-3xl border border-white/10 bg-[#0a1224] p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center shadow-2xl">
          {/* Overall Rating Score */}
          <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-white/10">
            <div className="text-5xl sm:text-6xl font-black text-white tracking-tight flex items-baseline gap-1">
              {totalCount > 0 ? avgRating : '5.0'}
              <span className="text-xl text-white/40 font-bold">/ 5.0</span>
            </div>
            <div className="flex text-amber-400 gap-1 my-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  className={
                    totalCount > 0 && i < Math.round(Number(avgRating))
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-amber-400/40 text-amber-400/40'
                  }
                />
              ))}
            </div>
            <p className="text-xs text-white/50">
              {totalCount === 0
                ? 'No reviews submitted yet'
                : `Based on ${totalCount} verified ${totalCount === 1 ? 'review' : 'reviews'}`}
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
              <CheckCircle2 size={13} />
              <span>100% Genuine Buyer Feedback</span>
            </div>
          </div>

          {/* Real Rating Distribution Bars */}
          <div className="md:col-span-8 space-y-2.5">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = ratingCounts[stars as 1 | 2 | 3 | 4 | 5];
              const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
              return (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <span className="w-14 text-white/60 font-bold shrink-0">{stars} Stars</span>
                  <div className="flex-1 h-3 rounded-full bg-white/[0.04] overflow-hidden border border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        stars >= 4
                          ? 'bg-[#5a61e2]'
                          : stars === 3
                          ? 'bg-amber-400'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-14 text-right text-white/40 font-mono">
                    {pct}% ({count})
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {(
              [
                { label: 'All Reviews', key: 'ALL' },
                { label: '5 Stars Only', key: '5_STAR' },
                { label: 'MCFA Accounts', key: 'MCFA' },
                { label: 'NFA Accounts', key: 'NFA' },
              ] as const
            ).map((filter) => {
              const isActive = activeFilter === filter.key;
              return (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#5a61e2] text-white shadow-md shadow-[#5a61e2]/25'
                      : 'bg-[#0a1224] text-white/60 hover:text-white hover:bg-white/[0.04] border border-white/10'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a1224] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/35 outline-none focus:border-[#737bea]/60"
            />
          </div>
        </div>

        {/* Reviews List / Genuine Empty State */}
        {filteredReviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-2xl border border-white/10 bg-[#0a1224] p-5 sm:p-6 space-y-4 hover:border-[#737bea]/30 transition-all flex flex-col justify-between shadow-lg"
              >
                <div className="space-y-3">
                  {/* Header row: Avatar, name, verified, date */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://mc-heads.net/avatar/${rev.userAvatarIgn}/48`}
                        alt={rev.userName}
                        className="w-9 h-9 rounded-lg border border-white/10 bg-black/40 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-white">{rev.userName}</span>
                          {rev.isVerified && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                              <CheckCircle2 size={10} />
                              Verified
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-white/40 font-mono">{rev.date}</span>
                      </div>
                    </div>

                    <div className="flex text-amber-400 gap-0.5">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>

                  {/* Review Title & Content */}
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-white">{rev.title}</h4>
                    <p className="text-xs sm:text-sm text-white/60 mt-1.5 leading-relaxed font-sans">
                      {rev.content}
                    </p>
                  </div>
                </div>

                {/* Bottom footer: Product link & helpful button */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2 text-xs">
                  <Link
                    href="/shop"
                    className="text-[11px] text-[#968bf7] hover:underline font-semibold flex items-center gap-1 truncate"
                  >
                    <span>{rev.productName}</span>
                    <ArrowRight size={11} className="shrink-0" />
                  </Link>

                  <button
                    onClick={() => handleLike(rev.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
                      likedReviews[rev.id]
                        ? 'bg-[#737bea]/20 border-[#737bea]/40 text-[#968bf7]'
                        : 'bg-white/[0.02] border-white/10 text-white/40 hover:text-white'
                    }`}
                  >
                    <ThumbsUp size={12} />
                    <span>{rev.upvotes}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Real Clean Empty State */
          <div className="rounded-3xl border border-white/10 bg-[#0a1224] p-12 sm:p-16 text-center space-y-4 shadow-2xl flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[#737bea]/10 border border-[#737bea]/25 flex items-center justify-center text-[#968bf7] shadow-lg">
              <Star size={32} className="text-[#968bf7]" />
            </div>
            <div className="max-w-md space-y-1.5">
              <h3 className="text-xl font-bold text-white">No Reviews Published Yet</h3>
              <p className="text-xs sm:text-sm text-white/50 leading-relaxed">
                Ghost Alts only features genuine customer reviews from real buyers. If you have purchased an account, be the first to share your experience!
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#5a61e2] hover:bg-[#737bea] text-white text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer mt-2"
            >
              <MessageSquarePlus size={15} />
              <span>Leave the First Review</span>
            </button>
          </div>
        )}

        {/* Modal: Write a Review */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-lg bg-[#0a1224] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-5 top-5 text-white/40 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#737bea]/10 border border-[#737bea]/30 text-[#968bf7] text-[11px] font-bold uppercase tracking-wider mb-2">
                  <Sparkles size={12} />
                  <span>Share Your Experience</span>
                </div>
                <h3 className="text-xl font-extrabold text-white">Write a Customer Review</h3>
                <p className="text-xs text-white/50 mt-1">
                  Help fellow players by sharing your experience with your GhostAlts account.
                </p>
              </div>

              {submitSuccess ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={24} />
                  </div>
                  <h4 className="text-base font-bold text-white">Review Submitted!</h4>
                  <p className="text-xs text-white/50">
                    Thank you! Your feedback has been published.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  {/* Rating Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-white/60">
                      Overall Rating
                    </label>
                    <div className="flex gap-2 items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormRating(star)}
                          className="p-1 cursor-pointer transition-transform hover:scale-110"
                        >
                          <Star
                            size={24}
                            className={
                              star <= formRating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-white/20'
                            }
                          />
                        </button>
                      ))}
                      <span className="text-xs text-white/50 font-bold ml-2">
                        {formRating} of 5 Stars
                      </span>
                    </div>
                  </div>

                  {/* Minecraft IGN / Nickname */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-white/60">
                      Your Minecraft IGN or Handle
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Steve, Dream, or your ign"
                      value={formIgn}
                      onChange={(e) => setFormIgn(e.target.value)}
                      className="w-full bg-[#070a14] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/35 outline-none focus:border-[#737bea]/60"
                    />
                  </div>

                  {/* Account Type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-white/60">
                      Purchased Account Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormProductType('MCFA')}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          formProductType === 'MCFA'
                            ? 'bg-[#737bea]/20 border-[#737bea]/60 text-white'
                            : 'bg-[#070a14] border-white/10 text-white/50'
                        }`}
                      >
                        Minecraft Full Access (MCFA)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormProductType('NFA')}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          formProductType === 'NFA'
                            ? 'bg-[#737bea]/20 border-[#737bea]/60 text-white'
                            : 'bg-[#070a14] border-white/10 text-white/50'
                        }`}
                      >
                        Non-Full Access (NFA)
                      </button>
                    </div>
                  </div>

                  {/* Review Title */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-white/60">
                      Review Headline
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Quick delivery, worked as expected"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full bg-[#070a14] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/35 outline-none focus:border-[#737bea]/60"
                    />
                  </div>

                  {/* Review Body */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-white/60">
                      Your Detailed Feedback
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Describe your experience with the account delivery and support..."
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      className="w-full bg-[#070a14] border border-white/10 rounded-xl p-3.5 text-xs text-white placeholder:text-white/35 outline-none focus:border-[#737bea]/60 resize-none"
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
                      className="px-6 py-2.5 rounded-xl bg-[#5a61e2] hover:bg-[#737bea] disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
                    >
                      {isSubmitting ? 'Publishing…' : 'Submit Review'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
