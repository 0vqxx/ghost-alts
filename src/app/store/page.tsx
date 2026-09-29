import { getCatalog } from '@/lib/catalog';
import { StoreCatalog } from '@/components/store/StoreCatalog';

export const metadata = { title: 'Store — Ghost Alts' };
export const revalidate = 30;

export default async function StorePage() {
  const products = await getCatalog();

  return (
    <div
      className="min-h-screen text-white relative overflow-hidden flex flex-col"
      style={{
        background: 'radial-gradient(ellipse 75% 55% at 50% 20%, rgba(35, 20, 90, 0.45) 0%, transparent 65%), #07061a',
      }}
    >
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Accounts Shop</h1>
          <p className="text-white/55 mt-1.5 text-sm">
            Browse our live inventory of verified Minecraft accounts with instant delivery.
          </p>
        </header>

        {/* Store Catalog with Search, Filters, Tabs, and Real-Time Counters */}
        <StoreCatalog initialProducts={products} initialType="All" />
      </main>
    </div>
  );
}
