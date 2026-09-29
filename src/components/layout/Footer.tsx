import Link from 'next/link';

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/[0.06] bg-[#07061a] px-6 py-10 text-center text-xs text-white/40">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 font-extrabold tracking-tight text-white/70">
          <span className="text-[#737bea]">ghost</span>
          <span className="text-white">alts</span>
          <span className="text-white/30 font-normal">| ghostalts.shop</span>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-white/60">
          <Link href="/shop" className="hover:text-white transition-colors">Store</Link>
          <Link href="/shop?type=NFA" className="hover:text-white transition-colors">NFA Accounts</Link>
          <Link href="/shop?type=MCFA" className="hover:text-white transition-colors">MCFA Accounts</Link>
          <Link href="/free-nfa" className="hover:text-white transition-colors">Free Drops</Link>
          <Link href="/reviews" className="hover:text-white transition-colors">Reviews</Link>
          <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
          <Link href="/support" className="hover:text-white transition-colors">Support</Link>
          <Link href="/legal/terms" className="hover:text-white transition-colors">Terms</Link>
        </nav>

        <p className="text-[11px] text-white/30">
          Not affiliated with Mojang or Microsoft.
        </p>
      </div>
    </footer>
  );
}
