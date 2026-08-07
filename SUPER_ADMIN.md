# CueDesk Super Admin Platform Architecture & Documentation

The **CueDesk Super Admin Portal** is an isolated, high-security master management platform built exclusively for CueDesk system administrators. It operates independently from tenant club workspaces while maintaining real-time telemetry over multi-tenant databases.

---

## 🔒 Security & Access Control

### Role-Based Authorization
Access to the Super Admin Portal is strictly restricted to accounts with system-level administrator privileges.
- **Role Verification**: Requests are authorized against administrative credentials in Firebase Auth and Firestore user records (`role === 'owner'` or `isSuperAdmin === true`).
- **Route Authorization**: The `/super-admin` route is guarded and unavailable to standard club managers, cashiers, or customer QR sessions.

### Audit Telemetry
Every single administrative action performed in the Super Admin Portal is logged permanently to the `/saasAuditLogs` collection in Firestore:
- **Action Type** (e.g. `PLAN_UPGRADED`, `TRIAL_EXTENDED`, `CLUB_SUSPENDED`, `PASSWORD_RESET`, `WORKSPACE_IMPERSONATED`, `ANNOUNCEMENT_CREATED`).
- **Performing Admin** ID / Email.
- **Target Club Workspace** ID.
- **Action Details** & ISO Timestamp.

---

## 🚀 Key Modules & Capabilities

### 1. Platform Dashboard & Operational Telemetry
- **Workspace Metrics**: Realtime totals for registered clubs, active paid subscriptions, trial workspaces, suspended clubs, total active tables, and estimated Monthly Recurring Revenue (MRR).
- **System Health Status**: Visual health indicators tracking database latency, authentication service uptime, and real-time synchronization state.
- **Session Volume Stream**: Visual Area Charts (powered by Recharts) monitoring table sessions and hourly game volume across all lounges.

### 2. Multi-Tenant Club Management
- **Workspaces Directory**: Complete table listing of all registered cue clubs with real-time capacity and subscription status indicators.
- **Filters & Search**: Fast search by club name, tenant ID, or owner email, plus plan and status filters.
- **Profile Modal**: Detailed view of club owner contacts, address, subscription renewal dates, and table capacity.
- **Administrative Actions**:
  - **Suspend / Reactivate**: Instantly lock or restore access for overdue or non-compliant club accounts.
  - **Password Reset**: Issue secure 8-character temporary passwords for club owners during support cases.
  - **Impersonation**: Securely switch workspace context into any club for troubleshooting, accompanied by an automatic audit trail entry.
  - **Delete Workspace**: Permanent removal of club workspace records with confirmation modals.

### 3. Subscription Tier Management
- **Plan Configuration**: Dynamic adjustments for **Starter** ($29/mo), **Professional** ($79/mo), and **Enterprise** ($199/mo) plans.
- **Capacity Controls**: Set global caps on max tables, staff accounts, storage quotas (MB), and default enabled modules.

### 4. Feature Flag Matrix
- **Module Permissions**: Enable or disable specific modules globally or on a per-club basis:
  - Food Ordering & Snack POS
  - Food Inventory & Purchase Logs
  - Customer CRM & Member Tiers
  - Table Repair & Technician Flags
  - Employee Shift & Attendance Logs
  - Expenses & Profit Tracking
  - Analytics & Data Exports
  - Tournament & League Bracket Engine

### 5. Support Tools & Diagnostics Engine
- **Club Support Search**: Select any club to view real-time configuration snapshots and active feature flags.
- **One-Click Diagnostics Export**: Generates a downloadable JSON report containing system health, database latency, active table matrix state, and error logs for customer support cases.

### 6. Platform Announcements System
- **Global Broadcast Alerts**: Create system-wide announcements with customizable severity levels (`Info`, `Warning`, `Urgent`).
- **Live Banner Injection**: Announcements appear in real-time as notification banners across all active club workspace headers.
- **Status Toggles**: Instantly activate or archive past alerts.

### 7. Platform Analytics
- **Visual Growth Charts**:
  - New Club Registrations & MRR Growth Trajectory (Bar Chart).
  - Module Feature Adoption Rate % (Horizontal Bar Chart).
  - Live Session Volume Trends.

---

## 🗄️ Firestore Collections Schema (Super Admin)

```
/saasClubs/{clubId}
  ├── id: string
  ├── clubName: string
  ├── ownerId: string
  ├── planId: 'starter' | 'professional' | 'enterprise'
  ├── subscriptionStatus: 'active' | 'trial' | 'expired' | 'cancelled'
  ├── status: 'active' | 'suspended'
  ├── trialStartDate: number
  ├── trialEndDate: number
  └── featureFlags: FeatureFlags

/saasAuditLogs/{logId}
  ├── id: string
  ├── action: string
  ├── performedBy: string
  ├── targetClubId: string
  ├── details: string
  └── timestamp: number

/saasAnnouncements/{announcementId}
  ├── id: string
  ├── title: string
  ├── content: string
  ├── severity: 'info' | 'warning' | 'urgent'
  ├── createdAt: number
  ├── active: boolean
  └── createdBy: string
```

---

*CueDesk Super Admin Portal — Enterprise Multitenancy & Platform Operations.*
