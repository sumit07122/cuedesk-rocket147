import { TableItem, MenuItem, SessionHistoryItem, TopCustomer, BusinessConfig, NotificationItem, MaintenanceRecord, ExpenseRecord, AttendanceRecord, EmployeeUser } from '../types';

export const initialBusinessConfig: BusinessConfig = {
  id: 'club-royal-cue',
  clubName: 'One Shot Snooker Gaming Club',
  tagline: 'Local Snooker & Gaming Club',
  address: '',
  phone: '',
  whatsappNumber: '',
  currencySymbol: '₹',
  currencyCode: 'INR',
  defaultHourlyRate: 180.00,
  minimumChargeMinutes: 0,
  upiId: '',
  upiName: 'One Shot Snooker Gaming Club',
  receiptFooterMsg: 'Thank you for visiting One Shot Snooker Gaming Club! See you soon.',
  operatingHours: '10:00 AM – 11:00 PM',
  timeZone: 'Asia/Kolkata',
  roundingRule: 'nearest_1',
  weekendRateMultiplier: 1.2,
  happyHourRateMultiplier: 0.8,
  peakHourStart: 18,
  peakHourEnd: 23,
  maxCashierDiscountPercent: 10,
  maxCreditLimit: 2000,
};

export const initialMenuItems: MenuItem[] = [];

export const initialTables: TableItem[] = [];

export const initialSessionHistory: SessionHistoryItem[] = [];

export const initialTopCustomers: TopCustomer[] = [];

export const initialEmployees: EmployeeUser[] = [];

export const initialAttendance: AttendanceRecord[] = [];

export const initialExpenses: ExpenseRecord[] = [];

export const initialMaintenanceRecords: MaintenanceRecord[] = [];

export const initialNotifications: NotificationItem[] = [];
