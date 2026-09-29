import fs from 'fs';
import path from 'path';
import { db, withDbTimeout } from './db';
import { CryptoSettingItem } from './types';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'crypto-settings.json');

const DEFAULT_SETTINGS: CryptoSettingItem[] = [
  {
    id: 'crypto-ltc',
    symbol: 'LTC',
    address: '',
    enabled: true,
    minConfirmations: 1,
  },
  {
    id: 'crypto-btc',
    symbol: 'BTC',
    address: '',
    enabled: true,
    minConfirmations: 1,
  },
];

function readLocalSettings(): CryptoSettingItem[] {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const content = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

function writeLocalSettings(settings: CryptoSettingItem[]) {
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Crypto Settings] Failed to write local fallback:', err);
  }
}

export async function getCryptoSettings(): Promise<CryptoSettingItem[]> {
  const local = readLocalSettings();

  // Try DB with short 400ms timeout
  try {
    const fromDb = await withDbTimeout(
      db.cryptoSetting.findMany(),
      [],
      400
    );

    if (fromDb && fromDb.length > 0) {
      // Sync local with DB
      const merged = local.map((l) => {
        const found = fromDb.find((d) => d.symbol === l.symbol);
        return found
          ? {
              id: found.id,
              symbol: found.symbol,
              address: found.address || l.address || '',
              enabled: found.enabled,
              minConfirmations: found.minConfirmations,
            }
          : l;
      });
      // Add any additional from DB
      for (const d of fromDb) {
        if (!merged.some((m) => m.symbol === d.symbol)) {
          merged.push({
            id: d.id,
            symbol: d.symbol,
            address: d.address || '',
            enabled: d.enabled,
            minConfirmations: d.minConfirmations,
          });
        }
      }
      writeLocalSettings(merged);
      return merged;
    }
  } catch {}

  return local;
}

export async function getCryptoSettingBySymbol(symbol: string): Promise<CryptoSettingItem | null> {
  const settings = await getCryptoSettings();
  const found = settings.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase());
  return found || null;
}

export async function saveCryptoSettings(
  items: Array<{ symbol: string; address: string; enabled: boolean; minConfirmations: number }>
): Promise<CryptoSettingItem[]> {
  const current = readLocalSettings();
  const updatedList: CryptoSettingItem[] = [];

  for (const item of items) {
    const sym = item.symbol.toUpperCase();
    const address = (item.address || '').trim();
    const enabled = Boolean(item.enabled);
    const minConfirmations = Math.max(1, parseInt(String(item.minConfirmations), 10) || 1);

    const existing = current.find((c) => c.symbol === sym);
    const updatedItem: CryptoSettingItem = {
      id: existing?.id || `crypto-${sym.toLowerCase()}`,
      symbol: sym,
      address,
      enabled,
      minConfirmations,
    };
    updatedList.push(updatedItem);

    // Also persist to DB in background / race
    try {
      withDbTimeout(
        db.cryptoSetting.upsert({
          where: { symbol: sym },
          update: { address, enabled, minConfirmations },
          create: { symbol: sym, address, enabled, minConfirmations },
        }),
        null,
        1500
      ).catch(() => {});
    } catch {}
  }

  writeLocalSettings(updatedList);
  return updatedList;
}
