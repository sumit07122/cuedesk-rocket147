import { 
  collection, 
  doc, 
  getDoc, 
  getDocFromServer,
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  orderBy, 
  addDoc,
  limit,
  serverTimestamp,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  TableItem, 
  MenuItem, 
  SessionHistoryItem, 
  TopCustomer, 
  BusinessConfig, 
  SessionData, 
  OrderItem,
  SessionRequest,
  AuditLogItem,
  FoodOrder,
  PurchaseRecord,
  InventoryAdjustment,
  FoodOrderStatus,
  EmployeeUser,
  AttendanceRecord,
  ExpenseRecord,
  MaintenanceRecord,
  NotificationItem,
  UserRole,
  UserProfile,
  UserInvitation,
  SaaSClubProfile,
  SubscriptionPlanId,
  FeatureFlags,
  PlatformAnnouncement,
  SuperAdminAuditLog
} from '../types';
import { 
  initialBusinessConfig, 
  initialMenuItems, 
  initialTables, 
  initialSessionHistory, 
  initialTopCustomers,
  initialEmployees,
  initialAttendance,
  initialExpenses,
  initialMaintenanceRecords,
  initialNotifications
} from '../data/mockData';
import { INITIAL_SAAS_CLUBS, SUBSCRIPTION_PLANS } from '../data/saasPlans';
import { handleFirestoreError, OperationType } from '../utils/errorHandler';
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '../utils/rateLimiter';
import { validateCustomerName, validatePhone, validatePrice, validateStockQuantity, validateTableNumber } from '../utils/validation';
import { getDeviceInfo, trackMonitoringEvent } from '../utils/monitoring';

export const DEFAULT_CLUB_ID = 'club-royal-cue';

// Validate connection to Firestore gracefully
export const testFirestoreConnection = async (): Promise<boolean> => {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore connection check: Client is operating in offline mode.");
    }
    return false;
  }
};

/**
 * Recursively removes any keys with `undefined` values from an object or array.
 * Firestore throws an error if written data contains `undefined`.
 */
export function sanitizeDataForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeDataForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const sanitized: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      const val = (data as Record<string, any>)[key];
      if (val !== undefined) {
        sanitized[key] = sanitizeDataForFirestore(val);
      }
    }
    return sanitized as T;
  }
  return data;
}

/**
 * Ensures the specified club has initial data populated in Firestore.
 */
export const ensureClubInitialized = async (clubId: string = DEFAULT_CLUB_ID, clubName?: string, force: boolean = false): Promise<void> => {
  try {
    const configRef = doc(db, 'clubs', clubId, 'config', 'settings');
    let configSnap;
    try {
      configSnap = await getDoc(configRef);
    } catch (offlineErr) {
      console.warn(`Firestore unreachable or offline during init for club ${clubId}. Using local fallback.`, offlineErr);
      return;
    }

    if (!configSnap.exists() || force) {
      const batch = writeBatch(db);

      // 1. Initialize Club Settings
      const newConfig: BusinessConfig = {
        ...initialBusinessConfig,
        clubName: clubName || (clubId === DEFAULT_CLUB_ID ? 'One Shot Snooker Gaming Club' : `${clubId.toUpperCase()} Cue Sports`),
      };
      batch.set(configRef, newConfig, { merge: true });

      // 2. Initialize Tables
      initialTables.forEach((tbl) => {
        const tblRef = doc(db, 'clubs', clubId, 'tables', tbl.id);
        batch.set(tblRef, { ...tbl, clubId }, { merge: true });
      });

      // 3. Initialize Menu Items
      initialMenuItems.forEach((item) => {
        const itemRef = doc(db, 'clubs', clubId, 'menuItems', item.id);
        batch.set(itemRef, { ...item, clubId }, { merge: true });
      });

      // 4. Initialize History (only if force seeding initially)
      if (!configSnap.exists()) {
        initialSessionHistory.forEach((hist) => {
          const histRef = doc(db, 'clubs', clubId, 'history', hist.id);
          batch.set(histRef, { ...hist, clubId }, { merge: true });
        });

        // 5. Initialize Top Customers
        initialTopCustomers.forEach((cust) => {
          const custRef = doc(db, 'clubs', clubId, 'customers', cust.id);
          batch.set(custRef, { ...cust, clubId }, { merge: true });
        });
      }

      await batch.commit();
      console.log(`Successfully seeded Firestore data for club: ${clubId}`);
    }
  } catch (error) {
    console.warn(`Note initializing club data for ${clubId}:`, error);
  }
};

// --- CLUB SETTINGS ---

export const subscribeClubSettings = (
  clubId: string, 
  callback: (config: BusinessConfig) => void
) => {
  const configRef = doc(db, 'clubs', clubId, 'config', 'settings');
  return onSnapshot(configRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as BusinessConfig);
    } else {
      callback(initialBusinessConfig);
    }
  }, (err) => {
    console.warn('subscribeClubSettings permission or network issue:', err);
  });
};

export const updateClubSettings = async (clubId: string, config: Partial<BusinessConfig>): Promise<void> => {
  const configRef = doc(db, 'clubs', clubId, 'config', 'settings');
  await setDoc(configRef, config, { merge: true });
};

// --- TABLES ---

export const subscribeTables = (
  clubId: string, 
  callback: (tables: TableItem[]) => void
) => {
  const tablesRef = collection(db, 'clubs', clubId, 'tables');
  const q = query(tablesRef, orderBy('number', 'asc'));

  return onSnapshot(q, async (snapshot) => {
    if (snapshot.empty) {
      const batch = writeBatch(db);
      initialTables.forEach((tbl) => {
        const tblRef = doc(db, 'clubs', clubId, 'tables', tbl.id);
        batch.set(tblRef, { ...tbl, clubId });
      });
      try {
        await batch.commit();
      } catch (e) {
        console.warn('Auto seed initialTables error:', e);
      }
      callback(initialTables);
      return;
    }

    const tables: TableItem[] = [];
    snapshot.forEach((docSnap) => {
      tables.push({ id: docSnap.id, ...docSnap.data() } as TableItem);
    });
    callback(tables);
  }, (err) => {
    console.warn('subscribeTables permission or network issue:', err);
  });
};

export const saveTable = async (clubId: string, table: TableItem): Promise<void> => {
  const tableRef = doc(db, 'clubs', clubId, 'tables', table.id);
  await setDoc(tableRef, sanitizeDataForFirestore({ ...table, clubId }), { merge: true });
};

export const updateTableStatus = async (
  clubId: string, 
  tableId: string, 
  status: TableItem['status'], 
  currentSession?: SessionData | null
): Promise<void> => {
  const tableRef = doc(db, 'clubs', clubId, 'tables', tableId);
  const updateData: any = { status };
  if (currentSession !== undefined) {
    updateData.currentSession = currentSession ? sanitizeDataForFirestore(currentSession) : null;
  }
  await updateDoc(tableRef, updateData);
};

export const deleteTableDoc = async (clubId: string, tableId: string): Promise<void> => {
  const tableRef = doc(db, 'clubs', clubId, 'tables', tableId);
  await deleteDoc(tableRef);
};

// --- SESSIONS & BILLING ---

export const startTableSession = async (
  clubId: string, 
  tableId: string, 
  session: SessionData
): Promise<void> => {
  const tableRef = doc(db, 'clubs', clubId, 'tables', tableId);
  try {
    await runTransaction(db, async (transaction) => {
      const tableSnap = await transaction.get(tableRef);
      if (!tableSnap.exists()) {
        throw new Error(`Table ID ${tableId} not found.`);
      }
      const tableData = tableSnap.data() as TableItem;
      if (tableData.status === 'occupied' && tableData.currentSession) {
        throw new Error(`Table ${tableData.name} already has an active running session.`);
      }
      if (tableData.status === 'maintenance' || tableData.isMaintenance) {
        throw new Error(`Table ${tableData.name} is currently under maintenance.`);
      }

      transaction.update(tableRef, {
        status: 'occupied',
        currentSession: sanitizeDataForFirestore(session)
      });
    });

    await logAuditEvent(
      clubId,
      'SESSION_STARTED',
      session.customerName || 'Staff',
      `Session started on Table ${tableId} for ${session.customerName}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `clubs/${clubId}/tables/${tableId}`);
  }
};

export const togglePauseTableSession = async (
  clubId: string, 
  tableId: string, 
  currentSession: SessionData
): Promise<void> => {
  const tableRef = doc(db, 'clubs', clubId, 'tables', tableId);
  const now = Date.now();
  
  if (currentSession.isPaused) {
    // Resume
    const pausedDurationSeconds = currentSession.pausedAt ? Math.floor((now - currentSession.pausedAt) / 1000) : 0;
    const updatedSession: SessionData = {
      ...currentSession,
      isPaused: false,
      pausedAt: undefined,
      totalPausedSeconds: (currentSession.totalPausedSeconds || 0) + pausedDurationSeconds
    };
    await updateDoc(tableRef, { currentSession: sanitizeDataForFirestore(updatedSession) });
  } else {
    // Pause
    const updatedSession: SessionData = {
      ...currentSession,
      isPaused: true,
      pausedAt: now
    };
    await updateDoc(tableRef, { currentSession: sanitizeDataForFirestore(updatedSession) });
  }
};

export const addOrdersToSession = async (
  clubId: string, 
  tableId: string, 
  currentSession: SessionData, 
  newOrders: OrderItem[]
): Promise<void> => {
  const tableRef = doc(db, 'clubs', clubId, 'tables', tableId);
  const updatedOrders = [...(currentSession.foodOrders || []), ...newOrders];
  const updatedSession = { ...currentSession, foodOrders: updatedOrders };
  await updateDoc(tableRef, { currentSession: sanitizeDataForFirestore(updatedSession) });
};

export const requestTableCheckout = async (clubId: string, tableId: string): Promise<void> => {
  const tableRef = doc(db, 'clubs', clubId, 'tables', tableId);
  await updateDoc(tableRef, { status: 'payment_pending' });
};

export const finalizeSessionPayment = async (
  clubId: string, 
  historyRecord: SessionHistoryItem
): Promise<void> => {
  const rateLimit = checkRateLimit(`payment_${historyRecord.tableId}`, RATE_LIMIT_CONFIGS.PAYMENT_PROCESS.max, RATE_LIMIT_CONFIGS.PAYMENT_PROCESS.windowMs);
  if (!rateLimit.allowed) {
    throw new Error(`Rate limit exceeded. Please wait ${rateLimit.retryAfterSec}s before submitting payment again.`);
  }

  const histRef = doc(db, 'clubs', clubId, 'history', historyRecord.id);
  const tableRef = doc(db, 'clubs', clubId, 'tables', historyRecord.tableId);

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Verify history record doesn't already exist (prevent duplicate receipt/payment)
      const existingHist = await transaction.get(histRef);
      if (existingHist.exists()) {
        throw new Error(`Payment receipt #${historyRecord.receiptNo} has already been processed.`);
      }

      // 2. Set history record
      const payload = sanitizeDataForFirestore({ ...historyRecord, clubId, timestamp: new Date().toISOString() });
      transaction.set(histRef, payload);

      // 3. Reset table status
      transaction.update(tableRef, {
        status: 'available',
        currentSession: null
      });
    });

    await logAuditEvent(
      clubId,
      'PAYMENT_FINALIZED',
      historyRecord.processedBy || 'Cashier',
      `Payment of ${historyRecord.grandTotal} finalized for receipt #${historyRecord.receiptNo} (Table: ${historyRecord.tableName})`
    );
  } catch (error) {
    trackMonitoringEvent('failed_payment', `Payment finalization failed for receipt ${historyRecord.receiptNo}`, { error });
    handleFirestoreError(error, OperationType.WRITE, `clubs/${clubId}/history/${historyRecord.id}`);
  }
};

// --- MENU ITEMS ---

export const subscribeMenuItems = (
  clubId: string, 
  callback: (items: MenuItem[]) => void
) => {
  const menuRef = collection(db, 'clubs', clubId, 'menuItems');
  return onSnapshot(menuRef, (snapshot) => {
    const items: MenuItem[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() } as MenuItem);
    });
    callback(items);
  }, (err) => console.warn('subscribeMenuItems error:', err));
};

export const saveMenuItem = async (clubId: string, item: MenuItem): Promise<void> => {
  const itemRef = doc(db, 'clubs', clubId, 'menuItems', item.id);
  await setDoc(itemRef, { ...item, clubId }, { merge: true });
};

export const deleteMenuItemDoc = async (clubId: string, itemId: string): Promise<void> => {
  const itemRef = doc(db, 'clubs', clubId, 'menuItems', itemId);
  await deleteDoc(itemRef);
};

// --- HISTORY & REPORTS ---

export const subscribeHistory = (
  clubId: string, 
  callback: (history: SessionHistoryItem[]) => void
) => {
  const historyRef = collection(db, 'clubs', clubId, 'history');

  return onSnapshot(historyRef, (snapshot) => {
    const list: SessionHistoryItem[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as SessionHistoryItem);
    });
    list.sort((a, b) => {
      const timeA = a.endTime || a.startTime || 0;
      const timeB = b.endTime || b.startTime || 0;
      return timeB - timeA;
    });
    callback(list);
  }, (err) => console.warn('subscribeHistory error:', err));
};

export const clearHistoryAndAnalytics = async (
  clubId: string = DEFAULT_CLUB_ID,
  resetType: 'all' | 'history' | 'crm' = 'all'
): Promise<void> => {
  try {
    let collectionsToWipe: string[] = [];
    if (resetType === 'history') {
      collectionsToWipe = ['history', 'foodOrders', 'requests', 'auditLogs'];
    } else if (resetType === 'crm') {
      collectionsToWipe = ['customers'];
    } else {
      // 'all' Full Club Reset
      collectionsToWipe = [
        'history', 
        'foodOrders', 
        'requests', 
        'notifications', 
        'expenses', 
        'attendance', 
        'auditLogs', 
        'inventoryAdjustments',
        'purchases',
        'maintenance',
        'customers'
      ];
    }

    for (const colName of collectionsToWipe) {
      try {
        const colRef = collection(db, 'clubs', clubId, colName);
        const snap = await getDocs(colRef);
        if (!snap.empty) {
          const docs = snap.docs;
          for (let i = 0; i < docs.length; i += 400) {
            const batch = writeBatch(db);
            const chunk = docs.slice(i, i + 400);
            chunk.forEach((d) => batch.delete(d.ref));
            await batch.commit();
          }
        }
      } catch (colErr) {
        console.warn(`Could not wipe collection ${colName} (safe to ignore if offline):`, colErr);
      }
    }

    // Reset all tables to available and clear active sessions (for 'history' and 'all')
    if (resetType === 'history' || resetType === 'all') {
      try {
        const tablesRef = collection(db, 'clubs', clubId, 'tables');
        const tablesSnap = await getDocs(tablesRef);
        if (!tablesSnap.empty) {
          const tableBatch = writeBatch(db);
          tablesSnap.forEach((d) => {
            tableBatch.update(d.ref, {
              status: 'available',
              currentSession: null,
              isMaintenance: false
            });
          });
          await tableBatch.commit();
        }
      } catch (tblErr) {
        console.warn('Could not reset tables in Firestore (safe to ignore if offline):', tblErr);
      }
    }
  } catch (err) {
    console.error('Error in club data reset:', err);
    throw err;
  }
};

// --- CUSTOMERS ---

export const subscribeTopCustomers = (
  clubId: string, 
  callback: (customers: TopCustomer[]) => void
) => {
  const custRef = collection(db, 'clubs', clubId, 'customers');
  return onSnapshot(custRef, (snapshot) => {
    const list: TopCustomer[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as TopCustomer);
    });
    callback(list);
  }, (err) => console.warn('subscribeTopCustomers error:', err));
};

export const saveCustomerCRM = async (clubId: string, customer: TopCustomer): Promise<void> => {
  const custId = customer.id || doc(collection(db, 'clubs', clubId, 'customers')).id;
  const docRef = doc(db, 'clubs', clubId, 'customers', custId);
  await setDoc(docRef, { ...customer, id: custId, updatedAt: Date.now() }, { merge: true });
};

export const deleteCustomerCRM = async (clubId: string, customerId: string): Promise<void> => {
  const docRef = doc(db, 'clubs', clubId, 'customers', customerId);
  await deleteDoc(docRef);
};

// --- PHASE 7: EMPLOYEES MANAGEMENT ---

export const subscribeEmployees = (
  clubId: string,
  callback: (employees: EmployeeUser[]) => void
) => {
  const empRef = collection(db, 'clubs', clubId, 'employees');
  return onSnapshot(empRef, (snapshot) => {
    const list: EmployeeUser[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as EmployeeUser);
    });
    callback(list);
  }, (err) => console.warn('subscribeEmployees error:', err));
};

export const saveEmployee = async (clubId: string, employee: Partial<EmployeeUser>): Promise<string> => {
  const empId = employee.id || doc(collection(db, 'clubs', clubId, 'employees')).id;
  const docRef = doc(db, 'clubs', clubId, 'employees', empId);
  const payload = sanitizeDataForFirestore({
    ...employee,
    id: empId,
    clubId,
    joiningDate: employee.joiningDate || new Date().toISOString().split('T')[0],
    status: employee.status || 'active',
  });
  await setDoc(docRef, payload, { merge: true });
  return empId;
};

export const deleteEmployee = async (clubId: string, employeeId: string): Promise<void> => {
  const docRef = doc(db, 'clubs', clubId, 'employees', employeeId);
  await deleteDoc(docRef);
};

// --- PHASE 7: ATTENDANCE SYSTEM ---

export const subscribeAttendance = (
  clubId: string,
  callback: (records: AttendanceRecord[]) => void
) => {
  const attRef = collection(db, 'clubs', clubId, 'attendance');
  const q = query(attRef, orderBy('checkInTime', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list: AttendanceRecord[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as AttendanceRecord);
    });
    callback(list);
  }, (err) => console.warn('subscribeAttendance error:', err));
};

export const recordAttendanceCheckIn = async (
  clubId: string,
  employeeId: string,
  employeeName: string,
  employeeRole: UserRole,
  notes?: string
): Promise<string> => {
  const attRef = doc(collection(db, 'clubs', clubId, 'attendance'));
  const now = Date.now();
  const dateStr = new Date().toISOString().split('T')[0];
  const payload: AttendanceRecord = {
    id: attRef.id,
    clubId,
    employeeId,
    employeeName,
    employeeRole,
    checkInTime: now,
    date: dateStr,
    notes: notes || 'Checked in via CueDesk App'
  };
  await setDoc(attRef, payload);
  return attRef.id;
};

export const recordAttendanceCheckOut = async (
  clubId: string,
  attendanceId: string
): Promise<void> => {
  const docRef = doc(db, 'clubs', clubId, 'attendance', attendanceId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const data = snap.data() as AttendanceRecord;
    const now = Date.now();
    const durationMs = now - data.checkInTime;
    const workingHoursMinutes = Math.round(durationMs / (1000 * 60));
    await updateDoc(docRef, {
      checkOutTime: now,
      workingHoursMinutes
    });
  }
};

// --- PHASE 7: EXPENSES & PROFIT ---

export const subscribeExpenses = (
  clubId: string,
  callback: (records: ExpenseRecord[]) => void
) => {
  const expRef = collection(db, 'clubs', clubId, 'expenses');
  const q = query(expRef, orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list: ExpenseRecord[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as ExpenseRecord);
    });
    callback(list);
  }, (err) => console.warn('subscribeExpenses error:', err));
};

export const saveExpense = async (clubId: string, expense: Omit<ExpenseRecord, 'id'> & { id?: string }): Promise<string> => {
  const expId = expense.id || doc(collection(db, 'clubs', clubId, 'expenses')).id;
  const docRef = doc(db, 'clubs', clubId, 'expenses', expId);
  const payload = sanitizeDataForFirestore({
    ...expense,
    id: expId,
    clubId,
    timestamp: expense.timestamp || Date.now(),
    date: expense.date || new Date().toISOString().split('T')[0]
  });
  await setDoc(docRef, payload, { merge: true });
  return expId;
};

export const deleteExpense = async (clubId: string, expenseId: string): Promise<void> => {
  const docRef = doc(db, 'clubs', clubId, 'expenses', expenseId);
  await deleteDoc(docRef);
};

// --- PHASE 7: MAINTENANCE RECORDS ---

export const subscribeMaintenance = (
  clubId: string,
  callback: (records: MaintenanceRecord[]) => void
) => {
  const maintRef = collection(db, 'clubs', clubId, 'maintenance');
  const q = query(maintRef, orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list: MaintenanceRecord[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as MaintenanceRecord);
    });
    if (list.length === 0) {
      callback(initialMaintenanceRecords as MaintenanceRecord[]);
    } else {
      callback(list);
    }
  }, (err) => console.warn('subscribeMaintenance error:', err));
};

export const recordTableMaintenance = async (
  clubId: string,
  record: Omit<MaintenanceRecord, 'id'>
): Promise<string> => {
  const maintRef = doc(collection(db, 'clubs', clubId, 'maintenance'));
  const payload = sanitizeDataForFirestore({ ...record, id: maintRef.id, clubId });
  await setDoc(maintRef, payload);

  // Update table status to maintenance
  const tableRef = doc(db, 'clubs', clubId, 'tables', record.tableId);
  await updateDoc(tableRef, {
    status: 'maintenance',
    isMaintenance: true
  });

  return maintRef.id;
};

export const resolveTableMaintenance = async (
  clubId: string,
  tableId: string,
  maintenanceId: string
): Promise<void> => {
  const maintRef = doc(db, 'clubs', clubId, 'maintenance', maintenanceId);
  await updateDoc(maintRef, { resolvedAt: Date.now() });

  const tableRef = doc(db, 'clubs', clubId, 'tables', tableId);
  await updateDoc(tableRef, {
    status: 'available',
    isMaintenance: false
  });
};

// --- PHASE 7: IN-APP NOTIFICATIONS ---

export const subscribeNotifications = (
  clubId: string,
  callback: (notifications: NotificationItem[]) => void
) => {
  const notifRef = collection(db, 'clubs', clubId, 'notifications');
  const q = query(notifRef, orderBy('timestamp', 'desc'), limit(50));
  return onSnapshot(q, (snapshot) => {
    const list: NotificationItem[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as NotificationItem);
    });
    callback(list);
  }, (err) => console.warn('subscribeNotifications error:', err));
};

export const createNotification = async (
  clubId: string,
  notification: Omit<NotificationItem, 'id'>
): Promise<string> => {
  const docRef = doc(collection(db, 'clubs', clubId, 'notifications'));
  const payload: NotificationItem = {
    ...notification,
    id: docRef.id,
    clubId,
    timestamp: notification.timestamp || Date.now(),
    read: false
  };
  await setDoc(docRef, payload);
  return docRef.id;
};

export const markNotificationAsRead = async (
  clubId: string,
  notificationId: string
): Promise<void> => {
  const docRef = doc(db, 'clubs', clubId, 'notifications', notificationId);
  await updateDoc(docRef, { read: true });
};

export const clearAllNotifications = async (
  clubId: string,
  notificationIds: string[]
): Promise<void> => {
  for (const id of notificationIds) {
    const docRef = doc(db, 'clubs', clubId, 'notifications', id);
    await deleteDoc(docRef).catch(() => {});
  }
};

// --- CUSTOMER QR REQUESTS ---

export const subscribeSessionRequests = (
  clubId: string,
  callback: (requests: SessionRequest[]) => void
) => {
  const reqRef = collection(db, 'clubs', clubId, 'requests');
  const q = query(reqRef, orderBy('requestedAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const list: SessionRequest[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as SessionRequest);
    });
    callback(list);
  }, (err) => console.warn('subscribeSessionRequests error:', err));
};

export const createCustomerSessionRequest = async (
  clubId: string,
  tableId: string,
  customerName: string,
  customerPhone?: string,
  playersCount: number = 2
): Promise<void> => {
  // 1. Rate Limit
  const rateLimit = checkRateLimit(`qr_req_${tableId}`, RATE_LIMIT_CONFIGS.QR_SESSION_REQ.max, RATE_LIMIT_CONFIGS.QR_SESSION_REQ.windowMs);
  if (!rateLimit.allowed) {
    throw new Error(`Rate limit exceeded for session requests. Please try again in ${rateLimit.retryAfterSec}s.`);
  }

  // 2. Validate & Sanitize Input
  const nameVal = validateCustomerName(customerName);
  if (!nameVal.isValid) {
    throw new Error(nameVal.error || 'Invalid customer name.');
  }

  const phoneVal = validatePhone(customerPhone);
  if (!phoneVal.isValid) {
    throw new Error(phoneVal.error || 'Invalid phone number format.');
  }

  // 3. Verify Table Status
  const tableRef = doc(db, 'clubs', clubId, 'tables', tableId);
  const tableSnap = await getDoc(tableRef);
  if (!tableSnap.exists()) {
    throw new Error('Assigned table was not found or is disabled.');
  }

  const tableData = tableSnap.data() as TableItem;
  if (tableData.status === 'occupied' && tableData.currentSession) {
    throw new Error(`Table ${tableData.name} is currently occupied.`);
  }
  if (tableData.status === 'maintenance' || tableData.isMaintenance) {
    throw new Error(`Table ${tableData.name} is currently under maintenance.`);
  }

  // 4. Create request
  const reqRef = collection(db, 'clubs', clubId, 'requests');
  await addDoc(reqRef, {
    clubId,
    tableId,
    customerName: nameVal.sanitized,
    customerPhone: phoneVal.sanitized,
    playersCount: Math.min(Math.max(1, playersCount), 12),
    requestedAt: Date.now(),
    status: 'pending'
  });
};

export const approveCustomerSessionRequest = async (
  clubId: string,
  requestId: string,
  tableId: string,
  session: SessionData
): Promise<void> => {
  const batch = writeBatch(db);
  const reqRef = doc(db, 'clubs', clubId, 'requests', requestId);
  batch.update(reqRef, { status: 'approved' });

  const tableRef = doc(db, 'clubs', clubId, 'tables', tableId);
  batch.update(tableRef, {
    status: 'occupied',
    currentSession: session
  });

  await batch.commit();
};

export const rejectCustomerSessionRequest = async (
  clubId: string,
  requestId: string
): Promise<void> => {
  const reqRef = doc(db, 'clubs', clubId, 'requests', requestId);
  await updateDoc(reqRef, { status: 'rejected' });
};

// --- AUDIT LOGS ---

export const subscribeAuditLogs = (
  clubId: string,
  callback: (logs: AuditLogItem[]) => void
) => {
  const logsRef = collection(db, 'clubs', clubId, 'auditLogs');
  const q = query(logsRef, orderBy('timestamp', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const list: AuditLogItem[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as AuditLogItem);
    });
    callback(list);
  }, (err) => console.warn('subscribeAuditLogs error:', err));
};

export const logAuditEvent = async (
  clubId: string,
  action: string,
  performedBy: string,
  details?: string
): Promise<void> => {
  try {
    const logRef = collection(db, 'clubs', clubId, 'auditLogs');
    await addDoc(logRef, {
      clubId,
      action,
      performedBy,
      timestamp: Date.now(),
      details: details || '',
      deviceInfo: getDeviceInfo()
    });
  } catch (err) {
    console.error('Audit log write failed:', err);
  }
};

export const refundSessionPayment = async (
  clubId: string,
  historyId: string,
  reason: string,
  performedBy: string
): Promise<void> => {
  const histRef = doc(db, 'clubs', clubId, 'history', historyId);
  await updateDoc(histRef, {
    paymentStatus: 'refunded',
    refundReason: reason,
    refundedBy: performedBy,
    refundedAt: Date.now()
  });

  await logAuditEvent(
    clubId,
    'REFUND_ISSUED',
    performedBy,
    `Refund issued for history record ID ${historyId}. Reason: ${reason}`
  );
};

export const updateHistoryRecordDoc = async (
  clubId: string,
  historyId: string,
  updates: Partial<SessionHistoryItem>,
  performedBy: string
): Promise<void> => {
  const histRef = doc(db, 'clubs', clubId, 'history', historyId);
  await updateDoc(histRef, updates);

  await logAuditEvent(
    clubId,
    'BILL_EDITED',
    performedBy,
    `Updated history record ID ${historyId}`
  );
};

// --- PHASE 6: LIVE FOOD ORDERS ---

export const subscribeFoodOrders = (
  clubId: string,
  callback: (orders: FoodOrder[]) => void
) => {
  const ordersRef = collection(db, 'clubs', clubId, 'foodOrders');
  const q = query(ordersRef, orderBy('orderTime', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const list: FoodOrder[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as FoodOrder);
    });
    callback(list);
  }, (err) => console.warn('subscribeFoodOrders error:', err));
};

export const createFoodOrder = async (
  clubId: string,
  order: Omit<FoodOrder, 'id'>
): Promise<string> => {
  const ordersRef = collection(db, 'clubs', clubId, 'foodOrders');
  const newDoc = await addDoc(ordersRef, {
    ...order,
    clubId,
    status: 'new',
    orderTime: order.orderTime || Date.now(),
  });
  
  // 1. Send In-App Notification to Staff & Kitchen
  const itemSummary = order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ');
  await createNotification(clubId, {
    clubId,
    type: 'food_order',
    title: `New Kitchen Order: ${order.tableName}`,
    message: `${order.customerName} ordered: ${itemSummary}`,
    timestamp: Date.now(),
    read: false,
    severity: 'info'
  }).catch(() => {});

  // 2. Directly attach items to active table session bill if table is occupied
  if (order.tableId) {
    try {
      const tableRef = doc(db, 'clubs', clubId, 'tables', order.tableId);
      const tableSnap = await getDoc(tableRef);
      if (tableSnap.exists()) {
        const tableData = tableSnap.data() as TableItem;
        if (tableData.currentSession) {
          const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const orderItems: OrderItem[] = order.items.map((item, idx) => ({
            id: `item-${Date.now()}-${idx}`,
            menuId: item.menuId || '',
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            category: item.category || 'snacks',
            addedAt: timestamp
          }));

          const updatedOrders = [...(tableData.currentSession.foodOrders || []), ...orderItems];
          const updatedSession = { ...tableData.currentSession, foodOrders: updatedOrders };
          await updateDoc(tableRef, { currentSession: sanitizeDataForFirestore(updatedSession) });
        }
      }
    } catch (e) {
      console.warn('Auto bill sync error for food order:', e);
    }
  }

  await logAuditEvent(
    clubId,
    'CREATE_FOOD_ORDER',
    order.customerName || 'customer',
    `New food order placed for Table ${order.tableName} with ${order.items.length} item(s)`
  );

  return newDoc.id;
};

export const updateFoodOrderStatus = async (
  clubId: string,
  order: FoodOrder,
  newStatus: FoodOrderStatus,
  performedBy: string = 'staff'
): Promise<void> => {
  const orderRef = doc(db, 'clubs', clubId, 'foodOrders', order.id);
  
  // 1. Update order status
  await updateDoc(orderRef, {
    status: newStatus,
    updatedAt: Date.now()
  });

  // 2. If delivered, reduce inventory stock & attach to active table session bill
  if (newStatus === 'delivered' && order.status !== 'delivered') {
    // Reduce stock for each item
    for (const item of order.items) {
      if (item.menuId) {
        const itemRef = doc(db, 'clubs', clubId, 'menuItems', item.menuId);
        const itemSnap = await getDoc(itemRef);
        if (itemSnap.exists()) {
          const currentStock = itemSnap.data().stockQuantity || 0;
          const updatedStock = Math.max(0, currentStock - item.quantity);
          await updateDoc(itemRef, { 
            stockQuantity: updatedStock,
            available: updatedStock > 0 ? (itemSnap.data().available ?? true) : false
          });
        }
      }
    }

    // Attach to Table Session Bill if session is active
    if (order.tableId) {
      const tableRef = doc(db, 'clubs', clubId, 'tables', order.tableId);
      const tableSnap = await getDoc(tableRef);
      if (tableSnap.exists()) {
        const tableData = tableSnap.data() as TableItem;
        if (tableData.currentSession) {
          await addOrdersToSession(clubId, order.tableId, tableData.currentSession, order.items);
        }
      }
    }
  }

  await logAuditEvent(
    clubId,
    'UPDATE_FOOD_ORDER_STATUS',
    performedBy,
    `Updated Order #${order.id} for Table ${order.tableName} to ${newStatus.toUpperCase()}`
  );
};

// --- PHASE 6: INVENTORY & STOCK MANAGEMENT ---

export const recordStockAdjustment = async (
  clubId: string,
  menuId: string,
  menuName: string,
  type: InventoryAdjustment['adjustmentType'],
  quantityChange: number,
  newStock: number,
  performedBy: string,
  reason?: string
): Promise<void> => {
  const itemRef = doc(db, 'clubs', clubId, 'menuItems', menuId);
  await updateDoc(itemRef, { 
    stockQuantity: newStock,
    available: newStock > 0
  });

  const adjRef = collection(db, 'clubs', clubId, 'inventoryAdjustments');
  await addDoc(adjRef, {
    clubId,
    menuId,
    menuName,
    adjustmentType: type,
    quantityChange,
    newStock,
    performedBy,
    reason: reason || '',
    timestamp: Date.now()
  });

  await logAuditEvent(
    clubId,
    'INVENTORY_ADJUSTMENT',
    performedBy,
    `Stock for ${menuName} set to ${newStock} (${type})`
  );
};

export const subscribeInventoryAdjustments = (
  clubId: string,
  callback: (adjustments: InventoryAdjustment[]) => void
) => {
  const adjRef = collection(db, 'clubs', clubId, 'inventoryAdjustments');
  const q = query(adjRef, orderBy('timestamp', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const list: InventoryAdjustment[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as InventoryAdjustment);
    });
    callback(list);
  }, (err) => console.warn('subscribeInventoryAdjustments error:', err));
};

// --- PHASE 6: PURCHASE RECORDS ---

export const recordPurchase = async (
  clubId: string,
  purchase: Omit<PurchaseRecord, 'id' | 'timestamp'>,
  performedBy: string
): Promise<void> => {
  const purchaseRef = collection(db, 'clubs', clubId, 'purchaseRecords');
  await addDoc(purchaseRef, {
    ...purchase,
    clubId,
    timestamp: Date.now()
  });

  // Automatically update stock quantity
  const itemRef = doc(db, 'clubs', clubId, 'menuItems', purchase.menuId);
  const itemSnap = await getDoc(itemRef);
  if (itemSnap.exists()) {
    const currentStock = itemSnap.data().stockQuantity || 0;
    const newStock = currentStock + purchase.quantity;
    await updateDoc(itemRef, {
      stockQuantity: newStock,
      available: true
    });
  }

  await logAuditEvent(
    clubId,
    'PURCHASE_RECORDED',
    performedBy,
    `Recorded purchase of ${purchase.quantity}x ${purchase.menuName} from ${purchase.supplierName}`
  );
};

export const subscribePurchaseRecords = (
  clubId: string,
  callback: (records: PurchaseRecord[]) => void
) => {
  const pRef = collection(db, 'clubs', clubId, 'purchaseRecords');
  const q = query(pRef, orderBy('timestamp', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const list: PurchaseRecord[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as PurchaseRecord);
    });
    callback(list);
  }, (err) => console.warn('subscribePurchaseRecords error:', err));
};

// --- PHASE 8: SAAS MULTI-CLUB PLATFORM WORKSPACE MANAGEMENT ---

export const subscribeSaaSClubs = (
  callback: (clubs: SaaSClubProfile[]) => void
) => {
  const clubsRef = collection(db, 'saasClubs');
  return onSnapshot(clubsRef, (snapshot) => {
    if (snapshot.empty) {
      // Seed default SaaS clubs if empty
      INITIAL_SAAS_CLUBS.forEach(async (c) => {
        try {
          await setDoc(doc(db, 'saasClubs', c.id), c);
        } catch (e) {
          console.warn('Seed saasClubs error:', e);
        }
      });
      callback(INITIAL_SAAS_CLUBS);
      return;
    }

    const list: SaaSClubProfile[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as SaaSClubProfile);
    });
    callback(list);
  }, (err) => {
    console.warn('subscribeSaaSClubs error:', err);
    callback(INITIAL_SAAS_CLUBS);
  });
};

export const createSaaSClubWorkspace = async (
  profileData: Partial<SaaSClubProfile>,
  initialTablesCount: number = 6
): Promise<string> => {
  const clubId = `club-${Date.now().toString(36)}`;
  const now = Date.now();
  const planId = profileData.planId || 'professional';
  const plan = SUBSCRIPTION_PLANS[planId];

  const fullProfile: SaaSClubProfile = {
    id: clubId,
    clubName: profileData.clubName || 'New Cue Lounge',
    tagline: profileData.tagline || 'Cue Sports Workspace',
    address: profileData.address || '123 Billiards Way',
    phone: profileData.phone || '+1 (555) 000-1122',
    email: profileData.email || 'owner@cuedesk.com',
    currencySymbol: profileData.currencySymbol || '$',
    currencyCode: profileData.currencyCode || 'USD',
    timeZone: profileData.timeZone || 'EST',
    defaultHourlyRate: profileData.defaultHourlyRate || 18.00,
    tablesCount: initialTablesCount,
    logoUrl: profileData.logoUrl || 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=120&auto=format&fit=crop&q=80',
    themeAccentColor: profileData.themeAccentColor || '#09090b',
    ownerId: profileData.ownerId || 'owner@cuedesk.com',
    planId,
    subscriptionStatus: 'trial',
    trialStartDate: now,
    trialEndDate: now + (14 * 24 * 60 * 60 * 1000),
    renewalDate: now + (14 * 24 * 60 * 60 * 1000),
    featureFlags: profileData.featureFlags || { ...plan.features },
    branding: {
      logoUrl: profileData.logoUrl,
      clubName: profileData.clubName || 'New Cue Lounge',
      receiptFooter: `Thank you for visiting ${profileData.clubName || 'New Cue Lounge'}!`,
      themeAccentColor: profileData.themeAccentColor || '#09090b',
    },
    createdAt: now,
  };

  // Save SaaS Profile
  await setDoc(doc(db, 'saasClubs', clubId), fullProfile);

  // Initialize Business Config & Tables
  await ensureClubInitialized(clubId);

  // Update business config document with onboarding details
  const configRef = doc(db, 'clubs', clubId, 'settings', 'config');
  await setDoc(configRef, {
    ...initialBusinessConfig,
    id: clubId,
    clubName: fullProfile.clubName,
    tagline: fullProfile.tagline,
    address: fullProfile.address,
    phone: fullProfile.phone,
    currencySymbol: fullProfile.currencySymbol,
    currencyCode: fullProfile.currencyCode,
    timeZone: fullProfile.timeZone,
    defaultHourlyRate: fullProfile.defaultHourlyRate,
    planId: fullProfile.planId,
    subscriptionStatus: fullProfile.subscriptionStatus,
    trialStartDate: fullProfile.trialStartDate,
    trialEndDate: fullProfile.trialEndDate,
    featureFlags: fullProfile.featureFlags,
  }, { merge: true });

  // Generate requested initial tables
  const tablesRef = collection(db, 'clubs', clubId, 'tables');
  const existingTablesSnap = await getDocs(tablesRef);
  if (existingTablesSnap.empty) {
    const tableTypes: ('pool' | 'snooker' | 'vip')[] = ['pool', 'snooker', 'pool', 'pool', 'vip', 'snooker'];
    for (let i = 1; i <= initialTablesCount; i++) {
      const tableType = tableTypes[(i - 1) % tableTypes.length];
      const newT: Omit<TableItem, 'id'> = {
        clubId,
        number: i,
        name: `Table ${i} — ${tableType === 'snooker' ? 'Snooker Pro' : tableType === 'vip' ? 'VIP Suite' : 'Pool 9ft'}`,
        type: tableType,
        status: 'available',
        hourlyRate: fullProfile.defaultHourlyRate,
      };
      await addDoc(tablesRef, newT);
    }
  }

  await logAuditEvent(
    clubId,
    'CLUB_ONBOARDED',
    fullProfile.ownerId,
    `Onboarded new SaaS club workspace "${fullProfile.clubName}" with ${initialTablesCount} tables`
  );

  return clubId;
};

export const updateSaaSClubPlan = async (
  clubId: string,
  newPlanId: SubscriptionPlanId
): Promise<void> => {
  const plan = SUBSCRIPTION_PLANS[newPlanId];
  const clubRef = doc(db, 'saasClubs', clubId);
  const clubSnap = await getDoc(clubRef);

  if (clubSnap.exists()) {
    const currentFlags = clubSnap.data().featureFlags || {};
    const updatedFlags: FeatureFlags = {
      ...plan.features,
      ...currentFlags, // preserve custom flag toggles if any
    };

    await updateDoc(clubRef, {
      planId: newPlanId,
      subscriptionStatus: 'active',
      featureFlags: updatedFlags,
    });

    // Mirror in club config
    const configRef = doc(db, 'clubs', clubId, 'settings', 'config');
    await updateDoc(configRef, {
      planId: newPlanId,
      subscriptionStatus: 'active',
      featureFlags: updatedFlags,
    });
  }
};

export const extendSaaSClubTrial = async (
  clubId: string,
  additionalDays: number = 14
): Promise<void> => {
  const clubRef = doc(db, 'saasClubs', clubId);
  const clubSnap = await getDoc(clubRef);

  if (clubSnap.exists()) {
    const currentEnd = clubSnap.data().trialEndDate || Date.now();
    const newEnd = Math.max(currentEnd, Date.now()) + (additionalDays * 24 * 60 * 60 * 1000);

    await updateDoc(clubRef, {
      subscriptionStatus: 'trial',
      trialEndDate: newEnd,
      renewalDate: newEnd,
    });

    const configRef = doc(db, 'clubs', clubId, 'settings', 'config');
    await updateDoc(configRef, {
      subscriptionStatus: 'trial',
      trialEndDate: newEnd,
    });
  }
};

export const updateSaaSClubFeatureFlags = async (
  clubId: string,
  featureFlags: FeatureFlags
): Promise<void> => {
  const clubRef = doc(db, 'saasClubs', clubId);
  await updateDoc(clubRef, { featureFlags });

  const configRef = doc(db, 'clubs', clubId, 'settings', 'config');
  await updateDoc(configRef, { featureFlags });
};

export const suspendSaaSClubWorkspace = async (
  clubId: string,
  suspend: boolean
): Promise<void> => {
  const status = suspend ? 'suspended' : 'active';
  const clubRef = doc(db, 'saasClubs', clubId);
  await updateDoc(clubRef, { status, subscriptionStatus: suspend ? 'expired' : 'active' });

  const configRef = doc(db, 'clubs', clubId, 'settings', 'config');
  await updateDoc(configRef, { subscriptionStatus: suspend ? 'expired' : 'active' });
};

export const deleteSaaSClubWorkspace = async (
  clubId: string
): Promise<void> => {
  await deleteDoc(doc(db, 'saasClubs', clubId));
};

// --- PLATFORM SUPER ADMIN AUDIT LOGS & ANNOUNCEMENTS ---
export const logSuperAdminAction = async (
  action: string,
  performedBy: string,
  details: string,
  targetClubId?: string
): Promise<void> => {
  try {
    const logsRef = collection(db, 'saasAuditLogs');
    await addDoc(logsRef, {
      action,
      performedBy,
      targetClubId: targetClubId || 'GLOBAL',
      details,
      timestamp: Date.now()
    });
  } catch (e) {
    console.warn('Fallback super admin log created', e);
  }
};

export const fetchSuperAdminLogs = async (): Promise<SuperAdminAuditLog[]> => {
  try {
    const q = query(collection(db, 'saasAuditLogs'), orderBy('timestamp', 'desc'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SuperAdminAuditLog));
  } catch (e) {
    console.warn('Failed to fetch super admin logs', e);
    return [];
  }
};

export const fetchPlatformAnnouncements = async (): Promise<PlatformAnnouncement[]> => {
  try {
    const q = query(collection(db, 'saasAnnouncements'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlatformAnnouncement));
  } catch (e) {
    console.warn('Failed to fetch announcements', e);
    return [];
  }
};

export const savePlatformAnnouncement = async (
  announcement: Omit<PlatformAnnouncement, 'id'>
): Promise<string> => {
  const ref = collection(db, 'saasAnnouncements');
  const docRef = await addDoc(ref, announcement);
  return docRef.id;
};

export const togglePlatformAnnouncement = async (
  id: string,
  active: boolean
): Promise<void> => {
  const ref = doc(db, 'saasAnnouncements', id);
  await updateDoc(ref, { active });
};

// --- USER PROFILE & INVITATIONS ---

export const createUserProfileDoc = async (profile: UserProfile): Promise<void> => {
  try {
    const userRef = doc(db, 'users', profile.id);
    await setDoc(userRef, {
      ...profile,
      uid: profile.id,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (err) {
    console.error('Error creating user profile in Firestore:', err);
    throw err;
  }
};

export const getUserProfileDoc = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return { id: snap.id, uid: snap.id, ...snap.data() } as UserProfile;
    }
    return null;
  } catch (err) {
    console.warn('Error fetching user profile from Firestore:', err);
    return null;
  }
};

export const updateUserProfileDoc = async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: Date.now()
    });
  } catch (err) {
    console.error('Error updating user profile:', err);
    throw err;
  }
};

export const createInvitationDoc = async (invitation: Omit<UserInvitation, 'id'>): Promise<string> => {
  try {
    const invRef = collection(db, 'invitations');
    const newDoc = await addDoc(invRef, {
      ...invitation,
      createdAt: Date.now(),
      status: 'pending'
    });
    return newDoc.id;
  } catch (err) {
    console.error('Error creating user invitation:', err);
    throw err;
  }
};

export const findInvitationByEmail = async (email: string): Promise<UserInvitation | null> => {
  try {
    const invRef = collection(db, 'invitations');
    const q = query(
      invRef, 
      where('email', '==', email.toLowerCase().trim()),
      where('status', '==', 'pending')
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docSnap = snap.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as UserInvitation;
    }
    return null;
  } catch (err) {
    console.warn('Error searching invitation by email:', err);
    return null;
  }
};

export const findInvitationByCode = async (code: string): Promise<UserInvitation | null> => {
  try {
    const invRef = collection(db, 'invitations');
    const q = query(
      invRef, 
      where('code', '==', code.trim()),
      where('status', '==', 'pending')
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docSnap = snap.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as UserInvitation;
    }
    return null;
  } catch (err) {
    console.warn('Error searching invitation by code:', err);
    return null;
  }
};

export const markInvitationAcceptedDoc = async (invitationId: string): Promise<void> => {
  try {
    const ref = doc(db, 'invitations', invitationId);
    await updateDoc(ref, { status: 'accepted', acceptedAt: Date.now() });
  } catch (err) {
    console.warn('Error marking invitation accepted:', err);
  }
};

