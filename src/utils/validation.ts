/**
 * CueDesk Input Validation & Sanitization Utility
 * Provides robust validation and sanitization for all user inputs.
 */

export function sanitizeString(input: string, maxLength: number = 250): string {
  if (!input) return '';
  // Remove HTML tags and script elements
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
  
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  return sanitized;
}

export function validatePhone(phone?: string): { isValid: boolean; sanitized: string; error?: string } {
  if (!phone) {
    return { isValid: true, sanitized: '' };
  }
  const cleaned = phone.replace(/[^\d+()\s-]/g, '').trim();
  const digitsOnly = cleaned.replace(/\D/g, '');
  
  if (digitsOnly.length > 0 && (digitsOnly.length < 7 || digitsOnly.length > 15)) {
    return { isValid: false, sanitized: cleaned, error: 'Phone number must be between 7 and 15 digits' };
  }
  return { isValid: true, sanitized: cleaned };
}

export function validatePrice(price: number): { isValid: boolean; error?: string } {
  if (typeof price !== 'number' || isNaN(price)) {
    return { isValid: false, error: 'Price must be a valid number' };
  }
  if (price < 0) {
    return { isValid: false, error: 'Price cannot be negative' };
  }
  if (price > 1000000) {
    return { isValid: false, error: 'Price exceeds maximum allowable limit' };
  }
  return { isValid: true };
}

export function validateStockQuantity(qty: number): { isValid: boolean; error?: string } {
  if (typeof qty !== 'number' || isNaN(qty) || !Number.isInteger(qty)) {
    return { isValid: false, error: 'Stock quantity must be a whole integer' };
  }
  if (qty < 0) {
    return { isValid: false, error: 'Stock quantity cannot be negative' };
  }
  return { isValid: true };
}

export function validateCustomerName(name: string): { isValid: boolean; sanitized: string; error?: string } {
  const sanitized = sanitizeString(name, 80);
  if (!sanitized) {
    return { isValid: false, sanitized: '', error: 'Customer name is required' };
  }
  if (sanitized.length < 2) {
    return { isValid: false, sanitized, error: 'Customer name must be at least 2 characters' };
  }
  return { isValid: true, sanitized };
}

export function validateTableNumber(num: number): { isValid: boolean; error?: string } {
  if (typeof num !== 'number' || isNaN(num) || num <= 0 || !Number.isInteger(num)) {
    return { isValid: false, error: 'Table number must be a positive integer' };
  }
  return { isValid: true };
}

export function validateDate(timestamp: number): { isValid: boolean; error?: string } {
  if (typeof timestamp !== 'number' || isNaN(timestamp) || timestamp <= 0) {
    return { isValid: false, error: 'Invalid timestamp date' };
  }
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid date format' };
  }
  return { isValid: true };
}
