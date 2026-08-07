/**
 * CueDesk Rate Limiter Utility
 * Sliding window rate limiting for sensitive user actions (login, QR, payments)
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore: Record<string, RateLimitRecord> = {};

/**
 * Checks if an action is within allowed rate limits.
 * @param actionKey Unique identifier for the action (e.g. 'login_127.0.0.1', 'qr_table_01')
 * @param maxRequests Maximum allowed requests in window
 * @param windowMs Time window in milliseconds
 * @returns { allowed: boolean; remaining: number; retryAfterSec?: number }
 */
export function checkRateLimit(
  actionKey: string,
  maxRequests: number = 5,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; retryAfterSec?: number } {
  const now = Date.now();
  
  // Clean up old entries in local store
  if (!rateLimitStore[actionKey]) {
    rateLimitStore[actionKey] = { timestamps: [] };
  }
  
  const record = rateLimitStore[actionKey];
  // Filter out timestamps outside the current window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0];
    const retryAfterSec = Math.ceil((windowMs - (now - oldest)) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, retryAfterSec)
    };
  }

  // Record current request
  record.timestamps.push(now);
  
  // Also persist in localStorage for multi-tab durability
  try {
    const lsKey = `cuedesk_ratelimit_${actionKey}`;
    localStorage.setItem(lsKey, JSON.stringify(record.timestamps));
  } catch (e) {
    // Ignore storage quota errors
  }

  return {
    allowed: true,
    remaining: maxRequests - record.timestamps.length
  };
}

export const RATE_LIMIT_CONFIGS = {
  LOGIN: { max: 5, windowMs: 60 * 1000, name: 'Login attempts' },
  QR_SESSION_REQ: { max: 3, windowMs: 5 * 60 * 1000, name: 'QR Session Requests' },
  QR_FOOD_ORDER: { max: 5, windowMs: 2 * 60 * 1000, name: 'Food Orders' },
  PAYMENT_PROCESS: { max: 5, windowMs: 60 * 1000, name: 'Payment Transactions' },
  BOOKING_REQ: { max: 5, windowMs: 2 * 60 * 1000, name: 'Booking Requests' }
};
