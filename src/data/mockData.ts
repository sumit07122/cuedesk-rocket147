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
    status: 'occupied', 
    hourlyRate: 300.00, 
    perMinuteRate: 5.00,
    currentSession: {
      id: 'sess-live-01',
      tableId: 'tbl-1',
      customerName: 'Rahul Sharma',
      customerPhone: '+91 98765 11223',
      isMember: true,
      memberDiscountPercent: 10,
      startTime: Date.now() - 45 * 60 * 1000,
      hourlyRate: 300.00,
      isPaused: false,
      totalPausedSeconds: 0,
      foodOrders: [
        { id: 'ord-1', menuId: 'm1', name: 'Cold Brew Coffee', price: 150, quantity: 1, category: 'tea_coffee', addedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString() },
        { id: 'ord-2', menuId: 'm7', name: 'Loaded Nachos Supreme', price: 280, quantity: 1, category: 'snacks', addedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
      ],
      rateType: 'discounted'
    }
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
    status: 'payment_pending', 
    hourlyRate: 120.00, 
    perMinuteRate: 2.00,
    currentSession: {
      id: 'sess-live-04',
      tableId: 'tbl-4',
      customerName: 'Aman Verma',
      customerPhone: '+91 98220 44556',
      isMember: false,
      memberDiscountPercent: 0,
      startTime: Date.now() - 75 * 60 * 1000,
      hourlyRate: 120.00,
      isPaused: false,
      totalPausedSeconds: 0,
      foodOrders: [
        { id: 'ord-3', menuId: 'm2', name: 'Monster Energy Drink', price: 160, quantity: 2, category: 'cold_drinks', addedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() }
      ],
      rateType: 'standard'
    }
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
    name: 'PS5 Console Lounge 01 — 4K OLED', 
    type: 'ps5', 
    status: 'available', 
    hourlyRate: 180.00, 
    perMinuteRate: 3.00 
  },
  { 
    id: 'tbl-7', 
    number: 7, 
    name: 'PS4 Station 01 — EA FC & Tekken Arena', 
    type: 'ps4', 
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

export const initialSessionHistory: SessionHistoryItem[] = [
  {
    id: 'hist-101',
    tableId: 'tbl-1',
    tableName: 'Snooker Table 01 — Match Star',
    customerName: 'Priya Patel',
    customerPhone: '+91 98111 22334',
    startTime: now - 4 * 3600 * 1000,
    endTime: now - 2.5 * 3600 * 1000,
    durationSeconds: 5400,
    hourlyRate: 300.00,
    tableFee: 450.00,
    foodFee: 330.00,
    taxAmount: 0,
    discountAmount: 45.00,
    grandTotal: 735.00,
    amountPaid: 735.00,
    balanceDue: 0,
    paymentMethod: 'upi',
    paymentStatus: 'paid',
    receiptNo: 'OS-9201',
    timestamp: new Date(now - 2.5 * 3600 * 1000).toISOString(),
    processedBy: 'Sunita (Cashier)'
  },
  {
    id: 'hist-102',
    tableId: 'tbl-3',
    tableName: 'Pool Table 01 — 9ft Classic',
    customerName: 'Karan Singh',
    customerPhone: '+91 97222 33445',
    startTime: now - 5 * 3600 * 1000,
    endTime: now - 3 * 3600 * 1000,
    durationSeconds: 7200,
    hourlyRate: 120.00,
    tableFee: 240.00,
    foodFee: 160.00,
    taxAmount: 0,
    discountAmount: 20.00,
    grandTotal: 380.00,
    amountPaid: 380.00,
    balanceDue: 0,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    receiptNo: 'OS-9202',
    timestamp: new Date(now - 3 * 3600 * 1000).toISOString(),
    processedBy: 'Sunita (Cashier)'
  },
  {
    id: 'hist-103',
    tableId: 'tbl-6',
    tableName: 'PS5 Console Lounge 01 — 4K OLED',
    customerName: 'Devansh Roy',
    customerPhone: '+91 96333 44556',
    startTime: now - 6 * 3600 * 1000,
    endTime: now - 4.5 * 3600 * 1000,
    durationSeconds: 5400,
    hourlyRate: 180.00,
    tableFee: 270.00,
    foodFee: 240.00,
    taxAmount: 0,
    discountAmount: 0,
    grandTotal: 510.00,
    amountPaid: 510.00,
    balanceDue: 0,
    paymentMethod: 'card',
    paymentStatus: 'paid',
    receiptNo: 'OS-9203',
    timestamp: new Date(now - 4.5 * 3600 * 1000).toISOString(),
    processedBy: 'Vikram (Manager)'
  },
  {
    id: 'hist-104',
    tableId: 'tbl-2',
    tableName: 'Snooker Table 02 — Riley Tournament',
    customerName: 'Amit Verma',
    customerPhone: '+91 95444 55667',
    startTime: now - 7 * 3600 * 1000,
    endTime: now - 5.5 * 3600 * 1000,
    durationSeconds: 5400,
    hourlyRate: 260.00,
    tableFee: 390.00,
    foodFee: 150.00,
    taxAmount: 0,
    discountAmount: 40.00,
    grandTotal: 500.00,
    amountPaid: 0,
    balanceDue: 500.00,
    paymentMethod: 'due_ledger',
    paymentStatus: 'due_ledger',
    receiptNo: 'OS-9204',
    timestamp: new Date(now - 5.5 * 3600 * 1000).toISOString(),
    processedBy: 'Sunita (Cashier)',
    notes: 'Billed to Due Ledger / Credit account'
  }
];

export const initialTopCustomers: TopCustomer[] = [
  {
    id: 'cust-1',
    name: 'Rahul Sharma',
    phone: '+91 98765 11223',
    sessionsCount: 28,
    totalSpent: 9800,
    totalHoursPlayed: 36.5,
    dateJoined: '2025-11-10',
    membershipStatus: 'VIP',
    tier: 'platinum',
    lastVisit: 'Today',
    creditLimit: 5000,
    outstandingDue: 0,
    notes: 'Prefers Snooker Table 1 Match Star'
  },
  {
    id: 'cust-2',
    name: 'Priya Patel',
    phone: '+91 98111 22334',
    sessionsCount: 19,
    totalSpent: 6400,
    totalHoursPlayed: 24.0,
    dateJoined: '2025-12-05',
    membershipStatus: 'Gold',
    tier: 'gold',
    lastVisit: 'Today',
    creditLimit: 3000,
    outstandingDue: 0,
    notes: 'Regular cold brew coffee drinker'
  },
  {
    id: 'cust-3',
    name: 'Amit Verma',
    phone: '+91 95444 55667',
    sessionsCount: 14,
    totalSpent: 4200,
    totalHoursPlayed: 18.0,
    dateJoined: '2026-01-12',
    membershipStatus: 'Regular',
    lastVisit: 'Today',
    creditLimit: 2000,
    outstandingDue: 500,
    udhaarLedger: [
      {
        id: 'tx-1',
        timestamp: now - 5.5 * 3600 * 1000,
        type: 'due_added',
        amount: 500,
        description: 'Table Session — Receipt #OS-9204',
        receiptNo: 'OS-9204',
        recordedBy: 'Sunita (Cashier)'
      }
    ]
  },
  {
    id: 'cust-4',
    name: 'Karan Singh',
    phone: '+91 97222 33445',
    sessionsCount: 12,
    totalSpent: 3800,
    totalHoursPlayed: 15.5,
    dateJoined: '2026-02-01',
    membershipStatus: 'Silver',
    tier: 'silver',
    lastVisit: 'Today',
    creditLimit: 2000,
    outstandingDue: 0
  }
];

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
    lastActiveTime: now - 15 * 60 * 1000
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
    lastActiveTime: now - 5 * 60 * 1000
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
    lastActiveTime: now - 10 * 60 * 1000
  }
];

export const initialAttendance: AttendanceRecord[] = [
  {
    id: 'att-1',
    clubId: 'club-royal-cue',
    employeeId: 'emp-2',
    employeeName: 'Vikram Malhotra',
    employeeRole: 'manager',
    checkInTime: now - 6 * 3600 * 1000,
    date: new Date().toISOString().split('T')[0],
    notes: 'Morning shift management'
  },
  {
    id: 'att-2',
    clubId: 'club-royal-cue',
    employeeId: 'emp-3',
    employeeName: 'Sunita Rao',
    employeeRole: 'cashier',
    checkInTime: now - 5 * 3600 * 1000,
    date: new Date().toISOString().split('T')[0],
    notes: 'POS & Billing counter duty'
  }
];

export const initialExpenses: ExpenseRecord[] = [
  {
    id: 'exp-1',
    clubId: 'club-royal-cue',
    category: 'Table Repair',
    amount: 1200,
    date: new Date().toISOString().split('T')[0],
    timestamp: now - 24 * 3600 * 1000,
    notes: 'Master cue tips & cloth cleaning brush replacement',
    recordedBy: 'Vikram (Manager)'
  },
  {
    id: 'exp-2',
    clubId: 'club-royal-cue',
    category: 'Electricity',
    amount: 4500,
    date: new Date().toISOString().split('T')[0],
    timestamp: now - 48 * 3600 * 1000,
    notes: 'Monthly high-efficiency AC & Arena flood lights bill',
    recordedBy: 'Owner'
  },
  {
    id: 'exp-3',
    clubId: 'club-royal-cue',
    category: 'Miscellaneous',
    amount: 850,
    date: new Date().toISOString().split('T')[0],
    timestamp: now - 72 * 3600 * 1000,
    notes: 'Lounge sanitization & cleaning supplies',
    recordedBy: 'Sunita (Cashier)'
  }
];

export const initialMaintenanceRecords: MaintenanceRecord[] = [];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    clubId: 'club-royal-cue',
    type: 'checkout_req',
    title: 'Checkout Requested',
    message: 'Table #4 (Brunswick Pro) requested final bill settlement.',
    timestamp: now - 15 * 60 * 1000,
    read: false
  },
  {
    id: 'notif-2',
    clubId: 'club-royal-cue',
    type: 'low_stock',
    title: 'Snack Inventory Notice',
    message: 'Loaded Nachos Supreme inventory is at 22 units.',
    timestamp: now - 2 * 3600 * 1000,
    read: true
  }
];

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
