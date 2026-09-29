import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

export function formatDate(date: string | Date | undefined): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function generateOrderNumber(): string {
  const randomPart = Math.floor(10000 + Math.random() * 90000);
  return `GA-${randomPart}`;
}

export function generateTicketNumber(): string {
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `TK-${randomPart}`;
}

export function maskCredential(str: string): string {
  if (!str) return '••••••••••••••••';
  if (str.length <= 8) return '••••••••';
  return str.substring(0, 4) + '••••••••••••' + str.substring(str.length - 4);
}

export function maskIGN(name: string | null | undefined): string {
  if (!name) return 'UN***N';
  const clean = name.trim();
  if (clean.length <= 2) return `${clean.toUpperCase()}***`;
  if (clean.length === 3) return `${clean[0].toUpperCase()}***${clean[2].toUpperCase()}`;
  if (clean.length === 4) return `${clean[0].toUpperCase()}***${clean[3].toUpperCase()}`;
  return `${clean.slice(0, 2).toUpperCase()}***${clean.slice(-1).toUpperCase()}`;
}

export function formatRelativeTime(date: string | Date | undefined): string {
  if (!date) return '2h ago';
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = Date.now();
  const diffMs = Math.max(0, now - d.getTime());
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export function safeJsonParse<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

export function getDiscordAvatar(user?: {
  discordAvatar?: string | null;
  avatar?: string | null;
  discordId?: string | null;
  username?: string | null;
} | null): string {
  if (!user) return 'https://cdn.discordapp.com/embed/avatars/0.png';

  if (user.discordAvatar && typeof user.discordAvatar === 'string' && user.discordAvatar.startsWith('http')) {
    return user.discordAvatar;
  }
  if (user.avatar && typeof user.avatar === 'string' && user.avatar.startsWith('http')) {
    return user.avatar;
  }

  if (user.discordId) {
    try {
      const idx = Number((BigInt(user.discordId) >> 22n) % 6n);
      return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
    } catch {
      return 'https://cdn.discordapp.com/embed/avatars/0.png';
    }
  }

  return 'https://cdn.discordapp.com/embed/avatars/0.png';
}
