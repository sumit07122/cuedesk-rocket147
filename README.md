# CueDesk – Enterprise Snooker & Pool Club Management SaaS

CueDesk is a cloud-native, multi-tenant SaaS management platform built for modern cue sports lounges, snooker arenas, and pool halls. Designed with offline-resilient Firestore synchronization, fine-grained role-based access control (RBAC), and flexible subscription tiered capacity limits.

---

## 🚀 Key Features & Architectural Capabilities

### 1. Multi-Tenant Workspace Isolation & SaaS Plan Tiers
- **Dynamic Club Switcher**: Seamlessly toggle between multiple cue sports lounge workspaces without losing active state.
- **Onboarding Wizard**: Self-service 2-step onboarding flow for launching new club workspaces with customized currency, time zones, default hourly rates, and initial table configurations.
- **Subscription Plan Enforcement**:
  - **Starter**: 4 Tables Max, 3 Staff Members ($29/mo).
  - **Professional**: 12 Tables Max, 10 Staff Members ($79/mo).
  - **Enterprise**: Unlimited Tables, Unlimited Staff ($199/mo).
- **Super Admin HQ Console**: Platform-wide metrics (MRR, Total Workspaces, Tables Managed), trial extensions (+14 days), instant plan switching, feature flag overrides, and system telemetry audit logs.

### 2. Live Table & Billing Management Engine
- **Visual Table Matrix**: Real-time status badges (`Available`, `Occupied`, `Reserved`, `Maintenance`) with high-contrast color indicators.
- **Precision Billing Counter**: Millisecond-accurate billing timer calculated dynamically against table hourly rates and peak-hour pricing rules.
- **Food & Snack Integration**: In-session ordering for kitchen items with instant bill tab updates and stock inventory deduction.
- **Flexible Checkout**: Multi-method payments (Cash, Credit Card, UPI, Membership Credits, Split Bills) with instant PDF/printable receipt modal.

### 3. CRM, Memberships & Snack Kitchen Inventory
- **Customer CRM**: Member tiers (Gold, Silver, Bronze, VIP) with discount percentage enforcement on session rates.
- **Kitchen & Snack POS**: Item category filters, low-stock thresholds, and reorder purchase logs.
- **Employee Shift & Duty Logs**: Staff check-in/check-out logs, role assignments (Owner, Manager, Cashier), and activity audit trails.

### 4. PWA & Mobile Self-Service View
- **Customer Self-Service QR Mode**: Mobile-optimized touch interface for guests to view active table timers, order snacks directly to their table, and request staff assistance.
- **Responsive Layout**: Touch-optimized 44px+ controls, safe area inset padding, and seamless viewport adaptation across iOS Safari and Android Chrome.

---

## 📁 Folder Structure Overview

```
cuedesk/
├── firestore.rules               # Firestore security rules with multi-tenant isolation
├── firebase-blueprint.json       # Blueprint for collections and security schemas
├── metadata.json                 # Application name, capabilities, and permissions
├── .env.example                  # Environment variable declaration reference
├── package.json                  # Dependencies & production build scripts
├── vite.config.ts                # Vite build and server configuration
├── src/
│   ├── main.tsx                  # Application React 18 DOM root
│   ├── App.tsx                   # Main layout container & page router
│   ├── types.ts                  # Shared TypeScript interfaces & SaaS plan types
│   ├── context/
│   │   └── AuthContext.tsx       # Firebase authentication & RBAC provider
│   ├── hooks/
│   │   └── useRealtimeClubData.ts# Real-time Firestore hooks for multi-tenant data
│   ├── services/
│   │   ├── firebase.ts           # Firebase SDK initialization & auth setup
│   │   └── dbService.ts          # Firestore CRUD, transactions & SaaS workspace APIs
│   ├── data/
│   │   ├── mockData.ts           # Fallback initial seeds & business defaults
│   │   └── saasPlans.ts          # SaaS subscription plan tiers & starter profiles
│   ├── utils/
│   │   ├── errorHandler.ts       # Structured error logging & monitoring telemetry
│   │   ├── rateLimiter.ts        # Client-side rate limiting for API safety
│   │   ├── validation.ts        # Input validation helpers
│   │   └── monitoring.ts        # Health check telemetry logger
│   └── components/
│       ├── auth/                 # Sign-in & Authentication views
│       ├── dashboard/            # Table grid matrix & session drawer
│       ├── pos/                  # Snack POS & Food Ordering view
│       ├── crm/                  # Customer CRM & Membership tiers
│       ├── staff/                # Employee attendance & shift logs
│       ├── expenses/             # Operational expenses & profit tracker
│       ├── maintenance/          # Table repair & technician logs
│       ├── reports/              # Analytics, peak hours & data exports
│       ├── settings/             # Business settings & SaaS subscription manager
│       ├── saas/                 # Workspace Switcher, Onboarding Modal & Super Admin HQ
│       ├── navigation/           # Navbar, Sidebar & Mobile Navigation
│       └── ui/                   # Reusable UI primitives (Button, Card, Badge, Modal, Input)
```

---

## 🗄️ Database Schema & Firestore Collections

Data is strictly scoped under tenant-isolated documents:

### Multi-Tenant Path: `/saasClubs/{clubId}`
- `id`: string (e.g. `club-royal-cue`)
- `clubName`: string
- `ownerId`: string
- `planId`: `'starter' | 'professional' | 'enterprise'`
- `subscriptionStatus`: `'active' | 'trial' | 'expired' | 'cancelled'`
- `trialStartDate`: number (timestamp)
- `trialEndDate`: number (timestamp)
- `featureFlags`: `{ foodOrdering, inventory, crmMemberships, maintenance, employeeAttendance, expensesNetProfit, analyticsExport, tournamentModule }`

### Scoped Club Subcollections: `/clubs/{clubId}/...`
1. `/clubs/{clubId}/settings/config`: Business profile, hourly rates, taxes, currency.
2. `/clubs/{clubId}/tables`: Live table objects (`status`, `type`, `hourlyRate`, `activeSession`).
3. `/clubs/{clubId}/menuItems`: Snack items, category, stock count, cost price.
4. `/clubs/{clubId}/sessionHistory`: Completed table sessions (`startTime`, `endTime`, `durationMinutes`, `totalAmount`, `paymentMethod`).
5. `/clubs/{clubId}/customers`: Member directory (`name`, `phone`, `tier`, `discountPct`, `totalSpent`).
6. `/clubs/{clubId}/employees`: Staff profiles (`name`, `role`, `shiftStatus`).
7. `/clubs/{clubId}/expenses`: Operational cost records (`category`, `amount`, `date`).
8. `/clubs/{clubId}/maintenanceRecords`: Table repair flags & technician logs.
9. `/clubs/{clubId}/auditLogs`: System security & activity telemetry logs.

---

## 🛠️ Installation & Local Development Guide

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-org/cuedesk.git
cd cuedesk
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your Firebase Web Credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Run Development Server
```bash
npm run dev
```
Access the application locally at `http://localhost:3000`.

---

## 🚢 Deployment Guide (Vercel & Firebase)

### Deploying to Vercel
1. Push your repository to GitHub / GitLab.
2. Connect your repository in Vercel Dashboard.
3. Configure Environment Variables in Vercel Project Settings matching `.env.example`.
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Deploy!

### Deploying Firestore Security Rules
Ensure rules are updated via Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 🔒 Security & Role Permissions Matrix

| Feature / Action | Owner | Manager | Cashier | Customer QR Mode |
| :--- | :---: | :---: | :---: | :---: |
| Live Table Timer & Billing | ✅ | ✅ | ✅ | 👁 Read-Only |
| Food POS & Snack Ordering | ✅ | ✅ | ✅ | ✅ Self-Service |
| Process Session Payments | ✅ | ✅ | ✅ | ❌ |
| Customer CRM & Memberships | ✅ | ✅ | 👁 Read-Only | ❌ |
| Table Rates & Menu Config | ✅ | ✅ | ❌ | ❌ |
| Staff Attendance & Duty Logs | ✅ | ✅ | ❌ | ❌ |
| Expenses & Profit Analytics | ✅ | ✅ | ❌ | ❌ |
| SaaS Plan & Super Admin HQ | ✅ | ❌ | ❌ | ❌ |

---

## ✅ Deployment Readiness Checklist

- [x] **Compile Verification**: Zero TypeScript errors during `npm run build`.
- [x] **Lint Verification**: ESLint & `tsc --noEmit` pass with zero defects.
- [x] **Firebase Security Rules**: Deployed and enforcing multi-tenant `/saasClubs` & `/clubs/{clubId}` rules.
- [x] **Multi-Tenant Isolation**: Verified complete data segregation across club workspaces.
- [x] **Capacity Controls**: Enforced plan table and employee caps with friendly upgrade prompts.
- [x] **Touch & Safe-Area Support**: Responsive layout optimized for mobile Safari & Android Chrome.
- [x] **PWA Install Ready**: Web manifest and viewport headers set for standalone app usage.

---

*CueDesk SaaS Platform — Engineered for Precision & Scale.*
