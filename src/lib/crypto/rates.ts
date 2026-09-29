interface CachedRate {
  usdPrice: number;
  updatedAt: number;
}

const rateCache: { [symbol: string]: CachedRate } = {};
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

export async function getCryptoPriceUSD(symbol: 'BTC' | 'LTC'): Promise<number> {
  const sym = symbol.toUpperCase();
  const cached = rateCache[sym];
  const now = Date.now();

  if (cached && now - cached.updatedAt < CACHE_TTL_MS) {
    return cached.usdPrice;
  }

  // 1. Try Binance API
  try {
    const pair = sym === 'BTC' ? 'BTCUSDT' : 'LTCUSDT';
    const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${pair}`, {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      const price = parseFloat(data.price);
      if (price > 0) {
        rateCache[sym] = { usdPrice: price, updatedAt: now };
        return price;
      }
    }
  } catch (err) {
    console.warn(`[CryptoRates] Binance rate fetch failed for ${sym}:`, err);
  }

  // 2. Try Coinbase API
  try {
    const pair = sym === 'BTC' ? 'BTC-USD' : 'LTC-USD';
    const res = await fetch(`https://api.coinbase.com/v2/prices/${pair}/spot`, {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      const price = parseFloat(data.data?.amount);
      if (price > 0) {
        rateCache[sym] = { usdPrice: price, updatedAt: now };
        return price;
      }
    }
  } catch (err) {
    console.warn(`[CryptoRates] Coinbase rate fetch failed for ${sym}:`, err);
  }

  // 3. Try CoinGecko API
  try {
    const id = sym === 'BTC' ? 'bitcoin' : 'litecoin';
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`,
      {
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(4000),
      }
    );
    if (res.ok) {
      const data = await res.json();
      const price = parseFloat(data[id]?.usd);
      if (price > 0) {
        rateCache[sym] = { usdPrice: price, updatedAt: now };
        return price;
      }
    }
  } catch (err) {
    console.warn(`[CryptoRates] CoinGecko rate fetch failed for ${sym}:`, err);
  }

  // 4. Fallback default if all external APIs fail (prevents total checkout crash, but cached value preferred)
  if (cached) {
    return cached.usdPrice;
  }

  // Sensible safe fallback constants if completely offline/blocked
  const fallback = sym === 'BTC' ? 65000 : 70;
  rateCache[sym] = { usdPrice: fallback, updatedAt: now };
  return fallback;
}

export function calculateCryptoAmount(usdTotal: number, usdPricePerCrypto: number): number {
  if (usdPricePerCrypto <= 0) return 0;
  const raw = usdTotal / usdPricePerCrypto;
  // Round to 8 decimal places for crypto
  return parseFloat(raw.toFixed(8));
}
