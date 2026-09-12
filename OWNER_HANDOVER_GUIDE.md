# 🎱 One Shot Snooker Gaming Club

## CueDesk — Owner & Staff Operating Manual

Welcome to **CueDesk**, the official management operating system created for **One Shot Snooker Gaming Club**.

CueDesk helps you manage:

* 🎱 Snooker & pool tables
* 🎮 Gaming stations
* ⏱️ Live session timers
* 💰 Billing & payments
* 🍔 Food & drink orders
* 👥 Customers
* 📒 Udhaar / customer credit
* 📊 Sales & reports
* 🖨️ Receipts
* 💾 Data backup

---

# 1. 🔐 Login Credentials & Access Roles

Open the CueDesk website on your counter computer, tablet, or phone (e.g. `http://localhost:3000` or your live club URL).

Each staff member has a dedicated preloaded account with 1-tap quick login presets:

| Staff Role | Login Email ID | Default Password | Scope of Access |
| :--- | :--- | :--- | :--- |
| 👑 **Owner** | `owner@oneshotsnooker.com` | `owner123` | Full system control: Pricing, Staff Roster, Financials, Reset |
| 💼 **Manager** | `manager@oneshotsnooker.com` | `manager123` | Shift closure, Reports, Expenses, Station rates & Roster |
| 💵 **Cashier / Desk** | `cashier@oneshotsnooker.com` | `cashier123` | Tables, Live Timers, Billing, Payments, Food Orders, Credit Ledger |
| 👨‍🍳 **Kitchen Staff** | `kitchen@oneshotsnooker.com` | `kitchen123` | Kitchen Display Screen (KDS) order queue & preparation |

> 💡 **1-Tap Quick Login**: On the sign-in screen, click any of the colored role buttons at the top to automatically fill the email and password instantly.

### Important
* Do not share the Owner account with other staff.
* After the initial handover, change default passwords from **Club Settings ➔ Security**.

---

# 2. 🎱 Gaming Stations & Rates

CueDesk is pre-configured with 8 gaming stations tailored for One Shot Snooker:

| #  | Station Name                        | Hourly Rate | Exact Per-Minute Rate |
| :-- | :---------------------------------- | ----------: | --------------------: |
| 01 | Snooker Table 01 — Match Star       |   ₹300 / hr |               ₹5 / min |
| 02 | Snooker Table 02 — Riley Tournament |   ₹260 / hr |            ₹4.33 / min |
| 03 | English Pool Table 01               |   ₹120 / hr |               ₹2 / min |
| 04 | American Pool Table 02              |   ₹120 / hr |               ₹2 / min |
| 05 | Table Tennis Arena 01               |   ₹300 / hr |               ₹5 / min |
| 06 | PlayStation 5 Lounge 01             |   ₹180 / hr |               ₹3 / min |
| 07 | PlayStation 4 Lounge 01             |   ₹150 / hr |            ₹2.50 / min |
| 08 | Magnet Board Arena 01               |   ₹180 / hr |               ₹3 / min |

The Owner can add, remove, rename, or change station rates anytime from:

**Settings → Gaming Stations**

---

# 3. ▶️ Starting a Session

When a customer wants to play:

### Step 1
Open the **Dashboard**.

### Step 2
Find the required table or gaming station card.

### Step 3
Click **Start Session**.

### Step 4
Enter the customer name (e.g. *Rahul Sharma*). Phone number can also be added for CRM & credit tracking.

### Step 5
Check the hourly rate and player count.

### Step 6
Click **Start Session**.

The live timer will begin running immediately on screen.

---

# 4. ⏸️ Pause & Resume

If a customer wants to temporarily step out or pause play:

1. Click on the active table card.
2. Click **Pause Session**.
3. When they return to resume play, click **Resume Session**.

CueDesk automatically freezes billing duration during pause and deducts accumulated pause time from the final table charge.

---

# 5. 🍔 Adding Food & Drinks

While a customer is playing:

### Step 1
Click on the active green table card.

### Step 2
Click **+ Snacks / Drinks**.

### Step 3
Select the required items (Tea, Cold Drinks, Sandwiches, Chips, etc.) and choose quantities.

### Step 4
Click **Add to Bill**.

The order is immediately appended to the table tab and wirelessly transmits to the **Kitchen Display (KDS)** for kitchen staff to prepare!

---

# 6. 👨‍🍳 Kitchen Display Screen (KDS)

Kitchen staff should open:

**KDS / Kitchen Display** (`/kds`)

New orders appear in real time automatically with:

* Table name & customer
* Items & quantities
* Timestamp
* Status badge (`New` ➔ `Preparing` ➔ `Served`)

Kitchen staff can click **Mark as Preparing** when cooking starts, and **Mark as Served** once delivered to the table.

---

# 7. 💰 Ending a Session & Taking Payment

When the customer finishes playing:

### Step 1
Open the active session card.

### Step 2
Click **End Session**.

### Step 3
Review the itemized bill calculation:

$$\text{Final Amount} = \text{Table/Gaming Fee} + \text{Food \& Drinks} + \text{Extra Charges} - \text{Discount}$$

### Step 4
Select the payment method:

* 📱 **UPI** (Dynamic QR code ready for phone scan)
* 💵 **Cash**
* 💳 **Card**
* 🔴 **Pay Later (Add to Player Credit / Udhaar Ledger)**

### Step 5
Click:

**Settle Payment & Print Receipt**

Always verify the received amount before completing checkout.

---

# 8. 📒 Udhaar / Customer Credit Ledger

If a regular or trusted customer does not pay immediately:

1. Select **Pay Later / Add to Credit** during checkout.
2. The bill amount is added directly to that player's outstanding balance.

To manage all customer dues:

**Customer CRM → Credit Ledger**

Here you can view:
* Customer name & phone number
* Outstanding dues (₹)
* Credit limit (₹)
* Prepaid deposit balance (₹)
* Total lifetime visits and spend
* Risk badge status

### Risk Badges
🟢 **GOOD** — Balance is zero, negative (prepaid), or well below limit.

🟡 **MODERATE** — Player has outstanding dues approaching the credit limit.

🔴 **OVER LIMIT** — Player has exceeded the club credit limit. Counter staff should collect payment before allowing new table sessions.

---

# 9. 💵 Collecting an Old Due

When a customer comes to clear their previous balance:

1. Open **Customer CRM → Credit Ledger**.
2. Find the customer using the search bar.
3. Click **Settle**.
4. Enter the amount received (full or partial payment).
5. Select payment method (**Cash** or **UPI**).
6. Click **Confirm Payment**.

The ledger updates instantly and reduces the player's due balance.

---

# 10. 📱 WhatsApp Payment Reminder

To politely remind a player about pending dues:

1. Open **Customer CRM → Credit Ledger**.
2. Locate the player with outstanding dues.
3. Click **WhatsApp Reminder**.
4. CueDesk opens WhatsApp with a pre-formatted, polite message containing:
   * Customer name
   * Exact outstanding balance (₹)
   * Club name (**One Shot Snooker Gaming Club**)
   * UPI payment instructions
5. Verify and press send!

---

# 11. 📊 Reports & Excel Exports

Managers and Owners can use the **Reports** section to evaluate club performance:

* Today's gross revenue
* Table gaming revenue vs. Kitchen snack sales
* Payment breakdown (UPI vs. Cash vs. Card vs. Credit)
* Outstanding credit dues
* Session history logs

### 📥 1-Click Excel Exports
Every module includes a 1-click **Export (.csv)** button compatible with Microsoft Excel and Google Sheets:
* **Sales History**: Download from Reports View or Settings.
* **Credit Ledger**: Download complete player udhaar sheets from CRM.
* **Menu Inventory**: Download current stock quantities from Food & Inventory.
* **Staff Roster & Attendance**: Download duty hours and shift logs from Staff Management.
* **Expenses**: Download all cash outflow records from Business Expenses & Profit.

---

# 12. 🧾 Receipts & Thermal Printing

After completing a payment, CueDesk generates a professional printable receipt containing:

* One Shot Snooker Gaming Club branding & contact details
* Receipt Number & Date/Time
* Gaming Station / Table name
* Total playing duration (hours & minutes)
* Exact table fee + Food items breakdown
* Discount amount applied
* Grand Total (₹) and payment method
* Thank-you footer message

Use your browser's Print dialog (`Ctrl + P`) to send directly to any 58mm or 80mm thermal receipt printer or standard desktop printer.

---

# 13. 💾 Data Safety & 3-Tier Backups

CueDesk protects your club data through a 3-tier safety architecture:

1. **Real-time Cloud Sync**: Every timer start, pause, order, and payment is saved in real time to Google Cloud Firestore.
2. **Local Emergency Cache**: In-browser local cache ensures sessions continue without interruption even if the internet briefly drops.
3. **Downloadable JSON Backup**:

Go to:

**Settings → Backup & Restore**

Click **"Download Complete JSON Backup"** anytime to download a full offline copy of all tables, settings, menu items, and history to your computer.

Save the downloaded backup file somewhere safe:
* Club counter PC
* External USB drive
* Google Drive / OneDrive

### Restoring from Backup
If moving to a new computer or recovering after hardware failure:
1. Click **"Restore from JSON File"**.
2. Select your saved backup `.json` file.
3. CueDesk restores all club data immediately!

---

# 14. ⚙️ Settings (13 Core Sections)

The Owner has full control over all 13 settings sections:

1. **Club Profile**: Business name, tagline, address, phone number, and receipt footer message.
2. **Gaming Stations**: Manage tables, hourly rates, and per-minute charges.
3. **Staff & Roles**: Add, edit, or deactivate Owner, Manager, Cashier, and Kitchen accounts.
4. **Menu & Pricing**: Add snacks, beverages, and update prices.
5. **Billing Rules**: Rounding rules (`Nearest ₹1`, `Nearest ₹5`, `Round Up`, or exact decimals) and cashier discount limits.
6. **Customer CRM & Credit**: Set maximum credit limits (e.g. ₹2,000) and VIP discount percentages.
7. **Reports & Exports**: Quick links for Excel data downloads.
8. **Backup & Restore**: Download complete club JSON snapshots and restore data.
9. **Notifications**: Configure audio alerts for cue boy assistance and checkout requests.
10. **Security & Passwords**: Change staff passwords and enforce login policies.
11. **System Health**: View live cloud connection state, latency (ms), and cache size.
12. **About & License**: Software version, tenant ID, and developer support details.
13. **Danger Zone**: Full club wipe utility for fresh openings.

---

# 15. 🩺 System Health & Live Diagnostics

The Owner can verify system status anytime from:

**Settings → System Health & Diagnostics**

The screen displays:
* 🟢 **Cloud Database**: Connected (`firestore.googleapis.com`)
* 🟢 **Ping Latency**: Live latency in milliseconds (typically 30–80 ms)
* 🟢 **Offline Storage**: Active local cache status
* 🟢 **Browser Memory**: Application heap and operational state

### Terminal Self-Test
You can also run the built-in automated test suite from the terminal anytime:
```bash
npm test
```
This tests 48 critical functions including table fee rounding, member VIP discounts, credit risk badging, WhatsApp reminder formatting, and Excel CSV exports.

---

# 16. ⚠️ Full Club Reset (Danger Zone)

The **Full Club Reset** is a high-privilege administrative operation.

Use it only when you intentionally want to remove test sales data before your official grand opening:

1. Go to **Settings → Danger Zone**.
2. Click **Full Club Reset**.
3. The system requires typing the exact confirmation keyword:
   ```text
   RESET ONESHOT
   ```
4. Click **Permanently Delete Data**.

> ⚠️ **WARNING**: Never use Full Club Reset during daily operation. Always download a complete JSON backup before performing any reset.

---

# 17. 👥 Staff Roles & Permissions

### 👑 Owner
* Full unrestricted system control
* Station rates & pricing rules
* Staff accounts & role assignments
* Complete financial reports & profit engine
* Backups, restore & club reset

### 💼 Manager
* Daily desk operations supervision
* Staff check-in / check-out attendance
* Shift financial reports & expense recording
* Station rate viewing & stock inspection

### 💵 Cashier / Desk
* Starting & stopping table timers
* Adding snack orders to tables
* Checkout billing & settling payments
* Collecting customer credit dues
* Printing receipts

### 👨‍🍳 Kitchen Staff
* Kitchen Display Screen (KDS) order queue
* Viewing incoming snacks and drink orders
* Updating preparation status (`Preparing` ➔ `Served`)

---

# 18. 🔒 Basic Security Rules

For smooth and safe club operations:

* **Never share your password.**
* Do not share the Owner account with cashiers or markers.
* Each staff member should check in under their own account.
* Lock the counter computer (`Windows Key + L`) when leaving the desk unattended.
* Do not alter station rates without Owner approval.
* Download a JSON backup at the end of each week.

---

# 19. 🆘 Troubleshooting & FAQs

### What if the internet goes down?
CueDesk is built with offline resilience. Running timers and active tables will continue operating locally on your computer. When internet connectivity returns, Firestore synchronizes automatically in the background.

### A payment looks incorrect
Do not charge the customer twice. Open **Reports ➔ Session History** to inspect the settled bill, duration, and food items.

### The page feels frozen or slow
1. Press `Ctrl + Shift + R` (or `Cmd + Shift + R` on Mac) to perform a hard refresh.
2. Check your internet connection.
3. Open **Settings ➔ System Health** to verify database connectivity.

---

# 20. 📞 CueDesk Technical Support

For assistance, custom rate structures, or feature requests, contact CueDesk technical support:

* **Developer Email**: `sumitdevthakur@gmail.com`
* **Repository**: [`sumit07122/cuedesk-rocket147`](https://github.com/sumit07122/cuedesk-rocket147.git)

When reporting an issue, please share:
1. What action was being performed
2. Which table, customer, or receipt was involved
3. Approximate time
4. Screenshot of the screen or error message

---

# 🎱 Daily Counter Quick Flow

```text
[START SESSION]
Dashboard ➔ Table Card ➔ Start Session ➔ Customer Name ➔ Verify Rate ➔ Start!

[DURING PLAY]
Table Card ➔ + Snacks ➔ Select Items ➔ Add to Bill ➔ Kitchen prepares order

[CHECKOUT]
Table Card ➔ End Session ➔ Review Total ➔ Select Cash/UPI/Card/Udhaar ➔ Settle & Print Receipt

[UDHAAR / CREDIT]
Checkout (Pay Later) ➔ Customer CRM ➔ Credit Ledger ➔ WhatsApp Reminder / Settle Old Due
```

---

## ✅ One Shot CueDesk
**One system. One dashboard. Built for precision club operations.**
