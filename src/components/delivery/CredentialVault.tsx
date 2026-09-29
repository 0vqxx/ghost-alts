'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
  MessageSquare,
  KeyRound,
  Download,
} from 'lucide-react';

interface DeliveryItem {
  id: string;
  productName: string;
  productType: string;
  edition: string;
  deliveredAt: string;
  revealedAt?: string | null;
}

interface CredentialVaultProps {
  orderId: string;
  orderNumber: string;
  initialDeliveries: DeliveryItem[];
  userEmail: string;
}

export function CredentialVault({
  orderId,
  orderNumber,
  initialDeliveries,
  userEmail,
}: CredentialVaultProps) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [revealedData, setRevealedData] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleOpenConfirm = () => {
    setIsConfirmModalOpen(true);
  };

  const handleConfirmReveal = async () => {
    setIsConfirmModalOpen(false);
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/orders/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reveal credentials');
      }

      setRevealedData(data.deliveries || []);
      setIsRevealed(true);
    } catch (err: any) {
      setError(err.message || 'Error communicating with security vault');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadReceipt = () => {
    const textContent = `GHOST ALTS — ORDER RECEIPT
Order Number: ${orderNumber}
Date: ${new Date().toISOString()}
Email: ${userEmail}
Status: DELIVERED

Thank you for choosing Ghost Alts. For support or replacement inquiries, visit:
https://ghostalts.com/support
`;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GhostAlts-Receipt-${orderNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 font-mono text-primary">
      {/* Top Banner and Download Receipt */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-soft border border-card-border rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-primary">Encrypted Digital Delivery Vault</h3>
            <p className="text-xs text-secondary">
              Protected delivery session. Sensitive values are never cached or indexed.
            </p>
          </div>
        </div>

        <button
          onClick={downloadReceipt}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface hover:bg-white/10 border border-card-border text-xs font-semibold text-primary rounded-xl transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-purple-400" />
          Download Receipt
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Vault Card Section */}
      <div className="bg-surface border border-card-border p-6 sm:p-8 space-y-6 rounded-3xl shadow-sm">
        {!isRevealed ? (
          <div className="py-8 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400 shadow-md shadow-purple-500/20">
              <KeyRound className="w-7 h-7" />
            </div>

            <div>
              <h4 className="text-base font-bold text-primary">
                Credentials Locked For Security
              </h4>
              <p className="text-xs text-secondary mt-1 leading-relaxed">
                To protect your credentials, click below to confirm ownership and decrypt the access details for Order <span className="font-mono font-bold text-primary">{orderNumber}</span>.
              </p>
            </div>

            <button
              onClick={handleOpenConfirm}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-purple-500/20 active:scale-95 disabled:opacity-50 uppercase tracking-wide cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              {loading ? 'Decrypting Details...' : 'Reveal Account Details'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-card-border">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <Check className="w-4 h-4" />
                <span>Credentials Decrypted & Audited</span>
              </div>
              <span className="text-[11px] text-secondary">
                Revealed at {new Date().toLocaleTimeString()}
              </span>
            </div>

            {/* Revealed Accounts List */}
            <div className="space-y-4">
              {revealedData.map((item, idx) => (
                <div
                  key={item.deliveryId || idx}
                  className="bg-soft border border-card-border rounded-2xl p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase border ${item.productType === 'MCFA' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-purple-500/10 border-purple-500/30 text-purple-400'}`}>
                        {item.productType}
                      </span>
                      <h4 className="text-sm font-bold text-primary mt-1">
                        {item.productName}
                      </h4>
                      <p className="text-xs text-secondary">{item.edition}</p>
                    </div>

                    <button
                      onClick={() => copyToClipboard(item.accountIdentifier, item.deliveryId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-white/10 border border-card-border text-xs font-semibold text-primary rounded-lg transition-colors cursor-pointer"
                    >
                      {copiedId === item.deliveryId ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-secondary" /> Copy Credentials
                        </>
                      )}
                    </button>
                  </div>

                  {/* Credentials Box */}
                  <div className="p-3.5 bg-surface border border-card-border rounded-xl font-mono text-xs text-emerald-400 font-bold break-all flex items-center justify-between shadow-inner">
                    <span>{item.accountIdentifier}</span>
                  </div>

                  {/* Instructions */}
                  <div className="text-xs text-primary/80 space-y-1">
                    <p className="font-bold text-primary">Login Instructions:</p>
                    <p className="leading-relaxed text-secondary font-sans">{item.instructions}</p>
                  </div>

                  {item.productType === 'MCFA' ? (
                    <div className="text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl leading-relaxed">
                      <strong>Security Recommendation:</strong> For MCFA accounts, please log into <a href="https://account.microsoft.com" target="_blank" rel="noreferrer" className="underline font-bold text-primary">account.microsoft.com</a> right away to update the password and bind your personal email or 2-factor authentication.
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl leading-relaxed">
                      <strong>NFA Policy Reminder:</strong> Non-Full Access credentials must remain unchanged. Attempting email or recovery changes will trigger security lockouts.
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Support Callout */}
            <div className="pt-4 border-t border-card-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-secondary">Experiencing any issue logging in?</span>
              <Link
                href={`/support?orderId=${orderNumber}&category=Account+Issue`}
                className="text-purple-400 hover:text-primary flex items-center gap-1 font-semibold transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                Open Support Ticket for Order {orderNumber}
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setIsConfirmModalOpen(false)}
          />

          <div className="relative w-full max-w-md bg-surface border border-card-border rounded-3xl p-6 shadow-2xl space-y-5 animate-fadeIn z-10 font-mono text-primary">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-primary">
                  Confirm Account Reveal
                </h3>
                <p className="text-xs text-secondary">Security verification required</p>
              </div>
            </div>

            <p className="text-xs text-secondary leading-relaxed">
              Revealing your account details will log an access timestamp for Order <strong className="text-primary">{orderNumber}</strong>. Please ensure you are not sharing your screen.
            </p>

            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-soft border border-card-border cursor-pointer text-xs text-primary/80">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 accent-purple-600 cursor-pointer"
              />
              <span>
                I understand this will display sensitive credentials. I will keep them secure and adhere to the store policies.
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 bg-soft hover:bg-white/10 text-xs font-semibold text-secondary hover:text-primary rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReveal}
                disabled={!acknowledged}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-40 shadow-md shadow-purple-500/20 cursor-pointer"
              >
                Confirm & Reveal Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
