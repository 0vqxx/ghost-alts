import React from 'react';
import { requireUser } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import { User, Mail, Shield, Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardProfilePage() {
  const user = await requireUser();

  return (
    <div className="bg-surface border border-card-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm font-mono text-primary">
      <div className="pb-6 border-b border-card-border">
        <h2 className="text-xl font-bold text-primary">Account Profile</h2>
        <p className="text-xs text-secondary mt-0.5">
          View your registered personal identity and store role.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-soft border border-card-border rounded-2xl p-5 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-secondary">
            <User className="w-4 h-4 text-purple-400" />
            <span>Username</span>
          </div>
          <p className="text-base font-bold text-primary">@{user.username}</p>
        </div>

        <div className="bg-soft border border-card-border rounded-2xl p-5 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-secondary">
            <Mail className="w-4 h-4 text-purple-400" />
            <span>Email Address</span>
          </div>
          <p className="text-base font-bold text-primary">{user.email}</p>
        </div>

        <div className="bg-soft border border-card-border rounded-2xl p-5 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-secondary">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Account Role</span>
          </div>
          <p className="text-base font-bold text-emerald-400 uppercase">{user.role}</p>
        </div>

        <div className="bg-soft border border-card-border rounded-2xl p-5 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-secondary">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span>Authentication System</span>
          </div>
          <p className="text-base font-bold text-primary">Discord Single Sign-On (OAuth 2.0)</p>
        </div>
      </div>
    </div>
  );
}
