import { SessionHistoryItem, TopCustomer, MenuItem, ExpenseRecord } from '../types';
import { formatCurrency } from './formatters';

/**
 * Downloads a string payload as a CSV file compatible with Excel, Google Sheets, and LibreOffice.
 */
export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Convert an array of objects to CSV format string
 */
function objectsToCSV(headers: string[], rows: (string | number)[][]): string {
  const headerRow = headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',');
  const bodyRows = rows.map(row => 
    row.map(val => {
      const strVal = val !== undefined && val !== null ? String(val) : '';
      return `"${strVal.replace(/"/g, '""')}"`;
    }).join(',')
  ).join('\n');

  return `${headerRow}\n${bodyRows}`;
}

/**
 * Export Session History / Sales Records to Excel (.csv)
 */
export function exportSalesToExcel(history: SessionHistoryItem[], clubName: string = 'One Shot Snooker Gaming Club'): void {
  const headers = [
    'Receipt No',
    'Date & Time',
    'Table Name',
    'Customer Name',
    'Customer Phone',
    'Member VIP',
    'Duration (Mins)',
    'Table Fee (INR)',
    'Food Fee (INR)',
    'Extra Fee (INR)',
    'Discount (INR)',
    'Grand Total (INR)',
    'Payment Method',
    'Payment Status',
    'Processed By'
  ];

  const rows = history.map(item => [
    item.receiptNo || item.id,
    new Date(item.endTime || item.startTime).toLocaleString(),
    item.tableName,
    item.customerName || 'Walk-in Guest',
    item.customerPhone || 'N/A',
    (item as any).isMember ? 'Yes' : 'No',
    Math.round(item.durationSeconds / 60),
    item.tableFee.toFixed(2),
    item.foodFee.toFixed(2),
    item.extraFee ? item.extraFee.toFixed(2) : '0.00',
    item.discountAmount.toFixed(2),
    item.grandTotal.toFixed(2),
    (item.paymentMethod || 'cash').toUpperCase(),
    (item.paymentStatus || 'paid').toUpperCase(),
    item.processedBy || 'Cashier'
  ]);

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${clubName.replace(/\s+/g, '_')}_Sales_Export_${dateStr}.csv`;
  const csvContent = objectsToCSV(headers, rows);
  downloadCSV(filename, csvContent);
}

/**
 * Export Customer Credit Ledger / Udhaar Records to Excel (.csv)
 */
export function exportCreditLedgerToExcel(customers: TopCustomer[], clubName: string = 'One Shot Snooker Gaming Club'): void {
  const headers = [
    'Customer Name',
    'Phone Number',
    'Membership Tier',
    'Outstanding Credit Dues (INR)',
    'Prepaid Deposit Balance (INR)',
    'Total Lifetime Spend (INR)',
    'Total Visits / Sessions',
    'Last Visit Date'
  ];

  const rows = customers.map(c => [
    c.name,
    c.phone || 'N/A',
    (c.membershipStatus || c.tier || 'Silver').toUpperCase(),
    (c.outstandingDue || 0).toFixed(2),
    ((c as any).depositBalance || 0).toFixed(2),
    c.totalSpent.toFixed(2),
    c.sessionsCount,
    c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : 'N/A'
  ]);

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${clubName.replace(/\s+/g, '_')}_Player_Credit_Ledger_${dateStr}.csv`;
  const csvContent = objectsToCSV(headers, rows);
  downloadCSV(filename, csvContent);
}

/**
 * Export Food & Drink Menu Inventory to Excel (.csv)
 */
export function exportInventoryToExcel(menuItems: MenuItem[], clubName: string = 'One Shot Snooker Gaming Club'): void {
  const headers = [
    'Item Name',
    'Category',
    'Price (INR)',
    'Current Stock',
    'Availability Status'
  ];

  const rows = menuItems.map(item => [
    item.name,
    item.category.toUpperCase(),
    item.price.toFixed(2),
    item.stockQuantity !== undefined ? item.stockQuantity : 'Unlimited',
    item.available ? 'In Stock' : 'Out of Stock'
  ]);

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${clubName.replace(/\s+/g, '_')}_Inventory_Catalog_${dateStr}.csv`;
  const csvContent = objectsToCSV(headers, rows);
  downloadCSV(filename, csvContent);
}

export const exportCustomerCreditLedgerCSV = exportCreditLedgerToExcel;
export const exportBillingHistoryCSV = exportSalesToExcel;
export const exportInventoryCSV = exportInventoryToExcel;

