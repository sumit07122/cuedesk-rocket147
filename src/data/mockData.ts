import { TableItem, MenuItem, SessionHistoryItem, TopCustomer, BusinessConfig, NotificationItem, MaintenanceRecord, ExpenseRecord, AttendanceRecord, EmployeeUser } from '../types';

export const initialBusinessConfig: BusinessConfig = {
  id: 'club-royal-cue',
  clubName: 'Rocket 147 Snooker & Pool Club',
  tagline: 'Premium Cue Sports & Snooker Experience',
  address: 'Level 2, Grand Arena Plaza, Metro Ave',
  phone: '+91 98765 43210',
  whatsappNumber: '+91 98765 43210',
  currencySymbol: '₹',
  currencyCode: 'INR',
  defaultHourlyRate: 180.00,
  minimumChargeMinutes: 30,
  upiId: 'rocket147@upi',
  upiName: 'Rocket 147 Snooker Club',
  receiptFooterMsg: 'Thank you for visiting Rocket 147! See you soon.',
  operatingHours: '10:00 AM – 11:00 PM',
  roundingRule: 'nearest_1',
  weekendRateMultiplier: 1.2,
  happyHourRateMultiplier: 0.8,
  peakHourStart: 18,
  peakHourEnd: 23,
  maxCashierDiscountPercent: 10,
  silverDiscountPercent: 5,
  goldDiscountPercent: 10,
  vipDiscountPercent: 15,
  maxCreditLimit: 2000,
};

export const initialMenuItems: MenuItem[] = [
  { id: 'm1', name: 'Cold Brew Coffee', category: 'tea_coffee', price: 150.00, costPrice: 60.00, stockQuantity: 50, lowStockThreshold: 5, available: true, displayOrder: 1, description: 'Single origin slow brew iced coffee' },
  { id: 'm2', name: 'Monster Energy Drink', category: 'cold_drinks', price: 160.00, costPrice: 110.00, stockQuantity: 40, lowStockThreshold: 5, available: true, displayOrder: 2, description: '500ml chilled can' },
  { id: 'm3', name: 'Artisan Iced Latte', category: 'tea_coffee', price: 180.00, costPrice: 70.00, stockQuantity: 50, lowStockThreshold: 5, available: true, displayOrder: 3, description: 'Creamy espresso blend with milk' },
  { id: 'm4', name: 'Sparkling Lemonade', category: 'cold_drinks', price: 120.00, costPrice: 40.00, stockQuantity: 50, lowStockThreshold: 5, available: true, displayOrder: 4, description: 'Freshly squeezed with mint' },
  { id: 'm5', name: 'Club House Sandwich', category: 'snacks', price: 240.00, costPrice: 90.00, stockQuantity: 30, lowStockThreshold: 3, available: true, displayOrder: 5, description: 'Triple decker smoked sandwich' },
  { id: 'm6', name: 'Truffle Fries Basket', category: 'snacks', price: 220.00, costPrice: 70.00, stockQuantity: 30, lowStockThreshold: 5, available: true, displayOrder: 6, description: 'Crispy fries tossed in parmesan truffle oil' },
  { id: 'm7', name: 'Loaded Nachos Supreme', category: 'snacks', price: 280.00, costPrice: 90.00, stockQuantity: 25, lowStockThreshold: 3, available: true, displayOrder: 7, description: 'Guacamole, jalapeños, melted cheddar cheese' },
  { id: 'm8', name: 'Cup Noodles (Spicy Ramen)', category: 'instant_food', price: 90.00, costPrice: 40.00, stockQuantity: 50, lowStockThreshold: 5, available: true, displayOrder: 8, description: 'Instant hot noodle cup' },
  { id: 'm9', name: 'Master Chalk (Box of 2)', category: 'accessories', price: 100.00, costPrice: 30.00, stockQuantity: 50, lowStockThreshold: 10, available: true, displayOrder: 9, description: 'Official blue cue tip chalk' },
];

export const initialTables: TableItem[] = [
  { id: 'tbl-1', number: 1, name: 'Snooker 01 — Tournament Standard', type: 'snooker', status: 'available', hourlyRate: 220.00 },
  { id: 'tbl-2', number: 2, name: 'Snooker 02 — Match Table', type: 'snooker', status: 'available', hourlyRate: 220.00 },
  { id: 'tbl-3', number: 3, name: 'Snooker 03 — VIP AC Private Suite', type: 'vip', status: 'available', hourlyRate: 320.00 },
  { id: 'tbl-4', number: 4, name: 'Pool 01 — Riley 9ft Classic', type: 'pool', status: 'available', hourlyRate: 180.00 },
  { id: 'tbl-5', number: 5, name: 'Pool 02 — Brunswick Gold Crown', type: 'pool', status: 'available', hourlyRate: 180.00 },
  { id: 'tbl-6', number: 6, name: 'Pool 03 — Dynamic 9ft Pro', type: 'pool', status: 'available', hourlyRate: 180.00 },
  { id: 'tbl-7', number: 7, name: 'Carom 01 — 3-Cushion Table', type: 'carom', status: 'available', hourlyRate: 200.00 },
];

export const initialSessionHistory: SessionHistoryItem[] = [];

export const initialTopCustomers: TopCustomer[] = [];

export const initialEmployees: EmployeeUser[] = [];

export const initialAttendance: AttendanceRecord[] = [];

export const initialExpenses: ExpenseRecord[] = [];

export const initialMaintenanceRecords: MaintenanceRecord[] = [];

export const initialNotifications: NotificationItem[] = [];

export const hourlyOccupancyData = [
  { time: '10 AM', occupied: 0, revenue: 0 },
  { time: '12 PM', occupied: 0, revenue: 0 },
  { time: '02 PM', occupied: 0, revenue: 0 },
  { time: '04 PM', occupied: 0, revenue: 0 },
  { time: '06 PM', occupied: 0, revenue: 0 },
  { time: '08 PM', occupied: 0, revenue: 0 },
  { time: '10 PM', occupied: 0, revenue: 0 },
];

export const categorySalesData = [
  { name: 'Table Hours', value: 0, color: '#000000' },
  { name: 'Beverages', value: 0, color: '#525252' },
  { name: 'Snacks & Food', value: 0, color: '#A3A3A3' },
  { name: 'Accessories', value: 0, color: '#D4D4D4' },
];

export const weeklyRevenueData = [
  { day: 'Mon', revenue: 0 },
  { day: 'Tue', revenue: 0 },
  { day: 'Wed', revenue: 0 },
  { day: 'Thu', revenue: 0 },
  { day: 'Fri', revenue: 0 },
  { day: 'Sat', revenue: 0 },
  { day: 'Sun', revenue: 0 },
];

export const paymentMethodsData = [
  { name: 'UPI / QR', value: 0, color: '#171717' },
  { name: 'Cash', value: 0, color: '#525252' },
  { name: 'Credit Card', value: 0, color: '#A3A3A3' },
];
