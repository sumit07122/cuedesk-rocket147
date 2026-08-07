/**
 * CueDesk Backup & Recovery Service
 * Allows full club database export, snapshot verification, and atomic restoration.
 */

import { db } from '../lib/firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { BusinessConfig, TableItem, MenuItem, SessionHistoryItem, TopCustomer, FoodOrder, PurchaseRecord, InventoryAdjustment, AuditLogItem } from '../types';

export interface ClubBackupSnapshot {
  version: string;
  exportedAt: number;
  clubId: string;
  config?: BusinessConfig;
  tables: TableItem[];
  menuItems: MenuItem[];
  history: SessionHistoryItem[];
  customers: TopCustomer[];
  foodOrders: FoodOrder[];
  purchaseRecords: PurchaseRecord[];
  inventoryAdjustments: InventoryAdjustment[];
  auditLogs: AuditLogItem[];
}

export async function exportClubBackup(clubId: string): Promise<ClubBackupSnapshot> {
  const snapshot: ClubBackupSnapshot = {
    version: '1.0.0',
    exportedAt: Date.now(),
    clubId,
    tables: [],
    menuItems: [],
    history: [],
    customers: [],
    foodOrders: [],
    purchaseRecords: [],
    inventoryAdjustments: [],
    auditLogs: [],
  };

  try {
    // 1. Config
    const configSnap = await getDocs(collection(db, 'clubs', clubId, 'config'));
    configSnap.forEach((docSnap) => {
      if (docSnap.id === 'settings') {
        snapshot.config = docSnap.data() as BusinessConfig;
      }
    });

    // 2. Tables
    const tablesSnap = await getDocs(collection(db, 'clubs', clubId, 'tables'));
    tablesSnap.forEach((docSnap) => {
      snapshot.tables.push({ id: docSnap.id, ...docSnap.data() } as TableItem);
    });

    // 3. Menu Items
    const menuSnap = await getDocs(collection(db, 'clubs', clubId, 'menuItems'));
    menuSnap.forEach((docSnap) => {
      snapshot.menuItems.push({ id: docSnap.id, ...docSnap.data() } as MenuItem);
    });

    // 4. Session History
    const historySnap = await getDocs(collection(db, 'clubs', clubId, 'history'));
    historySnap.forEach((docSnap) => {
      snapshot.history.push({ id: docSnap.id, ...docSnap.data() } as SessionHistoryItem);
    });

    // 5. Customers
    const custSnap = await getDocs(collection(db, 'clubs', clubId, 'customers'));
    custSnap.forEach((docSnap) => {
      snapshot.customers.push({ id: docSnap.id, ...docSnap.data() } as TopCustomer);
    });

    // 6. Food Orders
    const foodSnap = await getDocs(collection(db, 'clubs', clubId, 'foodOrders'));
    foodSnap.forEach((docSnap) => {
      snapshot.foodOrders.push({ id: docSnap.id, ...docSnap.data() } as FoodOrder);
    });

    // 7. Purchase Records
    const purSnap = await getDocs(collection(db, 'clubs', clubId, 'purchaseRecords'));
    purSnap.forEach((docSnap) => {
      snapshot.purchaseRecords.push({ id: docSnap.id, ...docSnap.data() } as PurchaseRecord);
    });

    // 8. Inventory Adjustments
    const adjSnap = await getDocs(collection(db, 'clubs', clubId, 'inventoryAdjustments'));
    adjSnap.forEach((docSnap) => {
      snapshot.inventoryAdjustments.push({ id: docSnap.id, ...docSnap.data() } as InventoryAdjustment);
    });

    // 9. Audit Logs
    const logSnap = await getDocs(collection(db, 'clubs', clubId, 'auditLogs'));
    logSnap.forEach((docSnap) => {
      snapshot.auditLogs.push({ id: docSnap.id, ...docSnap.data() } as AuditLogItem);
    });

    return snapshot;
  } catch (err) {
    console.error('Error exporting club backup:', err);
    throw new Error('Failed to generate complete club backup file.');
  }
}

export function downloadBackupFile(snapshot: ClubBackupSnapshot): void {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(snapshot, null, 2)
  )}`;
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', `cuedesk_backup_${snapshot.clubId}_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export async function restoreClubBackup(
  clubId: string,
  backup: ClubBackupSnapshot
): Promise<{ success: boolean; count: number; message: string }> {
  if (!backup || !backup.clubId || backup.clubId !== clubId) {
    throw new Error('Invalid backup file or club ID mismatch.');
  }

  let totalRestored = 0;
  const batch = writeBatch(db);

  // Restore Config
  if (backup.config) {
    const configRef = doc(db, 'clubs', clubId, 'config', 'settings');
    batch.set(configRef, { ...backup.config, clubId });
    totalRestored++;
  }

  // Restore Tables
  if (Array.isArray(backup.tables)) {
    backup.tables.forEach((tbl) => {
      const ref = doc(db, 'clubs', clubId, 'tables', tbl.id);
      batch.set(ref, { ...tbl, clubId });
      totalRestored++;
    });
  }

  // Restore Menu Items
  if (Array.isArray(backup.menuItems)) {
    backup.menuItems.forEach((item) => {
      const ref = doc(db, 'clubs', clubId, 'menuItems', item.id);
      batch.set(ref, { ...item, clubId });
      totalRestored++;
    });
  }

  await batch.commit();

  return {
    success: true,
    count: totalRestored,
    message: `Successfully restored ${totalRestored} database records for club ${clubId}.`,
  };
}
