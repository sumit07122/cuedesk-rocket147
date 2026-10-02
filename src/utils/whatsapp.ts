/**
 * One Shot Gaming Club — Dedicated WhatsApp Messaging & Automation Engine
 */

export const normalizeWhatsAppPhone = (phone: string): string => {
  let cleaned = (phone || '').replace(/[^0-9]/g, '');
  if (!cleaned) return '';
  
  // Standard 10-digit Indian mobile number
  if (cleaned.length === 10) {
    return '91' + cleaned;
  }
  // Leading 0 + 10 digits
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return '91' + cleaned.slice(1);
  }
  return cleaned;
};

export interface WhatsAppPaymentReceiptParams {
  customerName: string;
  phone: string;
  amountPaid: number;
  paymentMethod: string;
  receiptNo?: string;
  tableName?: string;
  durationText?: string;
  tableFee?: number;
  foodFee?: number;
  discountAmount?: number;
  remainingDue?: number;
  clubName?: string;
  upiId?: string;
}

export const createPaymentDoneWhatsAppMessage = (params: WhatsAppPaymentReceiptParams): string => {
  const club = params.clubName || 'One Shot Gaming Club';
  const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  let text = `🎱 *${club.toUpperCase()}* 🎱\n`;
  text += `*Official Payment Receipt*\n\n`;
  text += `Hello *${params.customerName}*,\n`;
  text += `Thank you for your visit today! We have received your payment of *₹${params.amountPaid.toFixed(0)}* via *${(params.paymentMethod || 'UPI').toUpperCase()}*.\n\n`;

  text += `📝 *Summary of Transaction:*\n`;
  if (params.receiptNo) text += `• Receipt ID: \`${params.receiptNo}\`\n`;
  text += `• Date & Time: ${dateStr}, ${timeStr}\n`;
  if (params.tableName) text += `• Table / Court: ${params.tableName}\n`;
  if (params.durationText) text += `• Session Time: ${params.durationText}\n`;
  if (params.tableFee && params.tableFee > 0) text += `• Table Fee: ₹${params.tableFee.toFixed(0)}\n`;
  if (params.foodFee && params.foodFee > 0) text += `• Café & Snacks: ₹${params.foodFee.toFixed(0)}\n`;
  if (params.discountAmount && params.discountAmount > 0) text += `• Discount Applied: -₹${params.discountAmount.toFixed(0)}\n`;
  text += `• *Total Paid: ₹${params.amountPaid.toFixed(0)}*\n\n`;

  if (params.remainingDue && params.remainingDue > 0) {
    text += `⚠️ *Outstanding Balance:* ₹${params.remainingDue.toFixed(0)}\n`;
    if (params.upiId) text += `📲 *UPI ID:* \`${params.upiId}\`\n\n`;
  } else {
    text += `✅ *Account Status:* All dues cleared.\n\n`;
  }

  text += `We look forward to seeing you again on the tables!\n`;
  text += `— Team *${club}*`;

  return text;
};

export interface WhatsAppDueReminderParams {
  customerName: string;
  phone: string;
  outstandingDue: number;
  clubName?: string;
  currencySymbol?: string;
  upiId?: string;
  tone?: 'gentle' | 'standard' | 'urgent';
}

export const createDueReminderWhatsAppMessage = (params: WhatsAppDueReminderParams): string => {
  const club = params.clubName || 'One Shot Gaming Club';
  const curr = params.currencySymbol || '₹';
  const due = (params.outstandingDue || 0).toFixed(0);
  const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const tone = params.tone || 'standard';

  if (tone === 'gentle') {
    return (
      `🎱 *${club}*\n\n` +
      `Hello ${params.customerName}! Hope you enjoyed your session today. 🎱\n\n` +
      `This is a gentle update regarding your outstanding balance of *${curr}${due}* as of ${dateStr}.\n\n` +
      (params.upiId ? `📲 *UPI Payment ID:* \`${params.upiId}\`\n\n` : '') +
      `Whenever you visit next or find time, you can clear it. We look forward to seeing you back on the tables!`
    );
  }

  if (tone === 'urgent') {
    return (
      `⚠️ *PAYMENT NOTICE: ${club}*\n\n` +
      `Dear ${params.customerName},\n` +
      `Your credit tab has reached *${curr}${due}* (as of ${dateStr}) and requires immediate settlement.\n\n` +
      `Kindly clear the pending amount today to maintain your active player credit line.\n\n` +
      (params.upiId ? `📲 *Pay via UPI:* \`${params.upiId}\`\n\n` : '') +
      `If already paid, please share the payment screenshot. Thank you!\n` +
      `— Management, ${club}`
    );
  }

  return (
    `🎱 *${club} — Payment Reminder*\n\n` +
    `Hello ${params.customerName},\n` +
    `You have a pending credit balance of *${curr}${due}* as of ${dateStr}.\n\n` +
    `Kindly clear this at your earliest convenience.\n\n` +
    (params.upiId ? `📲 *UPI ID for Payment:* \`${params.upiId}\`\n\n` : '') +
    `Thank you for playing with us!\n` +
    `— Team *${club}*`
  );
};

export interface WhatsAppStatementParams {
  customerName: string;
  phone: string;
  sessionsCount?: number;
  totalHoursPlayed?: number;
  totalSpent?: number;
  outstandingDue?: number;
  membershipStatus?: string;
  clubName?: string;
  currencySymbol?: string;
  upiId?: string;
}

export const createStatementWhatsAppMessage = (params: WhatsAppStatementParams): string => {
  const club = params.clubName || 'One Shot Gaming Club';
  const curr = params.currencySymbol || '₹';
  const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    `📊 *${club.toUpperCase()} — MEMBER STATEMENT* 📊\n` +
    `Date: ${dateStr}\n\n` +
    `Customer: *${params.customerName}*\n` +
    (params.membershipStatus ? `Tier: *${params.membershipStatus} Member*\n` : '') +
    `Total Visits / Sessions: *${params.sessionsCount || 0}*\n` +
    `Total Hours Played: *${params.totalHoursPlayed || 0} hrs*\n` +
    `Total Lifetime Spend: *${curr}${(params.totalSpent || 0).toFixed(0)}*\n` +
    `----------------------------\n` +
    `*Current Balance Due:* *${curr}${(params.outstandingDue || 0).toFixed(0)}*\n` +
    `----------------------------\n\n` +
    (params.outstandingDue && params.outstandingDue > 0 && params.upiId
      ? `📲 *UPI Payment ID:* \`${params.upiId}\`\n\n`
      : '') +
    `Thank you for being a valued member of *${club}*!`
  );
};

export const openWhatsApp = (phone: string, message: string): boolean => {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) {
    alert('Please enter a valid mobile number for this customer first.');
    return false;
  }
  const url = `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
};
