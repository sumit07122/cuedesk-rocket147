# 🎱 One Shot Snooker Gaming Club — Owner Handover & Setup Guide

Congratulations! Your customized management platform for **One Shot Snooker Gaming Club** is fully built, configured, and ready for deployment.

This guide provides step-by-step instructions for:
1. **Setting up your own Firebase Database** (Cloud Realtime Synchronization).
2. **Running the application locally or deploying online** (Vercel, Netlify, or Firebase Hosting).
3. **Daily operational workflow for Cashiers & Managers**.
4. **Data safety & Daily Auto-Snapshot backups**.

---

## 🚀 Quick Start: How to Run Locally

1. **Open Terminal / Command Prompt** in the project folder:
   ```bash
   cd c:\Users\hp\OneDrive\Desktop\Cuedesk-main\Cuedesk-main
   ```
2. **Install Dependencies** (if running on a new computer):
   ```bash
   npm install
   ```
3. **Launch local server**:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to: **`http://localhost:3000`**

---

## ☁️ Connecting Your Own Firebase Database (Cloud Sync)

The platform is designed to sync all table timers, bills, food orders, and credit ledgers across all devices (desktops, tablets, staff phones) in real time using Google Firebase.

### Step 1: Create a Free Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Click **"Add Project"** and name it `oneshot-snooker-club`.
3. Disable Google Analytics (optional) and click **Create Project**.

### Step 2: Enable Firestore Database & Authentication
1. In the left sidebar, click **Build -> Firestore Database**.
2. Click **Create Database** -> Select **Start in test mode** -> Choose your closest server region (e.g. `asia-south1 (Mumbai)`) -> Click **Enable**.
3. In the left sidebar, click **Build -> Authentication**.
4. Click **Get Started** -> Enable **Email/Password** sign-in method -> Click **Save**.

### Step 3: Get Web Config Keys
1. In Firebase Console, click the **Settings Cog (⚙️) -> Project Settings**.
2. Scroll down to **Your apps** -> Click the **Web icon (`</>`)**.
3. Register app as `One Shot Web App`.
4. Copy the `firebaseConfig` keys provided.

### Step 4: Configure `.env` File
Create or edit the `.env` file in your project root directory with your Firebase keys:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=oneshot-snooker-club.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=oneshot-snooker-club
VITE_FIREBASE_STORAGE_BUCKET=oneshot-snooker-club.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 🛠️ Daily Cashier & Staff Operational Workflow

### 1. Starting a Table or Gaming Station Session
1. On the **Dashboard Overview**, find the table/station (e.g. `Snooker Table 01`, `PS5 Lounge 01`).
2. Click **"Start Session"**.
3. Select or enter the customer name, optional phone number, and choose your rate (`₹5/min`, `₹4.33/min`, `₹2/min`, `₹3/min`, or custom rate).
4. Click **Start Session** — the live timer starts immediately!

### 2. Ordering Food & Drinks for Running Tables
1. Click on any active green table card.
2. Click **"+ Add Snacks / Drinks"**.
3. Select items from your kitchen menu catalog (e.g. Tea, Cold Drinks, Chips) and click **Add to Bill**.
4. The items immediately display on the **Kitchen Display (KDS)** screen at `/kds` for kitchen staff to prepare!

### 3. Ending Session & Billing Checkout
1. Click **"End Session"** on the table card.
2. Review Table Fee (calculated exact per minute) + Food & Drinks.
3. Apply any custom discounts if needed.
4. Select payment method: **📱 UPI**, **💵 Cash**, **💳 Card**, or **🔴 Pay Later (Add to Player Dues)**.
5. Click **Settle Payment & Print Receipt**.

### 4. Managing Player Credit Dues (Udhaar Tracker)
1. Go to **Customer CRM & Credit Ledger** from the left sidebar.
2. View player dues, credit limits, and risk badges (`OVER LIMIT`, `MODERATE`, `GOOD`).
3. Click **"Settle"** to record cash/UPI payments against credit dues.
4. Click **"WhatsApp Reminder"** to send instant payment reminders to players on WhatsApp.
5. Click **"Export"** to download the complete Credit Ledger directly to an **Excel (.csv)** spreadsheet!

---

## 🛡️ Data Safety & Automatic Daily Snapshots

- **Daily Auto-Snapshots**: The system automatically saves a daily backup snapshot of your entire database every day in local browser storage and Firestore.
- **Manual Backups**: Go to **Club Settings -> Backup & Security** anytime to click **"Export Backup JSON"** or click **"Take Instant Snapshot"**.
- **Data Restore**: If your computer crashes or internet drops, go to **Club Settings -> Backup & Security** and click **"Restore Snapshot"** to recover all data instantly.

---

## 🌐 Deploying Online for Multi-Device Access (Optional)

If you want staff to access the platform from their mobile phones or tablets anywhere:

1. **Deploy to Vercel (Free 1-Click Deployment)**:
   - Push your code to GitHub.
   - Go to [Vercel.com](https://vercel.com/) -> Import your GitHub repository.
   - Add your `.env` Firebase variables under Environment Variables.
   - Click **Deploy** — your live URL will be ready in 60 seconds (e.g. `https://oneshot-snooker.vercel.app`)!

---

## 📞 Support & Setup Summary
Your platform is pre-configured with:
- 🔴 Snooker 01 (₹5/min) & Snooker 02 (₹4.33/min)
- 🎱 Pool 01 (₹2/min) & American Pool 02 (₹2/min)
- 🏓 Table Tennis 01 (₹5/min)
- 🎮 PS5 Lounge 01 (₹3/min) & PS4 Station 01 (₹2.50/min)
- 🧲 Magnet Board Arena 01 (₹3/min)
- 📊 One-Click Excel Exports & Daily Auto-Snapshots
