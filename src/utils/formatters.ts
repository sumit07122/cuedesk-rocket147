import { SessionData, OrderItem, SessionHistoryItem } from '../types';

export function formatCurrency(amount: number, symbol: any = '₹'): string {
  let sym = '₹';
  if (typeof symbol === 'string') {
    sym = symbol;
  } else if (symbol && typeof symbol === 'object' && typeof symbol.currencySymbol === 'string') {
    sym = symbol.currencySymbol;
  }
  const safeNum = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return `${sym}${safeNum.toFixed(2)}`;
}

export function formatPerMinuteRate(hourlyRate: number, symbol: string = '₹'): string {
  const perMin = (hourlyRate || 0) / 60;
  return `${symbol}${perMin.toFixed(2)}/min`;
}

export function calculateSessionSeconds(session: SessionData, currentTime: number = Date.now()): number {
  if (!session) return 0;
  
  let endOrCurrent = currentTime;
  if (session.isPaused && session.pausedAt) {
    endOrCurrent = session.pausedAt;
  }
  
  const totalElapsedSeconds = Math.max(0, Math.floor((endOrCurrent - session.startTime) / 1000));
  const activeSeconds = Math.max(0, totalElapsedSeconds - (session.totalPausedSeconds || 0));
  return activeSeconds;
}

export function formatTimerString(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');
  
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

export function calculateTableFee(
  session: SessionData, 
  currentTime: number = Date.now(),
  roundingRule: 'none' | 'nearest_1' | 'nearest_5' | 'round_up' = 'none'
): number {
  const seconds = calculateSessionSeconds(session, currentTime);
  // Exact per-minute pricing
  const minutes = Math.ceil(seconds / 60);
  let fee = (minutes / 60) * session.hourlyRate;
  
  if (session.isMember && session.memberDiscountPercent) {
    fee = fee * (1 - session.memberDiscountPercent / 100);
  }
  
  return Math.max(0, fee);
}

export function applyRounding(amount: number, rule: 'none' | 'nearest_1' | 'nearest_5' | 'round_up' = 'none'): number {
  if (rule === 'nearest_1') {
    return Math.round(amount);
  }
  if (rule === 'nearest_5') {
    return Math.round(amount / 5) * 5;
  }
  if (rule === 'round_up') {
    return Math.ceil(amount);
  }
  return Number(amount.toFixed(2));
}

export function calculateFoodTotal(orders: OrderItem[]): number {
  if (!orders || orders.length === 0) return 0;
  return orders.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

export function calculateBillTotals(
  session: SessionData,
  _taxRatePercent: number = 0,  // kept for backward compat but ignored
  _enableTax: boolean = false,  // kept for backward compat but ignored
  customDiscount: number = 0,
  currentTime: number = Date.now(),
  extraCharges: { id: string; name: string; amount: number }[] = [],
  roundingRule: 'none' | 'nearest_1' | 'nearest_5' | 'round_up' = 'none'
) {
  const tableFee = calculateTableFee(session, currentTime);
  const foodFee = calculateFoodTotal(session.foodOrders);
  const extraFee = extraCharges.reduce((sum, c) => sum + (c.amount || 0), 0);
  
  const subtotal = tableFee + foodFee + extraFee;
  const discountAmount = Math.min(customDiscount, subtotal);
  const grandTotal = applyRounding(Math.max(0, subtotal - discountAmount), roundingRule);
  
  return {
    tableFee,
    foodFee,
    extraFee,
    subtotal,
    discountAmount,
    taxableAmount: Math.max(0, subtotal - discountAmount),
    taxAmount: 0,  // always 0 — no tax
    grandTotal
  };
}

/**
 * Safely resolves the Date object of a SessionHistoryItem or any session object.
 * Robust against numeric millisecond timestamps, ISO date strings, and Indian locale strings (e.g. "13/09/2026, 03:25 pm").
 */
export function getSessionDate(item?: Partial<SessionHistoryItem> | null): Date {
  if (!item) return new Date();

  // 1. Prefer numeric timestamps (endTime or startTime)
  const numericTime = item.endTime || item.startTime;
  if (typeof numericTime === 'number' && !isNaN(numericTime) && numericTime > 0) {
    return new Date(numericTime);
  }

  // 2. Parse string timestamp if available
  if (item.timestamp && typeof item.timestamp === 'string') {
    // Standard ISO or standard string parse
    const standardParsed = Date.parse(item.timestamp);
    if (!isNaN(standardParsed)) {
      return new Date(standardParsed);
    }

    // Handle DD/MM/YYYY or DD-MM-YYYY (e.g. 13/09/2026, 03:25 pm)
    const dmyMatch = item.timestamp.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:[,\s]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?)?/i);
    if (dmyMatch) {
      const [, d, m, y, hours, mins, secs, ampm] = dmyMatch;
      let hourNum = hours ? parseInt(hours, 10) : 0;
      const minNum = mins ? parseInt(mins, 10) : 0;
      const secNum = secs ? parseInt(secs, 10) : 0;
      if (ampm) {
        if (ampm.toLowerCase() === 'pm' && hourNum < 12) hourNum += 12;
        if (ampm.toLowerCase() === 'am' && hourNum === 12) hourNum = 0;
      }
      const parsedDate = new Date(Number(y), Number(m) - 1, Number(d), hourNum, minNum, secNum);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
  }

  return new Date();
}
