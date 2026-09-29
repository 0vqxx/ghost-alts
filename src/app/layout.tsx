import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { getSession } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Ghost Alts — Find Your Next Minecraft Account',
  description:
    'Explore Minecraft accounts, rare capes, and server ranks. Compare account access and find your next main at Ghost Alts.',
  icons: {
    icon: '/logo.png',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  let totalSpent = 0;
  if (session?.id) {
    try {
      const { db, withDbTimeout } = await import('@/lib/db');
      const orders = await withDbTimeout(
        db.order.findMany({
          where: {
            userId: session.id,
            status: { in: ['COMPLETED', 'DELIVERED', 'PAID'] },
          },
          select: { totalAmount: true },
        }),
        [],
        250
      );
      totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    } catch {}
  }

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('ghostalts_theme');
                if (theme === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                }
              } catch (_) {
                document.documentElement.classList.add('dark');
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <ThemeProvider>
          <CartProvider>
            <Navbar initialUser={session} totalSpent={totalSpent} />
            <main className="flex-1">{children}</main>
            <CartDrawer />
            <Footer />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
