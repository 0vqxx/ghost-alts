'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Coins,
  QrCode,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  Zap,
  ArrowRight,
  Sparkles,
  Key,
  Eye,
  EyeOff,
  RefreshCw,
  Clock,
  Send,
  HelpCircle,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice, maskIGN } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';

interface CryptoOption {
  symbol: 'BTC' | 'LTC';
  name: string;
  icon: string;
  enabled: boolean;
  addressConfigured: boolean;
  priceUsd: number;
  minConfirmations: number;
}

interface ActivePaymentState {
  orderId: string;
  orderNumber: string;
  cryptoCurrency: 'BTC' | 'LTC';
  cryptoAmountExpected: number;
  receivingAddress: string;
  totalAmount: number;
  subtotal: number;
  discountAmount: number;
  exchangeRate: number;
  expiresAt: string;
  minConfirmations: number;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const directProductId = searchParams.get('productId');

  const { items: cartItems, subtotal: cartSubtotal, removeItem, clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: any } | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);

  // Direct product load if ?productId=...
  const [directProduct, setDirectProduct] = useState<any>(null);
  const [directQuantity, setDirectQuantity] = useState(1);

  // Crypto options & rates
  const [cryptoOptions, setCryptoOptions] = useState<CryptoOption[]>([
    {
      symbol: 'LTC',
      name: 'Litecoin',
      icon: 'Ł',
      enabled: true,
      addressConfigured: true,
      priceUsd: 70,
      minConfirmations: 1,
    },
  ]);
  const [selectedCrypto, setSelectedCrypto] = useState<'BTC' | 'LTC'>('LTC');

  // Discount code
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percentage: number } | null>(null);
  const [discountError, setDiscountError] = useState('');
  const [validatingCode, setValidatingCode] = useState(false);

  // Active Payment & Live Monitoring
  const [activePayment, setActivePayment] = useState<ActivePaymentState | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('awaiting_payment');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [deliveredAccounts, setDeliveredAccounts] = useState<any[]>([]);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [confirmations, setConfirmations] = useState(0);
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null);

  // UI state
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<{ [id: string]: boolean }>({});
  const [timeLeftSec, setTimeLeftSec] = useState<number>(3600);

  // Fetch Supabase User & Crypto Rates
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Fetch crypto options & live rates
    fetch('/api/checkout/crypto/options')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.options)) {
          setCryptoOptions(data.options);
          const enabledFirst = data.options.find((o: CryptoOption) => o.enabled);
          if (enabledFirst) {
            setSelectedCrypto(enabledFirst.symbol);
          }
        }
      })
      .catch((e) => console.warn('Failed to fetch crypto options:', e));

    return () => subscription.unsubscribe();
  }, []);

  // Direct product fetch if query parameter present
  useEffect(() => {
    if (directProductId) {
      fetch(`/api/admin/products`)
        .then((r) => r.json())
        .catch(() => null);
    }
  }, [directProductId]);

  // Expiration countdown timer
  useEffect(() => {
    if (!activePayment || paymentConfirmed) return;

    const expiryTime = new Date(activePayment.expiresAt).getTime();
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));
      setTimeLeftSec(remaining);
      if (remaining <= 0) {
        setPaymentStatus('expired');
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [activePayment, paymentConfirmed]);

  // Live Blockchain Status Polling (Every 4 seconds)
  useEffect(() => {
    if (!activePayment || paymentConfirmed || paymentStatus === 'expired') return;

    let isSubscribed = true;

    const checkStatus = async () => {
      try {
        const res = await fetch(
          `/api/checkout/crypto/status?orderNumber=${encodeURIComponent(activePayment.orderNumber)}`
        );
        const data = await res.json();

        if (!isSubscribed) return;

        if (res.ok) {
          if (data.paymentStatus) {
            setPaymentStatus(data.paymentStatus);
          }
          if (data.txHash) {
            setTxHash(data.txHash);
          }
          if (data.confirmations !== undefined) {
            setConfirmations(data.confirmations);
          }
          if (data.explorerUrl) {
            setExplorerUrl(data.explorerUrl);
          }

          if (data.isDelivered || data.paymentStatus === 'paid') {
            setPaymentConfirmed(true);
            setDeliveredAccounts(data.deliveries || []);
          }
        }
      } catch (err) {
        console.error('[Status Poll] Error:', err);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 4000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [activePayment, paymentConfirmed, paymentStatus]);

  // Order Items Resolution
  const checkoutItems = useMemo(() => {
    if (cartItems.length > 0) return cartItems;
    return [];
  }, [cartItems]);

  const rawSubtotal = useMemo(() => {
    return checkoutItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  }, [checkoutItems]);

  const discountValue = useMemo(() => {
    if (!appliedDiscount) return 0;
    return (rawSubtotal * appliedDiscount.percentage) / 100;
  }, [rawSubtotal, appliedDiscount]);

  const finalTotalUSD = Math.max(0.01, rawSubtotal - discountValue);

  // Selected Crypto Calculation
  const currentCryptoOption = cryptoOptions.find((c) => c.symbol === selectedCrypto);
  const liveEstimatedCryptoAmount = useMemo(() => {
    if (!currentCryptoOption || currentCryptoOption.priceUsd <= 0) return '0.00000000';
    return (finalTotalUSD / currentCryptoOption.priceUsd).toFixed(8);
  }, [finalTotalUSD, currentCryptoOption]);

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountCode.trim()) return;
    setDiscountError('');
    setValidatingCode(true);

    try {
      const code = discountCode.trim().toUpperCase();
      const response = await fetch(`/api/discount/validate?code=${encodeURIComponent(code)}`);
      if (!response.ok) throw new Error('Discount validation unavailable');
      const result = await response.json();
      if (result.valid) {
        setAppliedDiscount({ code: result.code, percentage: result.percentage });
      } else {
        setAppliedDiscount(null);
        setDiscountError('Invalid or expired discount code');
      }
    } catch {
      setDiscountError('Failed to validate code');
    } finally {
      setValidatingCode(false);
    }
  };

  const handleDiscordLogin = () => {
    setOauthLoading(true);
    window.location.href = `/api/auth/discord?next=${encodeURIComponent('/checkout')}`;
  };

  const handleCreateCryptoOrder = async () => {
    setError('');
    setCreatingPayment(true);

    if (checkoutItems.length === 0) {
      setError('Your shopping cart is empty.');
      setCreatingPayment(false);
      return;
    }

    try {
      const payload = {
        items: checkoutItems.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
        cryptoCurrency: selectedCrypto,
        discountCode: appliedDiscount?.code,
      };

      const res = await fetch('/api/checkout/crypto/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize cryptocurrency payment');
      }

      setActivePayment({
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        cryptoCurrency: data.cryptoCurrency,
        cryptoAmountExpected: data.cryptoAmountExpected,
        receivingAddress: data.receivingAddress,
        totalAmount: data.totalAmount,
        subtotal: data.subtotal,
        discountAmount: data.discountAmount,
        exchangeRate: data.exchangeRate,
        expiresAt: data.expiresAt,
        minConfirmations: data.minConfirmations || 1,
      });

      setPaymentStatus('awaiting_payment');
      clearCart();
    } catch (err: any) {
      setError(err.message || 'Payment initialization error');
    } finally {
      setCreatingPayment(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleReveal = (id: string) => {
    setRevealedKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const discordUsername =
    user?.user_metadata?.custom_claims?.global_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    'Discord User';

  const discordAvatar = user?.user_metadata?.avatar_url;

  // Generate Crypto URI for QR code
  const cryptoPaymentUri = useMemo(() => {
    if (!activePayment) return '';
    const scheme = activePayment.cryptoCurrency === 'LTC' ? 'litecoin' : 'bitcoin';
    return `${scheme}:${activePayment.receivingAddress}?amount=${activePayment.cryptoAmountExpected}`;
  }, [activePayment]);

  return (
    <div className="market-container shop-page font-sans">
      <Link href="/shop" className="back-link">
        <ArrowLeft size={15} /> Back to marketplace
      </Link>

      <div className="shop-heading" style={{ marginTop: 26 }}>
        <div>
          <div className="eyebrow">ORDER CHECKOUT &amp; INSTANT VAULT DELIVERY</div>
          <h1>Complete your order.</h1>
          <p>
            Direct on-chain cryptocurrency payment with instant automated vault fulfillment &amp; Discord DM delivery.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl text-xs flex items-center gap-2.5 mb-6 font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. ACTIVE CRYPTO PAYMENT SCREEN (When invoice is created)                   */}
      {/* ========================================================================= */}
      {activePayment ? (
        <div className="max-w-3xl mx-auto bg-surface border border-card-border p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl font-mono text-primary animate-fade-in">
          {paymentConfirmed ? (
            /* ===================================================================== */
            /* 1A. PAYMENT CONFIRMED & VAULT CREDENTIALS REVEAL                      */
            /* ===================================================================== */
            <div className="space-y-6 text-center animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20 animate-pulse">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles size={12} /> Blockchain Verified &amp; Settled
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">
                  Payment Received &amp; Delivered!
                </h2>
                <p className="text-xs text-secondary max-w-md mx-auto font-sans">
                  Your transaction has been confirmed on the {activePayment.cryptoCurrency} network. Your account credentials have been generated and secured in your vault.
                </p>
              </div>

              {/* Order Meta Bar */}
              <div className="p-4 bg-soft border border-card-border rounded-2xl flex flex-wrap items-center justify-around gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-secondary block uppercase font-bold">Order ID</span>
                  <span className="font-bold text-accent">{activePayment.orderNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-secondary block uppercase font-bold">Amount Settled</span>
                  <span className="font-bold text-emerald-400">
                    {activePayment.cryptoAmountExpected} {activePayment.cryptoCurrency} ({formatPrice(activePayment.totalAmount)})
                  </span>
                </div>
                {txHash && (
                  <div>
                    <span className="text-[10px] text-secondary block uppercase font-bold">Tx Hash</span>
                    <a
                      href={
                        activePayment.cryptoCurrency === 'LTC'
                          ? `https://litecoinspace.org/tx/${txHash}`
                          : `https://mempool.space/tx/${txHash}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-accent hover:underline flex items-center gap-1"
                    >
                      {txHash.substring(0, 8)}... <ExternalLink size={11} />
                    </a>
                  </div>
                )}
              </div>

              {/* Delivered Credentials Vault Box */}
              <div className="space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                    <Key size={14} className="text-accent" /> Your Digital Credentials
                  </span>
                  <span className="text-[11px] text-emerald-400 font-bold">
                    {deliveredAccounts.length} Item(s) Delivered
                  </span>
                </div>

                <div className="space-y-2.5">
                  {deliveredAccounts.map((item, idx) => {
                    const isRevealed = revealedKeys[item.id || idx];
                    const fullText = item.credentials || item;
                    const displayText = isRevealed
                      ? fullText
                      : fullText.replace(/(:[^:@\s]{4})[^@\s]*/g, '$1••••••••');

                    return (
                      <div
                        key={idx}
                        className="p-4 bg-soft border border-card-border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs"
                      >
                        <div className="space-y-1 flex-1 overflow-hidden">
                          <span className="text-[10px] text-secondary uppercase font-bold block">
                            Account #{idx + 1} {item.productName ? `• ${item.productName}` : ''}
                          </span>
                          <code className="text-primary break-all select-all font-bold">
                            {displayText}
                          </code>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleReveal(item.id || idx)}
                            className="p-2 rounded-xl bg-surface border border-card-border hover:bg-soft text-secondary hover:text-primary transition-colors cursor-pointer"
                            title={isRevealed ? 'Hide sensitive data' : 'Reveal sensitive data'}
                          >
                            {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(fullText, `cred_${idx}`)}
                            className="button button-primary px-3 py-2 text-xs flex items-center gap-1.5"
                          >
                            {copiedKey === `cred_${idx}` ? (
                              <>
                                <Check size={13} /> Copied
                              </>
                            ) : (
                              <>
                                <Copy size={13} /> Copy
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Discord Delivery Confirmation Notice */}
              {user && (
                <div className="p-4 bg-[#5865F2]/10 border border-[#5865F2]/30 rounded-2xl flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-full bg-[#5865F2]/20 flex items-center justify-center shrink-0 text-[#5865F2]">
                    <Send size={16} />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-primary">Discord Delivery Express</p>
                    <p className="text-secondary font-sans text-[11px]">
                      A backup copy of your order credentials has been dispatched to your linked Discord DMs (
                      <strong className="text-primary">@{discordUsername}</strong>).
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link href="/dashboard" className="button button-secondary flex-1">
                  View in My Vault
                </Link>
                <Link href="/shop" className="button button-primary flex-1">
                  Continue Shopping <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ) : (
            /* ===================================================================== */
            /* 1B. PENDING BLOCKCHAIN PAYMENT INVOICE & QR CODE                     */
            /* ===================================================================== */
            <div className="space-y-6 animate-fade-in">
              {/* Header with Order Number & Expiration */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-card-border">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg border ${
                      activePayment.cryptoCurrency === 'LTC'
                        ? 'bg-[#345d9d]/15 border-[#345d9d]/30 text-[#4e88e7]'
                        : 'bg-[#f7931a]/15 border-[#f7931a]/30 text-[#f7931a]'
                    }`}
                  >
                    {activePayment.cryptoCurrency === 'LTC' ? 'Ł' : '₿'}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-primary">
                      Pay with {activePayment.cryptoCurrency === 'LTC' ? 'Litecoin' : 'Bitcoin'}
                    </h2>
                    <span className="text-[11px] text-secondary font-mono">
                      Order #{activePayment.orderNumber}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div
                    className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-mono font-bold ${
                      timeLeftSec < 300
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
                        : 'bg-soft border-card-border text-secondary'
                    }`}
                  >
                    <Clock size={13} />
                    <span>{formatCountdown(timeLeftSec)}</span>
                  </div>
                </div>
              </div>

              {/* QR Code & Payment Instructions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* QR Code Container */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-5 bg-white rounded-3xl shadow-inner">
                  <QRCodeSVG
                    value={cryptoPaymentUri}
                    size={200}
                    level="H"
                    includeMargin={false}
                    className="rounded-lg"
                  />
                  <span className="text-[10px] text-black/60 font-mono mt-2 font-bold uppercase tracking-wider text-center">
                    Scan in your {activePayment.cryptoCurrency} Wallet
                  </span>
                </div>

                {/* Crypto Amount & Receiving Address Details */}
                <div className="md:col-span-7 space-y-4">
                  {/* Amount to Send */}
                  <div className="p-3.5 bg-soft border border-card-border rounded-2xl space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-secondary uppercase tracking-wider">
                      <span>Exact Amount to Send</span>
                      <span className="text-emerald-400 font-mono">
                        ≈ {formatPrice(activePayment.totalAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-lg font-bold text-primary font-mono select-all">
                        {activePayment.cryptoAmountExpected} {activePayment.cryptoCurrency}
                      </code>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(String(activePayment.cryptoAmountExpected), 'pay_amount')
                        }
                        className="button button-secondary text-xs px-2.5 py-1.5 flex items-center gap-1 shrink-0"
                      >
                        {copiedKey === 'pay_amount' ? (
                          <Check size={13} className="text-emerald-400" />
                        ) : (
                          <Copy size={13} />
                        )}
                        <span>{copiedKey === 'pay_amount' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Receiving Address */}
                  <div className="p-3.5 bg-soft border border-card-border rounded-2xl space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-secondary uppercase tracking-wider">
                      <span>Store Receiving Address</span>
                      <span className="text-accent font-mono">Network: {activePayment.cryptoCurrency}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-xs font-bold text-primary font-mono break-all select-all">
                        {activePayment.receivingAddress}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopy(activePayment.receivingAddress, 'pay_addr')}
                        className="button button-secondary text-xs px-2.5 py-1.5 flex items-center gap-1 shrink-0 ml-2"
                      >
                        {copiedKey === 'pay_addr' ? (
                          <Check size={13} className="text-emerald-400" />
                        ) : (
                          <Copy size={13} />
                        )}
                        <span>{copiedKey === 'pay_addr' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Exchange Rate Info */}
                  <div className="flex items-center justify-between text-[11px] text-secondary px-1 font-mono">
                    <span>Locked Rate:</span>
                    <span className="text-primary font-bold">
                      1 {activePayment.cryptoCurrency} = {formatPrice(activePayment.exchangeRate)} USD
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Blockchain Live Monitor */}
              <div className="p-4 bg-soft border border-card-border rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
                    </span>
                    <span className="text-primary">Live Blockchain Radar Monitor</span>
                  </div>
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      paymentStatus === 'confirming'
                        ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                        : paymentStatus === 'detected'
                        ? 'bg-blue-500/15 border border-blue-500/30 text-blue-400'
                        : 'bg-soft border border-card-border text-secondary'
                    }`}
                  >
                    {paymentStatus === 'confirming'
                      ? `Confirming (${confirmations}/${activePayment.minConfirmations})`
                      : paymentStatus === 'detected'
                      ? 'Detected in Mempool'
                      : 'Awaiting Payment'}
                  </span>
                </div>

                <p className="text-xs text-secondary font-sans leading-relaxed">
                  {paymentStatus === 'confirming'
                    ? `Transaction detected with ${confirmations} block confirmation(s). Instant fulfillment triggers at ${activePayment.minConfirmations} confirmation.`
                    : paymentStatus === 'detected'
                    ? 'Payment broadcast detected in memory pool! Waiting for next block inclusion...'
                    : `Please send the exact amount of ${activePayment.cryptoCurrency} to the address above. The system automatically verifies transactions and fulfills your order without manual approval.`}
                </p>

                {txHash && (
                  <div className="pt-2 border-t border-card-border/60 flex items-center justify-between text-xs">
                    <span className="text-secondary">Detected TxID:</span>
                    <a
                      href={
                        activePayment.cryptoCurrency === 'LTC'
                          ? `https://litecoinspace.org/tx/${txHash}`
                          : `https://mempool.space/tx/${txHash}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent hover:underline flex items-center gap-1 font-mono"
                    >
                      {txHash.substring(0, 16)}... <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>

              {/* Cancellation / Back Option */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActivePayment(null)}
                  className="text-xs text-secondary hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Cancel and choose another currency
                </button>
                <div className="text-[11px] text-secondary flex items-center gap-1 font-sans">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  <span>Non-custodial direct settlement</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. ORDER SUMMARY & CRYPTO SELECTION STEP                                  */
        /* ========================================================================= */
        <div className="checkout-layout">
          {/* Left Column: Order Items & Configuration */}
          <div className="checkout-main space-y-6">
            {/* Discord Account Authentication Gate */}
            <div className="bg-surface border border-card-border p-6 rounded-3xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2]">
                    <Send size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-primary">Discord Delivery Express</h2>
                    <p className="text-[11px] text-secondary font-sans">
                      Link Discord for automatic DM delivery &amp; ticket priority.
                    </p>
                  </div>
                </div>

                {user ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
                    <CheckCircle2 size={13} />
                    <span>@{discordUsername}</span>
                  </div>
                ) : (
                  <button
                    onClick={handleDiscordLogin}
                    disabled={oauthLoading}
                    className="button button-secondary text-xs px-3.5 py-2 flex items-center gap-2"
                  >
                    <span className="text-[#5865F2]">Sign in with Discord</span>
                  </button>
                )}
              </div>
            </div>

            {/* Cryptocurrency Selector */}
            <div className="bg-surface border border-card-border p-6 rounded-3xl space-y-4 shadow-sm font-mono">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-accent" />
                  <h2 className="text-sm font-bold text-primary uppercase tracking-wider">
                    Select Cryptocurrency
                  </h2>
                </div>
                <span className="text-[11px] text-secondary font-sans">
                  Direct on-chain payment
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {cryptoOptions.map((opt) => {
                  const isSelected = selectedCrypto === opt.symbol;
                  const isLtc = opt.symbol === 'LTC';

                  return (
                    <button
                      key={opt.symbol}
                      type="button"
                      disabled={!opt.enabled}
                      onClick={() => setSelectedCrypto(opt.symbol)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? 'bg-soft border-accent shadow-md shadow-purple-500/10'
                          : opt.enabled
                          ? 'bg-surface border-card-border hover:border-card-border/80 hover:bg-soft'
                          : 'bg-surface/50 border-card-border/40 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm border ${
                              isLtc
                                ? 'bg-[#345d9d]/15 border-[#345d9d]/30 text-[#4e88e7]'
                                : 'bg-[#f7931a]/15 border-[#f7931a]/30 text-[#f7931a]'
                            }`}
                          >
                            {opt.icon}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-primary block">
                              {opt.name}
                            </span>
                            <span className="text-[10px] text-secondary font-mono block">
                              {opt.symbol}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center">
                            <Check size={11} strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-card-border/60 flex items-center justify-between text-[11px]">
                        <span className="text-secondary font-sans">
                          {isLtc ? '⚡ Low fees & fast' : '🌐 Global Bitcoin'}
                        </span>
                        <span className="text-primary font-bold font-mono">
                          ≈ {formatPrice(opt.priceUsd)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cart Items List */}
            <div className="bg-surface border border-card-border p-6 rounded-3xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-primary uppercase tracking-wider font-mono">
                  Order Items ({checkoutItems.length})
                </h2>
                <Link href="/shop" className="text-xs text-accent hover:underline">
                  Modify Items
                </Link>
              </div>

              {checkoutItems.length === 0 ? (
                <div className="py-8 text-center text-secondary text-xs">
                  Your cart is currently empty. Please select an account from the marketplace.
                </div>
              ) : (
                <div className="divide-y divide-card-border">
                  {checkoutItems.map((item) => (
                    <div
                      key={item.product.id}
                      className="py-3.5 flex items-center justify-between gap-4 font-mono text-xs"
                    >
                      <div className="space-y-0.5">
                        <p className="font-bold text-primary">{item.product.name}</p>
                        <p className="text-[11px] text-secondary">
                          {item.quantity}x • {item.product.type} ({item.product.edition})
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">
                          {formatPrice(item.product.price * item.quantity)}
                        </p>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="text-[10px] text-rose-400 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Checkout Summary & Action */}
          <div className="checkout-sidebar space-y-5">
            <div className="bg-surface border border-card-border p-6 rounded-3xl space-y-5 shadow-sm font-mono">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider pb-3 border-b border-card-border">
                Payment Summary
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-secondary">
                  <span>Subtotal</span>
                  <span className="text-primary font-bold">{formatPrice(rawSubtotal)}</span>
                </div>

                {appliedDiscount && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount ({appliedDiscount.code})</span>
                    <span>-{formatPrice(discountValue)}</span>
                  </div>
                )}

                <div className="flex justify-between text-secondary">
                  <span>Network Transaction Fee</span>
                  <span className="text-emerald-400 font-bold">$0.00 (Zero Fee)</span>
                </div>

                <div className="pt-3 border-t border-card-border flex justify-between items-baseline">
                  <span className="text-sm font-bold text-primary">Order Total</span>
                  <span className="text-xl font-bold text-accent font-mono">
                    {formatPrice(finalTotalUSD)}
                  </span>
                </div>

                {/* Crypto Conversion Preview */}
                <div className="p-3 bg-soft border border-card-border rounded-2xl flex items-center justify-between text-xs mt-2">
                  <span className="text-secondary">Payable in {selectedCrypto}:</span>
                  <span className="font-bold text-primary font-mono">
                    {liveEstimatedCryptoAmount} {selectedCrypto}
                  </span>
                </div>
              </div>

              {/* Discount Code Form */}
              <form onSubmit={handleApplyDiscount} className="space-y-2 pt-2 border-t border-card-border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Coupon Code"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="bg-soft border border-card-border rounded-xl px-3 py-2 text-xs text-primary focus:border-accent outline-none flex-1 font-mono uppercase"
                  />
                  <button
                    type="submit"
                    disabled={validatingCode || !discountCode.trim()}
                    className="button button-secondary text-xs px-3.5 py-2 shrink-0"
                  >
                    Apply
                  </button>
                </div>
                {discountError && (
                  <p className="text-[10px] text-rose-400 font-sans">{discountError}</p>
                )}
              </form>

              {/* Generate Payment Button */}
              <button
                type="button"
                onClick={handleCreateCryptoOrder}
                disabled={creatingPayment || checkoutItems.length === 0}
                className="button button-primary w-full py-3.5 text-xs flex items-center justify-center gap-2 font-bold shadow-lg shadow-purple-500/20 uppercase tracking-wider"
              >
                {creatingPayment ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Generating Payment...
                  </>
                ) : (
                  <>
                    <QrCode size={14} />
                    Generate {selectedCrypto} Invoice
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-secondary text-center pt-1 font-sans">
                <Lock size={12} className="text-accent shrink-0" />
                <span>256-bit encrypted • Non-custodial direct blockchain settlement</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="market-container shop-page font-mono text-center py-20 text-secondary">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-accent mb-3" />
          <p>Loading secure cryptocurrency checkout...</p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
