import { UserRole, PageView } from '../types';
import { logAuditEvent } from '../services/dbService';

export type Capability = 
  | 'manage_tables'
  | 'start_sessions'
  | 'end_sessions'
  | 'manage_employees'
  | 'change_settings'
  | 'view_reports'
  | 'manage_payments'
  | 'manage_inventory'
  | 'manage_customers'
  | 'manage_memberships'
  | 'apply_discounts'
  | 'issue_refunds'
  | 'edit_completed_bills'
  | 'change_pricing'
  | 'delete_club';

// Allowed capabilities by role
const ROLE_CAPABILITIES: Record<UserRole, Capability[]> = {
  owner: [
    'manage_tables',
    'start_sessions',
    'end_sessions',
    'manage_employees',
    'change_settings',
    'view_reports',
    'manage_payments',
    'manage_inventory',
    'manage_customers',
    'manage_memberships',
    'apply_discounts',
    'issue_refunds',
    'edit_completed_bills',
    'change_pricing',
    'delete_club'
  ],
  manager: [
    'manage_tables',
    'start_sessions',
    'end_sessions',
    'view_reports',
    'manage_payments',
    'manage_inventory',
    'manage_customers',
    'manage_memberships',
    'apply_discounts'
  ],
  cashier: [
    'start_sessions',
    'end_sessions',
    'manage_payments',
    'manage_customers'
  ],
  kitchen: [
    'manage_inventory'
  ]
};

// Pages allowed per role
const ROLE_ALLOWED_PAGES: Record<UserRole, PageView[]> = {
  owner: [
    'dashboard', 
    'tables', 
    'table-details', 
    'billing', 
    'menu-inventory', 
    'customers', 
    'employees', 
    'expenses', 
    'maintenance', 
    'reports', 
    'settings', 
    'kds',
    'login'
  ],
  manager: [
    'dashboard', 
    'tables', 
    'table-details', 
    'billing', 
    'menu-inventory', 
    'customers', 
    'expenses', 
    'maintenance', 
    'reports', 
    'kds',
    'login'
  ],
  cashier: [
    'dashboard', 
    'tables', 
    'table-details', 
    'billing', 
    'menu-inventory', 
    'customers', 
    'kds',
    'login'
  ],
  kitchen: [
    'kds',
    'menu-inventory',
    'login'
  ]
};

/**
  Check if a given role has permission to perform an action/capability.
 */
export function hasCapability(role: UserRole | undefined, capability: Capability): boolean {
  if (!role) return false;
  return ROLE_CAPABILITIES[role]?.includes(capability) ?? false;
}

/**
  Check if a role can access a specific page/route.
 */
export function canAccessPage(role: UserRole | undefined, page: PageView): boolean {
  if (!role) return false;
  if (page === 'login') return true;
  return ROLE_ALLOWED_PAGES[role]?.includes(page) ?? false;
}

/**
  Log a permission denied attempt to Firestore Audit Logs.
 */
export function recordPermissionDenied(
  clubId: string, 
  userEmail: string, 
  role: UserRole, 
  attemptedActionOrPage: string
) {
  logAuditEvent(
    clubId,
    'PERMISSION_DENIED',
    userEmail,
    `Role '${role.toUpperCase()}' attempted unauthorized action/page: ${attemptedActionOrPage}`
  );
}
