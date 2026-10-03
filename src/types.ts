export type SubscriptionPlanId = 'starter' | 'professional' | 'enterprise';

export interface FeatureFlags {
  foodOrdering: boolean;
  inventory: boolean;
  crmMemberships: boolean;
  maintenance: boolean;
  employeeAttendance: boolean;
  expensesNetProfit: boolean;
  analyticsExport: boolean;
  tournamentModule?: boolean;
}

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  priceMonthly: number;
  maxTables: number;
  maxEmployees: number;
  storageLimitMb: number;
  features: FeatureFlags;
  description: string;
}

export interface SaaSClubBranding {
  logoUrl?: string;
  clubName: string;
  receiptFooter: string;
  themeAccentColor: string;
}

export interface SaaSClubProfile {
  id: string;
  clubName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  currencySymbol: string;
  currencyCode: string;
  timeZone: string;
  defaultHourlyRate: number;
  tablesCount: number;
  logoUrl?: string;
  themeAccentColor?: string;
  ownerId: string;
  planId: SubscriptionPlanId;
  subscriptionStatus: 'active' | 'trial' | 'expired' | 'cancelled';
  status?: 'active' | 'suspended';
  trialStartDate: number;
  trialEndDate: number;
  renewalDate: number;
  featureFlags: FeatureFlags;
  branding: SaaSClubBranding;
  createdAt: number;
  lastLoginAt?: number;
}

export interface PlatformAnnouncement {
  id: string;
  title: string;
  content: string;
  severity: 'info' | 'warning' | 'urgent';
  createdAt: number;
  active: boolean;
  createdBy: string;
}

export interface SuperAdminAuditLog {
  id: string;
  action: string;
  performedBy: string;
  targetClubId?: string;
  details: string;
  timestamp: number;
}

export interface SessionRequest {
  id: string;
  clubId: string;
  tableId: string;
  customerName: string;
  customerPhone?: string;
  requestedAt: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface AuditLogItem {
  id: string;
  clubId: string;
  action: string;
  performedBy: string;
  timestamp: number;
  details?: string;
}

export type PageView = 
  | 'dashboard'
  | 'tables'
  | 'table-details'
  | 'billing'
  | 'menu-inventory'
  | 'customers'
  | 'employees'
  | 'expenses'
  | 'maintenance'
  | 'reports'
  | 'daily-report'
  | 'ai-camera'
  | 'settings'
  | 'lockers'
  | 'arena'
  | 'super-admin'
  | 'login';

export type TableType = 'snooker' | 'pool' | 'american_pool' | 'table_tennis' | 'ps5' | 'ps4' | 'magnet_table' | 'carom' | 'vip' | 'xbox' | 'pc_rig';

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning' | 'payment_pending' | 'maintenance';

export type UserRole = 'owner' | 'manager' | 'worker' | 'customer';

export interface UserProfile {
  id: string;
  uid?: string;
  email: string;
  displayName: string;
  fullName?: string;
  phone?: string;
  photoURL?: string;
  role: UserRole;
  clubId: string;
  customerId?: string;
  status?: 'active' | 'inactive' | 'disabled' | 'pending';
  lastLoginAt?: number;
  lastLogin?: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface UserInvitation {
  id: string;
  clubId: string;
  clubName?: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  invitedBy: string;
  invitedByName: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  code: string;
  createdAt: number;
}

export interface ClubInfo {
  id: string;
  clubName: string;
  tagline: string;
  address: string;
  phone: string;
  whatsappNumber?: string;
  currencySymbol: string;
  currencyCode: string;
  defaultHourlyRate: number;
  minimumChargeMinutes?: number;
  upiId: string;
  upiName: string;
  receiptFooterMsg: string;
  operatingHours?: string;
  ownerId?: string;
  createdAt?: number;
}

export type FoodCategory = 'cold_drinks' | 'tea_coffee' | 'snacks' | 'instant_food' | 'desserts' | 'other' | 'accessories' | string;

export interface OrderItem {
  id: string;
  menuId: string;
  name: string;
  price: number;
  quantity: number;
  category: FoodCategory;
  addedAt: string;
}

export interface MenuItem {
  id: string;
  clubId?: string;
  name: string;
  category: FoodCategory;
  price: number;
  costPrice?: number;
  stockQuantity: number;
  lowStockThreshold?: number;
  available: boolean;
  displayOrder?: number;
  image?: string;
  description?: string;
}

export type FoodOrderStatus = 'new' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface FoodOrder {
  id: string;
  clubId: string;
  tableId: string;
  tableName: string;
  customerName: string;
  items: OrderItem[];
  orderTime: number;
  status: FoodOrderStatus;
  totalAmount: number;
  notes?: string;
  updatedAt?: number;
}

export interface PurchaseRecord {
  id: string;
  clubId: string;
  supplierName: string;
  menuId: string;
  menuName: string;
  quantity: number;
  purchasePrice: number;
  date: string;
  timestamp: number;
  notes?: string;
  recordedBy: string;
}

export interface InventoryAdjustment {
  id: string;
  clubId: string;
  menuId: string;
  menuName: string;
  adjustmentType: 'add' | 'reduce' | 'correct' | 'out_of_stock' | 'delivered_order' | 'purchase';
  quantityChange: number;
  newStock: number;
  performedBy: string;
  reason?: string;
  timestamp: number;
}

export interface SessionData {
  id: string;
  tableId: string;
  customerName: string;
  customerId?: string;
  customerPhone?: string;
  playersCount?: number;
  isMember?: boolean;
  memberDiscountPercent?: number;
  startTime: number; // Unix timestamp ms
  hourlyRate: number;
  isPaused: boolean;
  pausedAt?: number;
  totalPausedSeconds: number;
  foodOrders: OrderItem[];
  foodTotal?: number;
  notes?: string;
  rateType: 'standard' | 'peak' | 'vip' | 'discounted';
}

export interface TableItem {
  id: string;
  lastReceiptId?: string;
  clubId?: string;
  number: number;
  name: string;
  type: TableType;
  status: TableStatus;
  hourlyRate: number;
  perMinuteRate?: number;
  currentSession?: SessionData;
  reservedTime?: string;
  reservedCustomer?: string;
  isMaintenance?: boolean;
}

export interface ExtraChargeItem {
  id: string;
  name: string;
  amount: number;
}

export interface SplitPaymentPlayer {
  name: string;
  phone?: string;
  amount: number;
  method: 'cash' | 'upi' | 'credit';
  customerId?: string;
}

export interface SplitPaymentBreakdown {
  cash: number;
  upi: number;
  card?: number;
  splitType?: 'method' | 'players';
  players?: SplitPaymentPlayer[];
}

export interface FrameScore {
  player1Name: string;
  player2Name: string;
  player1Frames: number;
  player2Frames: number;
  targetFrames: number;
}

export interface UdhaarTransaction {
  id: string;
  timestamp: number;
  type: 'due_added' | 'due_reversed' | 'payment_received' | 'deposit_added' | 'deposit_used';
  amount: number;
  description: string;
  receiptNo?: string;
  receiptId?: string;
  paymentMethod?: string;
  source?: 'bill' | 'balance_settlement' | 'deposit' | 'manual_due';
  customerId?: string;
  recordedByEmail?: string;
  recordedBy: string;
}

export interface CueLocker {
  id: string;
  clubId?: string;
  lockerNumber: string;
  customerName?: string;
  customerPhone?: string;
  monthlyFee: number;
  rentedDate?: string;
  expiryDate?: string;
  status: 'available' | 'rented' | 'expired';
  notes?: string;
}

export interface TournamentMatch {
  id: string;
  round: number; // 1 = Quarter, 2 = Semi, 3 = Final
  player1: string;
  player2: string;
  score1: number;
  score2: number;
  winner?: string;
  tableNumber?: number;
  status: 'upcoming' | 'live' | 'completed';
}

export interface Tournament {
  id: string;
  clubId?: string;
  title: string;
  entryFee: number;
  prizePool: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  matches: TournamentMatch[];
  winner?: string;
  startDate: string;
}

export interface SessionHistoryItem {
  id: string;
  clubId?: string;
  tableId: string;
  tableName: string;
  customerName: string;
  customerId?: string;
  customerPhone?: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  hourlyRate?: number;
  tableFee: number;
  foodFee: number;
  extraFee?: number;
  extraCharges?: ExtraChargeItem[];
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  paymentMethod: 'cash' | 'upi' | 'card' | 'split' | 'due_ledger' | 'wallet';
  splitBreakdown?: SplitPaymentBreakdown;
  paymentStatus: 'paid' | 'partially_paid' | 'pending' | 'refunded' | 'due_ledger';
  foodOrders?: OrderItem[];
  notes?: string;
  refundReason?: string;
  refundedAmount?: number;
  refundedBy?: string;
  refundedAt?: number;
  processedBy?: string;
  customerIds?: string[];
  receiptNo: string;
  timestamp: string;
}

export interface TopCustomer {
  id: string;
  customerNumber?: string;
  clubId?: string;
  name: string;
  phone: string;
  sessionsCount: number;
  totalSpent: number;
  totalHoursPlayed?: number;
  dateJoined?: string;
  membershipStatus?: 'VIP' | 'Gold' | 'Silver' | 'Platinum' | 'Regular' | 'None';
  tier?: 'silver' | 'gold' | 'platinum';
  lastVisit: string;
  notes?: string;
  email?: string;
  customDiscountPercent?: number;
  preferredGame?: string;
  walletBalance?: number;
  outstandingDue?: number;
  creditLimit?: number;
  udhaarLedger?: UdhaarTransaction[];
  updatedAt?: number;
  archived?: boolean;
  lastReceiptId?: string;
  lastAccountTransactionId?: string;
}

/** Deliberately limited customer data exposed to the signed-in customer portal. */
export interface CustomerPortalProfile {
  id: string;
  clubId: string;
  customerNumber: string;
  name: string;
  email: string;
  clubName: string;
  currencySymbol: string;
  sessionsCount: number;
  totalSpent: number;
  totalHoursPlayed: number;
  outstandingDue: number;
  walletBalance: number;
  lastVisit: string;
  enabled: boolean;
}

export interface CustomerPortalReceipt {
  id: string;
  receiptNo: string;
  clubId: string;
  customerId: string;
  tableName: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  tableFee: number;
  foodFee: number;
  extraFee: number;
  total: number;
  paid: number;
  due: number;
  paymentMethod: string;
  paymentStatus: SessionHistoryItem['paymentStatus'];
  foodOrders?: OrderItem[];
  refundedAmount?: number;
  refundReason?: string;
}

export interface CustomerPortalActivity {
  id: string;
  clubId: string;
  timestamp: number;
  type: 'payment_received' | 'due_added' | 'due_reversed' | 'deposit_added' | 'deposit_used' | 'refund_issued';
  amount: number;
  description: string;
  receiptNo?: string;
  receiptId?: string;
  paymentMethod?: string;
  recordedByEmail?: string;
}

export interface EmployeeUser {
  id: string;
  clubId: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  joiningDate: string;
  status: 'active' | 'inactive';
  lastActiveTime?: number;
  loginHistory?: { timestamp: number; ip?: string; deviceInfo?: string }[];
}

export interface AttendanceRecord {
  id: string;
  clubId: string;
  employeeId: string;
  employeeName: string;
  employeeRole: UserRole;
  checkInTime: number; // unix ms
  checkOutTime?: number; // unix ms
  workingHoursMinutes?: number;
  date: string; // YYYY-MM-DD
  notes?: string;
}

export type ExpenseCategory = 
  | 'Rent' 
  | 'Electricity' 
  | 'Staff Salary' 
  | 'Table Repair' 
  | 'Cue Maintenance' 
  | 'Internet' 
  | 'Cleaning' 
  | 'Miscellaneous'
  | string;

export interface ExpenseRecord {
  id: string;
  clubId: string;
  category: ExpenseCategory;
  amount: number;
  date: string; // YYYY-MM-DD
  timestamp: number;
  notes?: string;
  recordedBy: string;
}

export interface MaintenanceRecord {
  id: string;
  clubId: string;
  tableId: string;
  tableName: string;
  status: TableStatus;
  reason: string;
  cost?: number;
  markedBy: string;
  timestamp: number;
  resolvedAt?: number;
  notes?: string;
}

export type NotificationType = 
  | 'checkout_req' 
  | 'low_stock' 
  | 'new_booking' 
  | 'failed_payment' 
  | 'employee_login' 
  | 'table_maintenance' 
  | 'food_order'
  | 'general';

export interface NotificationItem {
  id: string;
  clubId: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  resolved?: boolean;
  resolvedAt?: number;
  severity?: 'info' | 'warning' | 'error' | 'success';
  targetId?: string;
}

export interface DashboardWidgetConfig {
  showRevenue: boolean;
  showActiveTables: boolean;
  showPendingPayments: boolean;
  showLowStock: boolean;
  showTodaysBookings: boolean;
  showRecentActivity: boolean;
  showExpensesNetProfit: boolean;
  showStaffAttendance: boolean;
}

export interface BusinessConfig extends ClubInfo {
  weekendRateMultiplier?: number;
  happyHourRateMultiplier?: number;
  peakHourStart?: number;
  peakHourEnd?: number;
  roundingRule?: 'none' | 'nearest_1' | 'nearest_5' | 'round_up';
  maxCashierDiscountPercent?: number;
  logoUrl?: string;
  timeZone?: string;
  silverDiscountPercent?: number;
  goldDiscountPercent?: number;
  vipDiscountPercent?: number;
  maxCreditLimit?: number;
  autoUpgradeSpendThreshold?: number;
  widgetConfig?: DashboardWidgetConfig;
  planId?: SubscriptionPlanId;
  subscriptionStatus?: 'active' | 'trial' | 'expired' | 'cancelled';
  trialStartDate?: number;
  trialEndDate?: number;
  featureFlags?: FeatureFlags;
}

export interface DailyLedgerRecord {
  id: string;
  dateKey: string;
  clubId: string;
  closedAt: number;
  closedBy: string;
  closureNumber: string;
  status: 'closed' | 'open' | 'auto_archived';
  totalBilled: number;
  totalCollected: number;
  cashCollected: number;
  upiCollected: number;
  cardCollected: number;
  creditDueAdded: number;
  totalExpenses: number;
  netProfit: number;
  tableRevenue: number;
  foodRevenue: number;
  taxCollected: number;
  discountGiven: number;
  refundsTotal: number;
  openingCash: number;
  expectedCash: number;
  actualCashCounted: number;
  cashDifference: number;
  totalSessions: number;
  totalHoursPlayed: number;
  uniqueCustomers: number;
  notes?: string;
  sessionsSummary?: {
    id: string;
    receiptNo: string;
    time: string;
    customerName: string;
    customerPhone?: string;
    tableName: string;
    durationMinutes: number;
    grandTotal: number;
    amountPaid: number;
    paymentMethod: string;
    paymentStatus: string;
  }[];
}

export interface CameraConfig {
  id: string;
  name: string;
  type: 'webcam' | 'cpplus_ip' | 'rtsp_proxy' | 'simulation';
  deviceId?: string;
  ipAddress?: string;
  port?: number;
  channel?: number;
  username?: string;
  password?: string;
  streamUrl?: string;
  assignedTableId?: string;
  assignedTableName?: string;
  detectionEnabled: boolean;
  sensitivity: number;
  autoStartEnabled: boolean;
  status: 'connected' | 'disconnected' | 'streaming';
}
