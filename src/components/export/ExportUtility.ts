import { SessionHistoryItem, ExpenseRecord, MenuItem, TopCustomer, EmployeeUser } from '../../types';

export const exportReportToCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const csvRows = [
    headers.join(','),
    ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
  ];

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportRevenueReportCSV = (history: SessionHistoryItem[]) => {
  const headers = ['Receipt No', 'Date', 'Table', 'Customer', 'Duration (min)', 'Table Fee', 'Food Fee', 'Tax', 'Discount', 'Grand Total', 'Payment Method', 'Status'];
  const rows = history.map(h => [
    h.receiptNo,
    h.timestamp,
    h.tableName,
    h.customerName,
    Math.round(h.durationSeconds / 60),
    h.tableFee.toFixed(2),
    h.foodFee.toFixed(2),
    h.taxAmount.toFixed(2),
    h.discountAmount.toFixed(2),
    h.grandTotal.toFixed(2),
    h.paymentMethod.toUpperCase(),
    h.paymentStatus.toUpperCase()
  ]);
  exportReportToCSV('revenue_report', headers, rows);
};

export const exportExpensesReportCSV = (expenses: ExpenseRecord[]) => {
  const headers = ['Category', 'Amount', 'Date', 'Recorded By', 'Notes'];
  const rows = expenses.map(e => [
    e.category,
    e.amount.toFixed(2),
    e.date,
    e.recordedBy,
    e.notes || ''
  ]);
  exportReportToCSV('expenses_report', headers, rows);
};

export const exportInventoryReportCSV = (menuItems: MenuItem[]) => {
  const headers = ['Item Name', 'Category', 'Price', 'Cost Price', 'In Stock', 'Low Stock Threshold', 'Available'];
  const rows = menuItems.map(m => [
    m.name,
    m.category,
    m.price.toFixed(2),
    (m.costPrice || 0).toFixed(2),
    m.stockQuantity,
    m.lowStockThreshold || 5,
    m.available ? 'YES' : 'NO'
  ]);
  exportReportToCSV('inventory_report', headers, rows);
};

export const exportCustomersReportCSV = (customers: TopCustomer[]) => {
  const headers = ['Customer Name', 'Phone', 'Membership Status', 'Date Joined', 'Visits Count', 'Hours Played', 'Total Spend', 'Last Visit'];
  const rows = customers.map(c => [
    c.name,
    c.phone,
    c.membershipStatus || c.tier || 'Regular',
    c.dateJoined || 'N/A',
    c.sessionsCount || 0,
    c.totalHoursPlayed || 0,
    c.totalSpent.toFixed(2),
    c.lastVisit
  ]);
  exportReportToCSV('customer_report', headers, rows);
};

export const exportEmployeesReportCSV = (employees: EmployeeUser[]) => {
  const headers = ['Staff Name', 'Email', 'Phone', 'Role', 'Joining Date', 'Status'];
  const rows = employees.map(e => [
    e.name,
    e.email,
    e.phone,
    e.role.toUpperCase(),
    e.joiningDate,
    e.status.toUpperCase()
  ]);
  exportReportToCSV('employee_report', headers, rows);
};

export const triggerPrintReport = () => {
  window.print();
};
