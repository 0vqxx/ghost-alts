import React from 'react';
import { AdminDropsManager } from '@/components/admin/AdminDropsManager';

export const dynamic = 'force-dynamic';

export default function AdminDropsPage() {
  return (
    <div className="space-y-6">
      <AdminDropsManager />
    </div>
  );
}
