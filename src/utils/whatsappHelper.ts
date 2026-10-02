// WhatsApp utility helpers for phone normalization and URL formatting

/**
 * Normalizes a phone number for WhatsApp messaging.
 * Strips non-digits, leading zeroes, and prepends '91' for 10-digit Indian mobile numbers.
 */
export const normalizeWhatsAppPhone = (phone: string): string => {
  let cleaned = (phone || '').replace(/[^0-9]/g, '');
  cleaned = cleaned.replace(/^0+/, '');
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
};

/**
 * Generates a wa.me URL with prefilled text message.
 */
export const createWhatsAppUrl = (phone: string, message: string): string => {
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
};
