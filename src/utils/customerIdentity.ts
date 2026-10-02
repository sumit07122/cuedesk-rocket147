/**
 * One Shot Gaming Club — Standardized Customer & Identity Normalization
 */

export const createCustomerIdentity = (): { id: string; customerNumber: string } => {
  const shortNum = Math.floor(1000 + Math.random() * 9000);
  const token = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}`.toUpperCase();
  
  const id = `osg_cust_${token.toLowerCase()}`;
  const customerNumber = `OSG-CUST-${shortNum}`;

  return { id, customerNumber };
};

/** Keep customer records identifiable with clean ERP formatting. */
export const getCustomerNumber = (customer: { customerNumber?: string; id: string }): string => {
  if (customer.customerNumber && customer.customerNumber.startsWith('OSG-CUST-')) {
    return customer.customerNumber;
  }
  if (customer.customerNumber) {
    return customer.customerNumber;
  }
  const suffix = customer.id.replace(/^(osg_cust_|cust-)/i, '').slice(0, 5).toUpperCase();
  return `OSG-CUST-${suffix || '1001'}`;
};

/** Normalizes phone number into standard 10-digit format for India. */
export const normalizePhoneNumber = (phone: string): string => {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits;
};
