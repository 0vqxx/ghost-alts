import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { formatPrice, formatDate } from '@/lib/utils';
import { CheckCircle2, ArrowRight, ShieldCheck, Package, ExternalLink, Zap } from 'lucide-react';

interface SuccessPageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export const dynamic = 'force-dynamic';

export default async function OrderSuccessPage({ searchParams }: SuccessPageProps) {
  const { orderId } = await searchParams;

  if (!orderId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4 font-mono">
        <h2 className="text-xl font-bold text-primary">Order Not Specified</h2>
        <p className="text-xs text-secondary">Please return to your dashboard to review your orders.</p>
        <Link
          href="/dashboard/orders"
          className="inline-flex px-5 py-2.5 bg-peri-500 hover:bg-peri-600 text-white font-semibold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(115,123,234,0.35)] uppercase"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  const order = await db.order
    .findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: true },
        },
        deliveries: true,
      },
    })
    .catch(() => null);

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4 font-mono">
        <h2 className="text-xl font-bold text-primary">Order Not Found</h2>
        <p className="text-xs text-secondary">We could not locate this order in our records.</p>
        <Link
          href="/dashboard"
          className="inline-flex px-5 py-2.5 bg-peri-500 hover:bg-peri-600 text-white font-semibold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(115,123,234,0.35)] uppercase"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 space-y-8 font-mono">
      {/* Success Badge */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.3)]">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h1 className="text-3xl font-black text-primary tracking-tight">
          Order Complete
        </h1>
        <p className="text-sm text-secondary">
          Your purchase is ready. Automated digital delivery has been processed.
        </p>
      </div>

      {/* Order Summary Card */}
      <div className="card-enchant p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-card-border text-xs">
          <div>
            <p className="text-secondary font-medium">Order Number</p>
            <p className="text-primary font-bold mt-0.5">{order.orderNumber}</p>
          </div>
          <div>
            <p className="text-secondary font-medium">Delivery Status</p>
            <p className="text-emerald-400 font-bold mt-0.5 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> Delivered
            </p>
          </div>
          <div>
            <p className="text-secondary font-medium">Total Paid</p>
            <p className="text-primary font-bold mt-0.5">{formatPrice(order.totalAmount)}</p>
          </div>
          <div>
            <p className="text-secondary font-medium">Delivery Email</p>
            <p className="text-primary font-medium mt-0.5 truncate">{order.email}</p>
          </div>
        </div>

        {/* Purchased Products List */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase text-secondary">
            Purchased Products
          </h4>
          <div className="divide-y divide-card-border">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-lg uppercase ${
                        item.product.type === 'MCFA'
                          ? 'badge-emerald'
                          : 'badge-peri'
                      }`}
                    >
                      {item.product.type}
                    </span>
                    <span className="text-xs text-secondary">{item.product.edition}</span>
                  </div>
                  <p className="text-sm font-semibold text-primary mt-1">
                    {item.product.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-primary">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                  <p className="text-[11px] text-secondary">Qty: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Secure Vault Callout */}
        <div className="bg-emerald-500/[0.06] border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3.5">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-emerald-300">Protected Digital Vault</p>
            <p className="text-emerald-200/70 leading-relaxed">
              Your sensitive credentials are encrypted and stored in your private delivery vault. Click &ldquo;View Order & Credentials&rdquo; below to access the secure reveal screen.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Link
            href={`/dashboard/orders/${order.id}`}
            className="flex items-center justify-center gap-2 py-3 px-5 bg-peri-500 hover:bg-peri-600 text-white font-semibold text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(115,123,234,0.4)] active:scale-95 uppercase tracking-wide"
          >
            <Package className="w-4 h-4" />
            View Credentials
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 py-3 px-5 bg-soft hover:bg-accent-soft border border-card-border text-xs font-semibold text-primary rounded-xl transition-colors uppercase tracking-wide"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
