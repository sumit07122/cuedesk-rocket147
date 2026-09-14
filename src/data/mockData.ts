import { TableItem, MenuItem, SessionHistoryItem, TopCustomer, BusinessConfig, NotificationItem, MaintenanceRecord, ExpenseRecord, AttendanceRecord, EmployeeUser } from '../types';

export const initialBusinessConfig: BusinessConfig = {
  id: 'club-royal-cue',
  clubName: 'One Shot Snooker Gaming Club',
  tagline: 'Premium Cue Sports & Gaming Arena',
  address: 'Level 2, Grand Arena Plaza, Metro Ave',
  phone: '+91 98765 43210',
  whatsappNumber: '+91 98765 43210',
  currencySymbol: '₹',
  currencyCode: 'INR',
  defaultHourlyRate: 180.00,
  minimumChargeMinutes: 30,
  upiId: 'oneshot@upi',
  upiName: 'One Shot Snooker Gaming Club',
  receiptFooterMsg: 'Thank you for visiting One Shot Snooker Gaming Club! See you soon.',
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
  { 
    id: 'tbl-1', 
    number: 1, 
    name: 'Snooker Table 01 — Match Star', 
    type: 'snooker', 
    status: 'available', 
    hourlyRate: 300.00, 
    perMinuteRate: 5.00 
  },
  { 
    id: 'tbl-2', 
    number: 2, 
    name: 'Snooker Table 02 — Riley Tournament', 
    type: 'snooker', 
    status: 'available', 
    hourlyRate: 260.00, 
    perMinuteRate: 4.33 
  },
  { 
    id: 'tbl-3', 
    number: 3, 
    name: 'Pool Table 01 — 9ft Classic', 
    type: 'pool', 
    status: 'available', 
    hourlyRate: 120.00, 
    perMinuteRate: 2.00 
  },
  { 
    id: 'tbl-4', 
    number: 4, 
    name: 'American Pool Table 02 — Brunswick Pro', 
    type: 'american_pool', 
    status: 'available', 
    hourlyRate: 120.00, 
    perMinuteRate: 2.00 
  },
  { 
    id: 'tbl-5', 
    number: 5, 
    name: 'Table Tennis 01 — Stiga Championship Court', 
    type: 'table_tennis', 
    status: 'available', 
    hourlyRate: 300.00, 
    perMinuteRate: 5.00 
  },
  { 
    id: 'tbl-6', 
    number: 6, 
    name: 'Snooker Table 03 — Star Championship Pro', 
    type: 'snooker', 
    status: 'available', 
    hourlyRate: 260.00, 
    perMinuteRate: 4.33 
  },
  { 
    id: 'tbl-7', 
    number: 7, 
    name: 'English Pool Table 02 — SuperLeague', 
    type: 'pool', 
    status: 'available', 
    hourlyRate: 150.00, 
    perMinuteRate: 2.50 
  },
  { 
    id: 'tbl-8', 
    number: 8, 
    name: 'Magnet Board Arena 01 — Air & Magnet Play', 
    type: 'magnet_table', 
    status: 'available', 
    hourlyRate: 180.00, 
    perMinuteRate: 3.00 
  },
];

const now = Date.now();

export const initialSessionHistory: SessionHistoryItem[] = [];

export const initialTopCustomers: TopCustomer[] = [];

export const initialEmployees: EmployeeUser[] = [
  {
    id: 'emp-1',
    clubId: 'club-royal-cue',
    name: 'One Shot Owner',
    email: 'owner@oneshotsnooker.com',
    phone: '+91 98765 43210',
    role: 'owner',
    joiningDate: '2025-01-01',
    status: 'active',
    lastActiveTime: now
  },
  {
    id: 'emp-2',
    clubId: 'club-royal-cue',
    name: 'Vikram Malhotra',
    email: 'manager@oneshotsnooker.com',
    phone: '+91 98111 55667',
    role: 'manager',
    joiningDate: '2025-06-15',
    status: 'active',
    lastActiveTime: now
  },
  {
    id: 'emp-3',
    clubId: 'club-royal-cue',
    name: 'Sunita Rao',
    email: 'cashier@oneshotsnooker.com',
    phone: '+91 98222 66778',
    role: 'cashier',
    joiningDate: '2025-08-01',
    status: 'active',
    lastActiveTime: now
  },
  {
    id: 'emp-4',
    clubId: 'club-royal-cue',
    name: 'Ramesh Kumar',
    email: 'kitchen@oneshotsnooker.com',
    phone: '+91 98333 77889',
    role: 'kitchen',
    joiningDate: '2025-09-10',
    status: 'active',
    lastActiveTime: now
  }
];

export const initialAttendance: AttendanceRecord[] = [];

export const initialExpenses: ExpenseRecord[] = [];

export const initialMaintenanceRecords: MaintenanceRecord[] = [];

export const initialNotifications: NotificationItem[] = [];

export const hourlyOccupancyData = [
  { time: '10 AM', occupied: 2, revenue: 480 },
  { time: '12 PM', occupied: 4, revenue: 920 },
  { time: '02 PM', occupied: 5, revenue: 1450 },
  { time: '04 PM', occupied: 6, revenue: 1800 },
  { time: '06 PM', occupied: 7, revenue: 2350 },
  { time: '08 PM', occupied: 8, revenue: 3100 },
  { time: '10 PM', occupied: 6, revenue: 2100 },
];

export const categorySalesData = [
  { name: 'Table Hours', value: 4850, color: '#000000' },
  { name: 'Beverages', value: 1680, color: '#404040' },
  { name: 'Snacks & Food', value: 2150, color: '#737373' },
  { name: 'Accessories', value: 450, color: '#a3a3a3' },
];

export const weeklyRevenueData = [
  { day: 'Mon', revenue: 6200 },
  { day: 'Tue', revenue: 7400 },
  { day: 'Wed', revenue: 8100 },
  { day: 'Thu', revenue: 8900 },
  { day: 'Fri', revenue: 12400 },
  { day: 'Sat', revenue: 16800 },
  { day: 'Sun', revenue: 15200 },
];

export const paymentMethodsData = [
  { name: 'UPI / QR', value: 58, color: '#171717' },
  { name: 'Cash', value: 26, color: '#525252' },
  { name: 'Credit Card', value: 16, color: '#A3A3A3' },
];
