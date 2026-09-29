import { getCatalog } from '@/lib/catalog';
import { StoreCatalog } from '@/components/store/StoreCatalog';

export const metadata = { title: 'MCFA Accounts — Ghost Alts' };
export const revalidate = 30;

export default async function McfaCategoryPage() {
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
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">MCFA Accounts</h1>
          <p className="text-white/55 mt-1.5 text-sm">
            Full email & password access accounts with instant automated delivery.
          </p>
        </header>

        <StoreCatalog initialProducts={products} initialType="MCFA" />
      </main>
    </div>
  );
}
