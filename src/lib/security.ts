// Security and rate limiting utilities

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * Basic memory-based sliding window rate limiter
 * Allows maxRequests within windowMs per identifier (IP or userId)
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 5,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number; resetInSec: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1, resetInSec: Math.ceil(windowMs / 1000) };
  }

  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetInSec: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetInSec: Math.ceil((record.resetAt - now) / 1000),
  };
}

/**
 * Format credentials safely for purchaser display:
 * In Ghost Alts demo mode, credentials represent synthetic test licenses
 * formatted as:
 * Username: Ghost_<id>
 * Type: MCFA / NFA
 * Access Token / License Key: GA-SEC-XXXX-XXXX
 */
export function formatPurchaseDelivery(
  productName: string,
  productType: string,
  sensitiveMasked: string,
  edition: string
) {
  return {
    productName,
    productType,
    edition,
    accountIdentifier: sensitiveMasked,
    deliveryMethod: 'Instant Digital Delivery',
    instructions:
      productType === 'MCFA'
        ? 'Login via the official Minecraft / Microsoft Launcher or microsoft.com/link. Full email access is included for this listing. Ensure you update security questions and recovery email immediately.'
        : 'Login using the provided access credentials directly in the official Minecraft launcher. Please note: Non-Full Access accounts do not permit email/password changes as stated in the product description.',
  };
}
