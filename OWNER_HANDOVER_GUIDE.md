# 🎱 One Shot Snooker Gaming Club — Owner & Staff Operating Manual

Welcome to **CueDesk Pro**, the official operating system customized for **One Shot Snooker Gaming Club**.

The platform is pre-configured and ready for immediate operational use.

---

## 🚀 Quick Launch: How to Open & Log In

1. Open your club's live URL (or navigate to `http://localhost:3000` on the counter computer).
2. The sign-in portal opens with preloaded default credentials:

| Staff Role | Login Email ID | Default Password | Scope of Access |
|---|---|---|---|
| 👑 **Club Owner** | `owner@oneshotsnooker.com` | `owner123` | Full control: Pricing, Staff Roster, Financials, Reset |
| 💼 **General Manager** | `manager@oneshotsnooker.com` | `manager123` | Shift closure, Reports, Expenses, Station rates |
| 💵 **Cashier / Marker** | `cashier@oneshotsnooker.com` | `cashier123` | Start/stop table timers, Checkout payments, Food orders, Credit ledger |
| 👨‍🍳 **Kitchen Staff** | `kitchen@oneshotsnooker.com` | `kitchen123` | Kitchen Display Screen (KDS) order queue only |

3. Click **"Sign In to Dashboard"** (or click any 1-tap role pill on screen).

---

## 🎱 Gaming Stations & Standard Hourly Rates

Your system is pre-configured with 8 gaming stations:

| Station ID | Gaming Station Name | Hourly Rate | Exact Per-Minute Rate |
|---|---|---|---|
| **#01** | Snooker Table 01 — Match Star | ₹300.00 / hr | ₹5.00 / min |
| **#02** | Snooker Table 02 — Riley Tournament | ₹260.00 / hr | ₹4.33 / min |
| **#03** | English Pool Table 01 | ₹120.00 / hr | ₹2.00 / min |
| **#04** | American Pool Table 02 | ₹120.00 / hr | ₹2.00 / min |
| **#05** | Table Tennis Arena 01 | ₹300.00 / hr | ₹5.00 / min |
| **#06** | PlayStation 5 Lounge 01 | ₹180.00 / hr | ₹3.00 / min |
| **#07** | PlayStation 4 Lounge 01 | ₹150.00 / hr | ₹2.50 / min |
| **#08** | Magnet Board Arena 01 | ₹180.00 / hr | ₹3.00 / min |

Rates and station names can be modified anytime under **Club Settings ➔ Gaming Stations**.

---

## 🛠️ Daily Cashier & Desk Operational Workflow

### 1. Starting a Table Session
1. On the **Dashboard Overview**, find the table/station (e.g. `Snooker Table 01`).
2. Click **"Start Session"**.
3. Select or enter the customer name, optional phone number, and verify rate.
4. Click **Start Session** — the live timer begins immediately!

### 2. Ordering Food & Drinks for Running Tables
1. Click on any active green table card.
2. Click **"+ Snacks"**.
3. Select items from your kitchen catalog (Tea, Cold Drinks, Sandwich, Chips) and click **Add to Bill**.
4. The items immediately appear on the **Kitchen Display (KDS)** screen at `/kds` for kitchen staff to prepare!

### 3. Ending Session & Billing Checkout
1. Click **"End Session"** on the table card.
2. Review Table Fee (calculated exact per minute) + Food & Drinks.
3. Apply any cashier discount if eligible.
4. Select payment method:
   - 📱 **UPI** (Dynamic QR code ready for customer phone scan)
   - 💵 **Cash**
   - 💳 **Card**
   - 🔴 **Pay Later (Add to Player Credit / Udhaar Ledger)**
5. Click **Settle Payment & Print Receipt**.

### 4. Player Credit & Udhaar Tracker
1. Go to **Customer CRM & Credit Ledger** from the left sidebar.
2. View player dues, credit limits, and risk badges (`GOOD`, `MODERATE`, `OVER LIMIT`).
3. Click **"Settle"** to record cash/UPI payments against credit dues.
4. Click **"WhatsApp Reminder"** to send instant payment reminders with your UPI details via WhatsApp.
5. Click **"Export"** to download the complete Credit Ledger directly to an **Excel (.csv)** spreadsheet!

---

## 🛡️ Data Safety & 3-Tier Backups

1. **Cloud Database**: Every session start, pause, order, and payment is saved in real time to Google Cloud Firestore.
2. **Downloadable JSON Backup**: Go to **Club Settings ➔ Backup & Restore** and click **"Download Complete JSON Backup"** anytime to download a complete copy to your computer.
3. **Emergency Restore**: If needed, click **"Restore from JSON File"** to recover all club data instantly.

---

## ⚠️ High-Privilege Danger Zone Reset

To clear all test sales data or perform a fresh wipe before official club opening:
1. Go to **Club Settings ➔ Danger Zone**.
2. Click **"Full Club Reset"**.
3. Type the exact confirmation keyword:
   ```text
   RESET ONESHOT
   ```
4. Click **Permanently Delete Data**.

---

## 🩺 System Health Diagnostics & Verification

1. **In-App Health Tab**: Open **Club Settings ➔ System Health & Diagnostics** to view live Firestore latency (in ms), offline storage cache, cloud connection state, and active browser memory.
2. **Automated Logic Self-Test**: Run the built-in diagnostic test suite anytime from terminal:
   ```bash
   npm test
   ```
   This verifies table billing rounding, member discounts, credit risk calculations, and export formatting.
