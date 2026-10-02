/** Generate a permanent club customer ID without implying a membership plan. */
export const createCustomerIdentity = (): { id: string; customerNumber: string } => {
  const token = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().replace(/-/g, '').toUpperCase()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`.toUpperCase();
  const id = `cust-${token}`;

  return { id, customerNumber: `OS-${token}` };
};

/** Keep legacy customer records identifiable until a permanent number is assigned. */
export const getCustomerNumber = (customer: { customerNumber?: string; id: string }): string =>
  customer.customerNumber || `OS-${customer.id.replace(/^cust-/i, '').toUpperCase()}`;
