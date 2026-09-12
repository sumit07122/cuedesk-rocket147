import { 
  formatCurrency, 
  formatPerMinuteRate, 
  calculateSessionSeconds, 
  formatTimerString, 
  calculateTableFee, 
  applyRounding, 
  calculateFoodTotal, 
  calculateBillTotals 
} from '../utils/formatters';
import { SessionData, OrderItem, TopCustomer } from '../types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

function assertEqual<T>(actual: T, expected: T, testName: string) {
  if (actual === expected) {
    console.log(`  ✓ ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName} (Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
    failed++;
  }
}

console.log('\n=============================================');
console.log('🎱 Running CueDesk Core Business Logic Test Suite');
console.log('=============================================\n');

// ----------------------------------------------------
// 1. Currency & Rate Formatter Tests
// ----------------------------------------------------
console.log('▶ Testing Currency & Per-Minute Rates');
assertEqual(formatCurrency(300), '₹300.00', 'formatCurrency formats standard integer amount');
assertEqual(formatCurrency(45.5), '₹45.50', 'formatCurrency formats decimal amount');
assertEqual(formatCurrency(0), '₹0.00', 'formatCurrency handles zero');
assertEqual(formatCurrency(NaN as any), '₹0.00', 'formatCurrency safely handles NaN');
assertEqual(formatCurrency(150, '$'), '$150.00', 'formatCurrency respects custom string symbol');
assertEqual(formatPerMinuteRate(300), '₹5.00/min', 'formatPerMinuteRate converts 300/hr to 5.00/min');
assertEqual(formatPerMinuteRate(260), '₹4.33/min', 'formatPerMinuteRate converts 260/hr to 4.33/min');
assertEqual(formatPerMinuteRate(120), '₹2.00/min', 'formatPerMinuteRate converts 120/hr to 2.00/min');

// ----------------------------------------------------
// 2. Timer & Elapsed Duration Tests
// ----------------------------------------------------
console.log('\n▶ Testing Session Timer & Duration Calculations');
assertEqual(formatTimerString(45), '00:45', 'formatTimerString under 1 minute');
assertEqual(formatTimerString(125), '02:05', 'formatTimerString minutes and seconds');
assertEqual(formatTimerString(3665), '01:01:05', 'formatTimerString over 1 hour');

const baseTime = 1700000000000;
const mockSession: SessionData = {
  id: 'session-1',
  tableId: 't1',
  customerName: 'Aarav Sharma',
  startTime: baseTime,
  hourlyRate: 300,
  isPaused: false,
  totalPausedSeconds: 0,
  rateType: 'standard',
  foodOrders: []
};

assertEqual(calculateSessionSeconds(mockSession, baseTime + 60000), 60, 'calculateSessionSeconds for 60 seconds active');
assertEqual(calculateSessionSeconds(mockSession, baseTime + 185000), 185, 'calculateSessionSeconds for 185 seconds active');

// Paused session test
const pausedSession: SessionData = {
  ...mockSession,
  isPaused: true,
  pausedAt: baseTime + 300000, // paused after 5 mins
  totalPausedSeconds: 0
};
assertEqual(calculateSessionSeconds(pausedSession, baseTime + 600000), 300, 'calculateSessionSeconds stops counting when isPaused is true');

// Resumed session with accumulated paused seconds test
const resumedSession: SessionData = {
  ...mockSession,
  totalPausedSeconds: 120 // was paused for 2 mins
};
assertEqual(calculateSessionSeconds(resumedSession, baseTime + 300000), 180, 'calculateSessionSeconds subtracts totalPausedSeconds (5 mins - 2 mins = 3 mins active)');

// ----------------------------------------------------
// 3. Billing Engine & Per-Minute Fee Calculation
// ----------------------------------------------------
console.log('\n▶ Testing Table Fee & Billing Engine');
// 15 minutes on ₹300/hr table (₹5.00/min) = ₹75.00
const fifteenMinSession: SessionData = {
  ...mockSession,
  hourlyRate: 300
};
assertEqual(calculateTableFee(fifteenMinSession, baseTime + 15 * 60 * 1000), 75, 'calculateTableFee for 15 mins at ₹300/hr is ₹75.00');

// Partial minute ceil rule: 15 mins + 5 seconds counts as 16 minutes = 16 * 5 = ₹80.00
assertEqual(calculateTableFee(fifteenMinSession, baseTime + (15 * 60 + 5) * 1000), 80, 'calculateTableFee rounds partial minute up to next full minute');

// Member discount test (20% discount on ₹75 table fee = ₹60.00)
const memberSession: SessionData = {
  ...mockSession,
  hourlyRate: 300,
  isMember: true,
  memberDiscountPercent: 20
};
assertEqual(calculateTableFee(memberSession, baseTime + 15 * 60 * 1000), 60, 'calculateTableFee applies 20% member discount');

// ----------------------------------------------------
// 4. Food Orders & Rounding Logic
// ----------------------------------------------------
console.log('\n▶ Testing Food Orders & Rounding Rules');
const mockFoodOrders: OrderItem[] = [
  { id: 'f1', menuId: 'm1', name: 'Masala Tea', price: 25, quantity: 2, category: 'tea_coffee', addedAt: new Date(baseTime).toISOString() },
  { id: 'f2', menuId: 'm2', name: 'Veg Grilled Sandwich', price: 90, quantity: 1, category: 'snacks', addedAt: new Date(baseTime).toISOString() },
  { id: 'f3', menuId: 'm3', name: 'Cold Drink (Can)', price: 40, quantity: 3, category: 'cold_drinks', addedAt: new Date(baseTime).toISOString() },
];
assertEqual(calculateFoodTotal(mockFoodOrders), 260, 'calculateFoodTotal correctly computes 2*25 + 1*90 + 3*40 = 260');

assertEqual(applyRounding(143.40, 'none'), 143.4, 'applyRounding none');
assertEqual(applyRounding(143.40, 'nearest_1'), 143, 'applyRounding nearest_1 down');
assertEqual(applyRounding(143.60, 'nearest_1'), 144, 'applyRounding nearest_1 up');
assertEqual(applyRounding(142.00, 'nearest_5'), 140, 'applyRounding nearest_5 down');
assertEqual(applyRounding(143.00, 'nearest_5'), 145, 'applyRounding nearest_5 up');
assertEqual(applyRounding(143.10, 'round_up'), 144, 'applyRounding round_up');

// Full bill grand total calculation
const billSession: SessionData = {
  ...mockSession,
  hourlyRate: 300,
  foodOrders: mockFoodOrders
};
// 30 mins = ₹150 table fee + ₹260 food fee = ₹410 subtotal
// Less ₹50 discount = ₹360
const totals = calculateBillTotals(
  billSession,
  0,
  false,
  50, // discount
  baseTime + 30 * 60 * 1000,
  [{ id: 'e1', name: 'Extra Cue Tip', amount: 40 }],
  'nearest_5'
);
assertEqual(totals.tableFee, 150, 'calculateBillTotals table fee is 150');
assertEqual(totals.foodFee, 260, 'calculateBillTotals food fee is 260');
assertEqual(totals.extraFee, 40, 'calculateBillTotals extra fee is 40');
assertEqual(totals.discountAmount, 50, 'calculateBillTotals discount is 50');
assertEqual(totals.grandTotal, 400, 'calculateBillTotals grand total (150+260+40-50 = 400)');

// ----------------------------------------------------
// 5. CRM Credit Ledger & Risk Classification Tests
// ----------------------------------------------------
console.log('\n▶ Testing CRM Credit Ledger & Risk Badging');
function getCreditRiskStatus(outstandingDue: number, creditLimit: number = 2000): 'GOOD' | 'MODERATE' | 'OVER LIMIT' {
  if (outstandingDue <= 0) return 'GOOD';
  if (outstandingDue > creditLimit) return 'OVER LIMIT';
  return 'MODERATE';
}

assertEqual(getCreditRiskStatus(0, 2000), 'GOOD', 'Zero dues classified as GOOD');
assertEqual(getCreditRiskStatus(-200, 2000), 'GOOD', 'Negative dues (prepaid balance) classified as GOOD');
assertEqual(getCreditRiskStatus(1200, 2000), 'MODERATE', 'Within credit limit classified as MODERATE');
assertEqual(getCreditRiskStatus(2500, 2000), 'OVER LIMIT', 'Exceeding credit limit classified as OVER LIMIT');

// WhatsApp deep-link generation test
function generateWhatsAppReminderURL(phone: string, customerName: string, amountDue: number, clubName: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const message = `Hello ${customerName}, this is a gentle reminder from ${clubName}. Your outstanding balance is ₹${amountDue.toFixed(2)}. Kindly settle when convenient. Thank you!`;
  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
}

const waLink = generateWhatsAppReminderURL('9876543210', 'Rahul', 650, 'One Shot Snooker');
assert(waLink.startsWith('https://wa.me/919876543210'), 'WhatsApp URL formats 10-digit phone with India +91 prefix');
assert(waLink.includes(encodeURIComponent('Rahul')), 'WhatsApp URL encodes customer name');
assert(waLink.includes(encodeURIComponent('₹650.00')), 'WhatsApp URL encodes exact due amount');

// ----------------------------------------------------
// 6. CSV Escaping & Export Tests
// ----------------------------------------------------
console.log('\n▶ Testing CSV Export Formatting');
function escapeCSVCell(val: string | number): string {
  const str = String(val ?? '');
  return `"${str.replace(/"/g, '""')}"`;
}

assertEqual(escapeCSVCell('One Shot, Club'), '"One Shot, Club"', 'CSV escaping wraps cells with commas');
assertEqual(escapeCSVCell('Riley "Tournament" Table'), '"Riley ""Tournament"" Table"', 'CSV escaping doubles internal quotes');
assertEqual(escapeCSVCell('Line1\nLine2'), '"Line1\nLine2"', 'CSV escaping retains newlines safely');

console.log('\n=============================================');
console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
console.log('=============================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL CORE BUSINESS LOGIC TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
}
