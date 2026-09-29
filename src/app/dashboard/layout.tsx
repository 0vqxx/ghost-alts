import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { DashboardNav } from '@/components/dashboard/DashboardNav';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login?redirect=/dashboard');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Sidebar Nav */}
        <aside className="md:col-span-3">
          <DashboardNav user={session} />
        </aside>

        {/* Main Content Area */}
        <div className="md:col-span-9">{children}</div>
      </div>
    </div>
  );
}
