import { TableItem, MenuItem, SessionHistoryItem, TopCustomer, BusinessConfig, NotificationItem, MaintenanceRecord, ExpenseRecord, AttendanceRecord, EmployeeUser } from '../types';

export const initialBusinessConfig: BusinessConfig = {
  id: 'club-royal-cue',
  clubName: 'One Shot Snooker Gaming Club',
  tagline: 'Premium Cue Sports & Gaming Club',
  address: 'Level 2, Grand Arena Plaza, Metro Ave',
  phone: '+91 98765 43210',
  whatsappNumber: '+91 98765 43210',
  currencySymbol: '₹',
  currencyCode: 'INR',
  defaultHourlyRate: 200.00,
  minimumChargeMinutes: 15,
  upiId: 'oneshot@upi',
  upiName: 'One Shot Snooker Gaming Club',
  receiptFooterMsg: 'Thank you for playing at One Shot Snooker Gaming Club! See you soon.',
  operatingHours: '10:00 AM – 11:30 PM',
  timeZone: 'Asia/Kolkata',
  roundingRule: 'nearest_1',
  weekendRateMultiplier: 1.2,
  happyHourRateMultiplier: 0.8,
  peakHourStart: 18,
  peakHourEnd: 23,
  maxCashierDiscountPercent: 10,
  maxCreditLimit: 3000,
};

export const initialMenuItems: MenuItem[] = [
  { id: 'm1', name: 'Kadak Masala Chai', category: 'tea_coffee', price: 50.00, costPrice: 15.00, stockQuantity: 100, lowStockThreshold: 10, available: true, displayOrder: 1, description: 'Fresh hot spiced milk tea' },
  { id: 'm2', name: 'Cold Coffee Frappe', category: 'cold_drinks', price: 140.00, costPrice: 50.00, stockQuantity: 40, lowStockThreshold: 5, available: true, displayOrder: 2, description: 'Chilled creamy blended coffee with chocolate drizzle' },
  { id: 'm3', name: 'Red Bull Energy Can (250ml)', category: 'cold_drinks', price: 160.00, costPrice: 110.00, stockQuantity: 35, lowStockThreshold: 5, available: true, displayOrder: 3, description: 'Original chilled energy drink' },
  { id: 'm4', name: 'Grilled Cheese Club Sandwich', category: 'snacks', price: 160.00, costPrice: 60.00, stockQuantity: 30, lowStockThreshold: 4, available: true, displayOrder: 4, description: 'Triple layered golden toasted sandwich' },
  { id: 'm5', name: 'Crispy Peri Peri Fries', category: 'snacks', price: 130.00, costPrice: 45.00, stockQuantity: 35, lowStockThreshold: 5, available: true, displayOrder: 5, description: 'Hot french fries dusted with spicy peri-peri' },
  { id: 'm6', name: 'Spicy Veg Maggi Noodles', category: 'instant_food', price: 80.00, costPrice: 25.00, stockQuantity: 50, lowStockThreshold: 8, available: true, displayOrder: 6, description: 'Classic 2-minute masala noodles with chopped herbs' },
  { id: 'm7', name: 'Double Egg Masala Maggi', category: 'instant_food', price: 100.00, costPrice: 35.00, stockQuantity: 40, lowStockThreshold: 8, available: true, displayOrder: 7, description: 'Maggi noodles tossed with scrambled spiced eggs' },
  { id: 'm8', name: 'Master Cue Tip Chalk (Box of 2)', category: 'accessories', price: 90.00, costPrice: 30.00, stockQuantity: 45, lowStockThreshold: 10, available: true, displayOrder: 8, description: 'Official high-friction blue cue chalk' },
];

export const initialTables: TableItem[] = [
  { 
    id: 'tbl-1', 
    number: 1, 
    name: 'Snooker Table 01 — Riley Match Star', 
    type: 'snooker', 
    status: 'available', 
    hourlyRate: 240.00, 
    perMinuteRate: 4.00 
  },
  { 
    id: 'tbl-2', 
    number: 2, 
    name: 'Snooker Table 02 — Century Tournament Pro', 
    type: 'snooker', 
    status: 'available', 
    hourlyRate: 240.00, 
    perMinuteRate: 4.00 
  },
  { 
    id: 'tbl-3', 
    number: 3, 
    name: 'Snooker Table 03 — Club Classic', 
    type: 'snooker', 
    status: 'available', 
    hourlyRate: 200.00, 
    perMinuteRate: 3.33 
  },
  { 
    id: 'tbl-4', 
    number: 4, 
    name: 'Pool Table 01 — 9ft English Pool', 
    type: 'pool', 
    status: 'available', 
    hourlyRate: 150.00, 
    perMinuteRate: 2.50 
  },
  { 
    id: 'tbl-5', 
    number: 5, 
    name: 'Pool Table 02 — American 9-Ball Pro', 
    type: 'american_pool', 
    status: 'available', 
    hourlyRate: 150.00, 
    perMinuteRate: 2.50 
  },
  { 
    id: 'tbl-6', 
    number: 6, 
    name: 'Table Tennis 01 — Stiga Pro Court', 
    type: 'table_tennis', 
    status: 'available', 
    hourlyRate: 120.00, 
    perMinuteRate: 2.00 
  },
];

const now = Date.now();

export const initialSessionHistory: SessionHistoryItem[] = [
  {
    id: 'hist-1',
    clubId: 'club-royal-cue',
    tableId: 'tbl-1',
    tableName: 'Snooker Table 01 — Riley Match Star',
    customerName: 'Rahul Sharma',
    customerPhone: '+91 98765 11223',
    startTime: now - 3600000 * 3,
    endTime: now - 3600000 * 2,
    durationSeconds: 3600,
    tableFee: 240,
    foodFee: 140,
    taxAmount: 0,
    discountAmount: 0,
    grandTotal: 380,
    amountPaid: 380,
    balanceDue: 0,
    paymentMethod: 'upi',
    paymentStatus: 'paid',
    receiptNo: 'REC-00101',
    timestamp: new Date(now - 3600000 * 2).toISOString(),
    foodOrders: [
      { id: 'o-1', menuId: 'm2', name: 'Cold Coffee Frappe', price: 140, quantity: 1, category: 'cold_drinks', addedAt: new Date(now - 3600000 * 2.5).toISOString() }
    ],
  },
  {
    id: 'hist-2',
    clubId: 'club-royal-cue',
    tableId: 'tbl-4',
    tableName: 'Pool Table 01 — 9ft English Pool',
    customerName: 'Amit Verma',
    customerPhone: '+91 98765 22334',
    startTime: now - 3600000 * 2,
    endTime: now - 3600000 * 1,
    durationSeconds: 3600,
    tableFee: 150,
    foodFee: 100,
    taxAmount: 0,
    discountAmount: 0,
    grandTotal: 250,
    amountPaid: 250,
    balanceDue: 0,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    receiptNo: 'REC-00102',
    timestamp: new Date(now - 3600000 * 1).toISOString(),
    foodOrders: [
      { id: 'o-2', menuId: 'm1', name: 'Kadak Masala Chai', price: 50, quantity: 2, category: 'tea_coffee', addedAt: new Date(now - 3600000 * 1.5).toISOString() }
    ],
  }
];

export const initialTopCustomers: TopCustomer[] = [
  {
    id: 'cust-1',
    clubId: 'club-royal-cue',
    customerNumber: 'CUST-001',
    name: 'Rahul Sharma',
    phone: '+91 98765 11223',
    totalSpent: 5400,
    sessionsCount: 18,
    totalHoursPlayed: 21,
    lastVisit: 'Today',
    customDiscountPercent: 10,
    membershipStatus: 'VIP',
    tier: 'platinum',
    outstandingDue: 0,
    creditLimit: 3000,
    preferredGame: 'Snooker',
  },
  {
    id: 'cust-2',
    clubId: 'club-royal-cue',
    customerNumber: 'CUST-002',
    name: 'Amit Verma',
    phone: '+91 98765 22334',
    totalSpent: 3200,
    sessionsCount: 12,
    totalHoursPlayed: 14,
    lastVisit: 'Today',
    customDiscountPercent: 5,
    membershipStatus: 'Gold',
    tier: 'gold',
    outstandingDue: 350,
    creditLimit: 2000,
    preferredGame: 'Pool',
  },
  {
    id: 'cust-3',
    clubId: 'club-royal-cue',
    customerNumber: 'CUST-003',
    name: 'Vikram Singh',
    phone: '+91 98765 33445',
    totalSpent: 1900,
    sessionsCount: 7,
    totalHoursPlayed: 8,
    lastVisit: 'Yesterday',
    customDiscountPercent: 0,
    membershipStatus: 'Silver',
    tier: 'silver',
    outstandingDue: 0,
    creditLimit: 1000,
    preferredGame: 'Snooker',
  }
];

// Strictly 2 roles: Owner and Manager
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
    name: 'Vikram Malhotra (Manager)',
    email: 'manager@oneshotsnooker.com',
    phone: '+91 98111 55667',
    role: 'manager',
    joiningDate: '2025-06-15',
    status: 'active',
    lastActiveTime: now
  }
];

export const initialAttendance: AttendanceRecord[] = [];

export const initialExpenses: ExpenseRecord[] = [
  {
    id: 'exp-1',
    clubId: 'club-royal-cue',
    category: 'Cafe Supplies',
    amount: 450,
    notes: 'Fresh milk & chai spices for cafe',
    recordedBy: 'Vikram Malhotra',
    timestamp: now - 3600000 * 4,
    date: new Date().toISOString().split('T')[0]
  },
  {
    id: 'exp-2',
    clubId: 'club-royal-cue',
    category: 'Table Maintenance',
    amount: 350,
    notes: 'Snooker table cloth cleaner spray',
    recordedBy: 'One Shot Owner',
    timestamp: now - 3600000 * 5,
    date: new Date().toISOString().split('T')[0]
  }
];

export const initialMaintenanceRecords: MaintenanceRecord[] = [];

export const initialNotifications: NotificationItem[] = [];

export const hourlyOccupancyData = [
  { time: '10 AM', occupied: 1, revenue: 240 },
  { time: '12 PM', occupied: 2, revenue: 480 },
  { time: '02 PM', occupied: 3, revenue: 750 },
  { time: '04 PM', occupied: 4, revenue: 1100 },
  { time: '06 PM', occupied: 5, revenue: 1650 },
  { time: '08 PM', occupied: 6, revenue: 2300 },
  { time: '10 PM', occupied: 4, revenue: 1400 },
];

export const categorySalesData = [
  { name: 'Table Hours', value: 390, color: '#000000' },
  { name: 'Beverages', value: 140, color: '#404040' },
  { name: 'Snacks & Food', value: 100, color: '#737373' },
  { name: 'Accessories', value: 0, color: '#a3a3a3' },
];

export const weeklyRevenueData = [
  { day: 'Mon', revenue: 4200 },
  { day: 'Tue', revenue: 4800 },
  { day: 'Wed', revenue: 5400 },
  { day: 'Thu', revenue: 6100 },
  { day: 'Fri', revenue: 8900 },
  { day: 'Sat', revenue: 12400 },
  { day: 'Sun', revenue: 11200 },
];

export const paymentMethodsData = [
  { name: 'UPI / QR', value: 65, color: '#171717' },
  { name: 'Cash', value: 35, color: '#525252' },
];
