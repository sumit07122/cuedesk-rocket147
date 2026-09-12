import { UserRole } from '../../types';

// Preset Quick Login Credential Configuration
export interface PresetRoleCredential {
  role: UserRole | 'kitchen';
  title: string;
  email: string;
  pass: string;
  badge: string;
  color: string;
}

export const DEFAULT_PRESET_CREDENTIALS: PresetRoleCredential[] = [
  {
    role: 'owner',
    title: 'Owner',
    email: 'owner@oneshotsnooker.com',
    pass: 'owner123',
    badge: 'Full Privilege',
    color: 'from-amber-500 to-amber-400 text-black',
  },
  {
    role: 'manager',
    title: 'Manager',
    email: 'manager@oneshotsnooker.com',
    pass: 'manager123',
    badge: 'Reports & Expenses',
    color: 'from-emerald-500 to-emerald-400 text-black',
  },
  {
    role: 'cashier',
    title: 'Cashier / Desk',
    email: 'cashier@oneshotsnooker.com',
    pass: 'cashier123',
    badge: 'Tables & Checkout',
    color: 'from-blue-500 to-blue-400 text-black',
  },
  {
    role: 'kitchen',
    title: 'Kitchen Staff',
    email: 'kitchen@oneshotsnooker.com',
    pass: 'kitchen123',
    badge: 'KDS Display',
    color: 'from-purple-500 to-purple-400 text-black',
  },
];
