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
  runTransaction,
  increment,
  arrayUnion
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
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
  SuperAdminAuditLog,
  UdhaarTransaction
  , CustomerPortalActivity
  , CustomerPortalProfile
  , CustomerPortalReceipt
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
      if (initialTables.length === 0) {
        callback([]);
        return;
      }
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

export const transferTableSession = async (
  clubId: string,
  sourceTableId: string,
  targetTableId: string
): Promise<void> => {
  if (sourceTableId === targetTableId) throw new Error('Choose a different destination table.');
  const sourceRef = doc(db, 'clubs', clubId, 'tables', sourceTableId);
  const targetRef = doc(db, 'clubs', clubId, 'tables', targetTableId);

  await runTransaction(db, async (transaction) => {
    const sourceSnap = await transaction.get(sourceRef);
    const targetSnap = await transaction.get(targetRef);
    if (!sourceSnap.exists() || !targetSnap.exists()) throw new Error('A table could not be found. Refresh and try again.');
    const source = sourceSnap.data() as TableItem;
    const target = targetSnap.data() as TableItem;
    if (!source.currentSession || !['occupied', 'payment_pending'].includes(source.status)) {
      throw new Error('The source table no longer has an active session.');
    }
    if (target.status !== 'available' || target.currentSession || target.isMaintenance) {
      throw new Error('The destination table is no longer available. Refresh and choose another table.');
    }

    transaction.update(targetRef, {
      status: 'occupied',
      currentSession: sanitizeDataForFirestore({ ...source.currentSession, tableId: targetTableId }),
    });
    transaction.update(sourceRef, { status: 'available', currentSession: null });
  });
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
  if (newOrders.length === 0) return;

  for (const order of newOrders) {
    await runTransaction(db, async (transaction) => {
      const tableSnap = await transaction.get(tableRef);
      if (!tableSnap.exists()) throw new Error('The table record no longer exists. Refresh and try again.');
      const tableData = tableSnap.data() as TableItem;
      const liveSession = tableData.currentSession;
      if (tableData.status !== 'occupied' || !liveSession || liveSession.id !== currentSession.id) {
        throw new Error('This table session changed. Refresh the table before adding more items.');
      }
      const orders = liveSession.foodOrders || [];
      const knownFoodTotal = liveSession.foodTotal ?? (orders.length === 0
        ? 0
        : orders.reduce((sum, item) => sum + item.price * item.quantity, 0));
      const updatedSession: SessionData = {
        ...liveSession,
        foodOrders: [...orders, order],
        foodTotal: knownFoodTotal + order.price * order.quantity,
      };
      transaction.update(tableRef, { currentSession: sanitizeDataForFirestore(updatedSession) });
    });
  }
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
  const auditRef = doc(collection(db, 'clubs', clubId, 'auditLogs'));

  const customerChanges = new Map<string, { total: number; paid: number; due: number; isPrimary: boolean; paymentMethod: string }>();
  const addCustomerChange = (customerId: string | undefined, total: number, paid: number, due: number, isPrimary = false, paymentMethod: string = historyRecord.paymentMethod) => {
    if (!customerId) return;
    const current = customerChanges.get(customerId) || { total: 0, paid: 0, due: 0, isPrimary: false, paymentMethod };
    current.total += Math.max(0, total || 0);
    current.paid += Math.max(0, paid || 0);
    current.due += Math.max(0, due || 0);
    current.isPrimary ||= isPrimary;
    if (current.paymentMethod !== paymentMethod) current.paymentMethod = 'split';
    customerChanges.set(customerId, current);
  };

  const splitPlayers = historyRecord.splitBreakdown?.splitType === 'players'
    ? historyRecord.splitBreakdown.players || []
    : [];
  if (splitPlayers.length > 0) {
    splitPlayers.forEach((player) => addCustomerChange(
      player.customerId,
      player.amount,
      player.method === 'credit' ? 0 : player.amount,
      player.method === 'credit' ? player.amount : 0,
      player.customerId === historyRecord.customerId,
      player.method
    ));
  } else {
    addCustomerChange(historyRecord.customerId, historyRecord.grandTotal, historyRecord.amountPaid, historyRecord.balanceDue, true, historyRecord.paymentMethod);
  }
  const customerRefs = new Map<string, ReturnType<typeof doc>>();
  const portalRefs = new Map<string, ReturnType<typeof doc>>();
  for (const customerId of customerChanges.keys()) {
    customerRefs.set(customerId, doc(db, 'clubs', clubId, 'customers', customerId));
    portalRefs.set(customerId, doc(db, 'clubs', clubId, 'customerPortal', customerId));
  }

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Verify history record doesn't already exist (prevent duplicate receipt/payment)
      const existingHist = await transaction.get(histRef);
      if (existingHist.exists()) {
        throw new Error(`Payment receipt #${historyRecord.receiptNo} has already been processed.`);
      }

      const tableSnap = await transaction.get(tableRef);
      if (!tableSnap.exists()) throw new Error('The table record no longer exists. Refresh and try again.');

      const customerSnaps = new Map<string, any>();
      for (const [customerId, customerRef] of customerRefs) {
        customerSnaps.set(customerId, await transaction.get(customerRef));
      }
      const portalSnaps = new Map<string, any>();
      for (const [customerId, portalRef] of portalRefs) {
        portalSnaps.set(customerId, await transaction.get(portalRef));
      }
      for (const [customerId, customerSnap] of customerSnaps) {
        if (!customerSnap.exists()) {
          throw new Error(`Customer ${customerId} was removed while this bill was open. Recheck the customer selection.`);
        }
      }

      // 2. Set history record
      const payload = sanitizeDataForFirestore({
        ...historyRecord,
        clubId,
        customerIds: Array.from(customerChanges.keys()),
        processedBy: auth.currentUser?.email || historyRecord.processedBy,
        timestamp: new Date().toISOString(),
      });
      transaction.set(histRef, payload);

      // 3. Reset table status
      transaction.update(tableRef, {
        status: 'available',
        currentSession: null,
        lastReceiptId: historyRecord.id,
      });

      // Keep customer balances, totals, activity and the receipt in one atomic commit.
      for (const [customerId, change] of customerChanges) {
        const customerRef = customerRefs.get(customerId)!;
        const portalRef = portalRefs.get(customerId)!;
        const customerData = customerSnaps.get(customerId).data() as TopCustomer;
        const hoursPlayed = change.isPrimary ? Math.max(0, historyRecord.durationSeconds || 0) / 3600 : 0;
        const ledgerEvents: UdhaarTransaction[] = [];
        if (change.paid > 0) {
          ledgerEvents.push({
            id: `${historyRecord.id}-payment-${customerId}`,
            timestamp: historyRecord.endTime || Date.now(),
            type: 'payment_received',
            amount: change.paid,
            description: `Payment received for receipt #${historyRecord.receiptNo}`,
            receiptNo: historyRecord.receiptNo,
            receiptId: historyRecord.id,
            paymentMethod: historyRecord.paymentMethod,
            source: 'bill',
            customerId,
            recordedByEmail: auth.currentUser?.email || '',
            recordedBy: auth.currentUser?.email || 'Staff'
          });
        }
        if (change.due > 0) {
          ledgerEvents.push({
            id: `${historyRecord.id}-due-${customerId}`,
            timestamp: historyRecord.endTime || Date.now(),
            type: 'due_added',
            amount: change.due,
            description: `Amount due for receipt #${historyRecord.receiptNo}`,
            receiptNo: historyRecord.receiptNo,
            receiptId: historyRecord.id,
            source: 'bill',
            customerId,
            recordedByEmail: auth.currentUser?.email || '',
            recordedBy: auth.currentUser?.email || 'Staff'
          });
        }

        transaction.update(customerRef, {
          totalSpent: increment(change.paid),
          sessionsCount: increment(change.isPrimary ? 1 : 0),
          totalHoursPlayed: increment(hoursPlayed),
          outstandingDue: increment(change.due),
          lastVisit: new Date(historyRecord.endTime || Date.now()).toISOString().slice(0, 10),
          lastReceiptId: historyRecord.id,
          ...(ledgerEvents.length ? { udhaarLedger: arrayUnion(...ledgerEvents) } : {})
        });

        const portalSnap = portalSnaps.get(customerId);
        const portalEmail = customerData.email?.trim().toLowerCase() || '';
        const portalEnabled = portalSnap.exists() && portalSnap.data().enabled === true;
        if (portalEnabled) {
          transaction.set(portalRef, {
            sessionsCount: increment(change.isPrimary ? 1 : 0),
            totalSpent: increment(change.paid),
            totalHoursPlayed: increment(hoursPlayed),
            outstandingDue: increment(change.due),
            lastVisit: new Date(historyRecord.endTime || Date.now()).toISOString().slice(0, 10),
            lastReceiptId: historyRecord.id,
          }, { merge: true });
          const shareRatio = historyRecord.grandTotal > 0 ? change.total / historyRecord.grandTotal : 0;
          const receipt: CustomerPortalReceipt = {
            id: historyRecord.id,
            receiptNo: historyRecord.receiptNo,
            clubId,
            customerId,
            tableName: historyRecord.tableName,
            startTime: historyRecord.startTime,
            endTime: historyRecord.endTime,
            durationSeconds: historyRecord.durationSeconds,
            tableFee: Math.round(historyRecord.tableFee * shareRatio * 100) / 100,
            foodFee: Math.round(historyRecord.foodFee * shareRatio * 100) / 100,
            extraFee: Math.round((historyRecord.extraFee || 0) * shareRatio * 100) / 100,
            total: change.total,
            paid: change.paid,
            due: change.due,
            paymentMethod: change.paymentMethod,
            paymentStatus: historyRecord.paymentStatus,
            foodOrders: historyRecord.foodOrders,
          };
          transaction.set(doc(db, 'clubs', clubId, 'customerPortal', customerId, 'receipts', historyRecord.id), sanitizeDataForFirestore(receipt));
          for (const entry of ledgerEvents) {
            const activity: CustomerPortalActivity = {
              id: entry.id,
              clubId,
              timestamp: entry.timestamp,
              type: entry.type,
              amount: entry.amount,
              description: entry.description,
              receiptNo: entry.receiptNo,
              receiptId: entry.receiptId,
              paymentMethod: entry.paymentMethod,
              recordedByEmail: entry.recordedByEmail,
            };
            transaction.set(doc(db, 'clubs', clubId, 'customerPortal', customerId, 'activity', entry.id), sanitizeDataForFirestore(activity));
          }
        }
      }

      transaction.set(auditRef, {
        id: auditRef.id,
        clubId,
        action: 'PAYMENT_FINALIZED',
        performedBy: historyRecord.processedBy || 'Staff',
        timestamp: Date.now(),
        details: `Receipt #${historyRecord.receiptNo}: total ${historyRecord.grandTotal}, paid ${historyRecord.amountPaid}, due ${historyRecord.balanceDue} (${historyRecord.paymentMethod})`
      });
    });
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

// --- CUSTOMERS ---

export const subscribeTopCustomers = (
  clubId: string, 
  callback: (customers: TopCustomer[]) => void
) => {
  const custRef = collection(db, 'clubs', clubId, 'customers');
  return onSnapshot(custRef, (snapshot) => {
    const list: TopCustomer[] = [];
    snapshot.forEach((docSnap) => {
      const customer = { id: docSnap.id, ...docSnap.data() } as TopCustomer;
      if (!customer.archived) list.push(customer);
    });
    callback(list);
    const emailCounts = new Map<string, number>();
    list.forEach((customer) => {
      const email = customer.email?.trim().toLowerCase();
      if (email) emailCounts.set(email, (emailCounts.get(email) || 0) + 1);
    });
    list.forEach((customer) => {
      const email = customer.email?.trim().toLowerCase();
      if (!email || customer.archived || emailCounts.get(email) !== 1) return;
      const migrationKey = `${clubId}:${customer.id}:${email}`;
      if (portalLinkMigrations.has(migrationKey)) return;
      portalLinkMigrations.add(migrationKey);
      getDoc(doc(db, 'clubs', clubId, 'customerAccess', email)).then(async (access) => {
        if (!access.exists() || access.data().customerId !== customer.id || access.data().enabled !== true) {
          await saveCustomerCRM(clubId, customer);
        }
      }).catch((error) => console.warn('Customer portal profile sync failed:', error));
    });
  }, (err) => console.warn('subscribeTopCustomers error:', err));
};

const portalLinkMigrations = new Set<string>();

const portalReceiptForCustomer = (
  clubId: string,
  history: SessionHistoryItem,
  customerId: string
): CustomerPortalReceipt | null => {
  const splitPlayers = history.splitBreakdown?.splitType === 'players'
    ? (history.splitBreakdown.players || []).filter((player) => player.customerId === customerId)
    : [];
  const splitTotal = splitPlayers.reduce((sum, player) => sum + (Number(player.amount) || 0), 0);
  if (splitPlayers.length === 0 && history.customerId !== customerId) return null;
  const paid = splitPlayers.length
    ? splitPlayers.reduce((sum, player) => sum + (player.method === 'credit' ? 0 : player.amount), 0)
    : history.amountPaid;
  const due = splitPlayers.length
    ? splitPlayers.reduce((sum, player) => sum + (player.method === 'credit' ? player.amount : 0), 0)
    : history.balanceDue;
  const total = splitPlayers.length ? splitTotal : history.grandTotal;
  const share = history.grandTotal > 0 ? total / history.grandTotal : 0;
  const paymentMethods = [...new Set(splitPlayers.map((player) => player.method))];
  return {
    id: history.id,
    receiptNo: history.receiptNo,
    clubId,
    customerId,
    tableName: history.tableName,
    startTime: history.startTime,
    endTime: history.endTime,
    durationSeconds: history.durationSeconds,
    tableFee: Math.round(history.tableFee * share * 100) / 100,
    foodFee: Math.round(history.foodFee * share * 100) / 100,
    extraFee: Math.round((history.extraFee || 0) * share * 100) / 100,
    total,
    paid,
    due,
    paymentMethod: splitPlayers.length ? paymentMethods.join(' + ') : history.paymentMethod,
    paymentStatus: history.paymentStatus,
    foodOrders: history.foodOrders,
    refundedAmount: history.refundedAmount,
    refundReason: history.refundReason,
  };
};

export const saveCustomerCRM = async (clubId: string, customer: TopCustomer): Promise<void> => {
  const custId = customer.id || doc(collection(db, 'clubs', clubId, 'customers')).id;
  const docRef = doc(db, 'clubs', clubId, 'customers', custId);
  const previousSnap = await getDoc(docRef);
  const previous = previousSnap.exists() ? previousSnap.data() as TopCustomer : undefined;
  const actorProfileSnap = auth.currentUser ? await getDoc(doc(db, 'users', auth.currentUser.uid)) : null;
  const canManagePortal = Boolean(actorProfileSnap?.exists() && ['owner', 'manager'].includes(actorProfileSnap.data().role));
  const customerNumber = customer.customerNumber || `OS-${custId.replace(/^cust-/i, '').toUpperCase()}`;
  const normalizedEmail = customer.email?.trim().toLowerCase() || '';
  if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Enter a valid email address before enabling the customer portal.');
  }
  const previousEmail = previous?.email?.trim().toLowerCase() || '';
  if (normalizedEmail !== previousEmail && !canManagePortal) {
    throw new Error('Only the club owner or manager can link or change a customer portal email.');
  }
  const settingsSnap = await getDoc(doc(db, 'clubs', clubId, 'config', 'settings'));
  const settings = settingsSnap.exists() ? settingsSnap.data() : {};
  const portalRef = doc(db, 'clubs', clubId, 'customerPortal', custId);
  const previousPortalSnap = await getDoc(portalRef);
  const batch = writeBatch(db);
  const editableCustomer: Partial<TopCustomer> = {
    id: custId,
    customerNumber,
    name: customer.name.trim(),
    phone: customer.phone.trim(),
    email: normalizedEmail,
    preferredGame: customer.preferredGame || 'Snooker',
    notes: customer.notes || '',
    dateJoined: customer.dateJoined || new Date().toISOString().slice(0, 10),
    updatedAt: Date.now(),
    ...(customer.archived ? { archived: true } : {}),
  };
  if (!previousSnap.exists()) {
    Object.assign(editableCustomer, {
      sessionsCount: 0,
      totalSpent: 0,
      totalHoursPlayed: 0,
      outstandingDue: 0,
      walletBalance: 0,
      udhaarLedger: [],
      creditLimit: customer.creditLimit,
      lastVisit: '',
    });
  }
  const effectiveCustomer = { ...previous, ...editableCustomer } as TopCustomer;
  const updatedCustomer = sanitizeDataForFirestore(editableCustomer);
  batch.set(docRef, updatedCustomer, { merge: true });
  const portalProfile: CustomerPortalProfile = {
    id: custId,
    clubId,
    customerNumber,
    name: effectiveCustomer.name,
    email: normalizedEmail,
    clubName: settings.clubName || 'One Shot Snooker Gaming Club',
    currencySymbol: settings.currencySymbol || '₹',
    sessionsCount: Number(effectiveCustomer.sessionsCount) || 0,
    totalSpent: Number(effectiveCustomer.totalSpent) || 0,
    totalHoursPlayed: Number(effectiveCustomer.totalHoursPlayed) || 0,
    outstandingDue: Number(effectiveCustomer.outstandingDue) || 0,
    walletBalance: Number(effectiveCustomer.walletBalance) || 0,
    lastVisit: effectiveCustomer.lastVisit || '',
    enabled: Boolean(normalizedEmail) && !effectiveCustomer.archived,
  };
  const shouldSyncPortal = canManagePortal;
  if (shouldSyncPortal) batch.set(portalRef, portalProfile, { merge: true });
  else if (previousPortalSnap.exists()) batch.set(portalRef, { name: customer.name.trim() }, { merge: true });

  if (canManagePortal && previousEmail && previousEmail !== normalizedEmail) {
    batch.delete(doc(db, 'clubs', clubId, 'customerAccess', previousEmail));
  }
  if (canManagePortal && normalizedEmail && !customer.archived) {
    const accessRef = doc(db, 'clubs', clubId, 'customerAccess', normalizedEmail);
    const accessSnap = await getDoc(accessRef);
    if (accessSnap.exists() && accessSnap.data().customerId !== custId) {
      throw new Error('That email is already linked to a different customer profile.');
    }
    batch.set(accessRef, { clubId, customerId: custId, email: normalizedEmail, enabled: true });
  }

  await batch.commit();

  // When a verified email is first linked, make existing receipts available in the private portal too.
  if (canManagePortal && normalizedEmail && normalizedEmail !== previousEmail && !customer.archived) {
    const historySnapshot = await getDocs(collection(db, 'clubs', clubId, 'history'));
    const receipts = historySnapshot.docs
      .map((item) => portalReceiptForCustomer(clubId, { id: item.id, ...item.data() } as SessionHistoryItem, custId))
      .filter((item): item is CustomerPortalReceipt => Boolean(item));
    for (let index = 0; index < receipts.length; index += 400) {
      const migrationBatch = writeBatch(db);
      receipts.slice(index, index + 400).forEach((receipt) => {
        migrationBatch.set(doc(db, 'clubs', clubId, 'customerPortal', custId, 'receipts', receipt.id), sanitizeDataForFirestore(receipt), { merge: true });
      });
      await migrationBatch.commit();
    }
  }
};

export const deleteCustomerCRM = async (clubId: string, customerId: string): Promise<void> => {
  const customerRef = doc(db, 'clubs', clubId, 'customers', customerId);
  const customerSnap = await getDoc(customerRef);
  if (!customerSnap.exists()) return;
  const customer = customerSnap.data() as TopCustomer;
  const batch = writeBatch(db);
  batch.update(customerRef, { archived: true, updatedAt: Date.now() });
  batch.set(doc(db, 'clubs', clubId, 'customerPortal', customerId), { enabled: false }, { merge: true });
  const email = customer.email?.trim().toLowerCase();
  if (email) {
    const accessRef = doc(db, 'clubs', clubId, 'customerAccess', email);
    const accessSnap = await getDoc(accessRef);
    if (accessSnap.exists()) batch.update(accessRef, { enabled: false });
  }
  await batch.commit();
};

export const recordCustomerAccountTransaction = async (
  clubId: string,
  customerId: string,
  entry: UdhaarTransaction
): Promise<void> => {
  if (!Number.isFinite(entry.amount) || entry.amount <= 0) throw new Error('Enter an amount greater than zero.');
  if (!['payment_received', 'due_added', 'deposit_added', 'deposit_used'].includes(entry.type)) {
    throw new Error('This account transaction type is not supported.');
  }
  const customerRef = doc(db, 'clubs', clubId, 'customers', customerId);
  const portalRef = doc(db, 'clubs', clubId, 'customerPortal', customerId);
  const ledgerRef = doc(db, 'clubs', clubId, 'customers', customerId, 'transactions', entry.id);
  const auditRef = doc(collection(db, 'clubs', clubId, 'auditLogs'));
  const activityRef = doc(db, 'clubs', clubId, 'customerPortal', customerId, 'activity', entry.id);

  await runTransaction(db, async (transaction) => {
    const customerSnap = await transaction.get(customerRef);
    const portalSnap = await transaction.get(portalRef);
    const ledgerSnap = await transaction.get(ledgerRef);
    if (!customerSnap.exists()) throw new Error('Customer profile not found. Refresh and try again.');
    if (ledgerSnap.exists()) return;

    const customer = customerSnap.data() as TopCustomer;
    const currentDue = Math.max(0, Number(customer.outstandingDue) || 0);
    const currentWallet = Math.max(0, Number(customer.walletBalance) || 0);
    let dueDelta = 0;
    let walletDelta = 0;
    let paidDelta = 0;

    if (entry.type === 'payment_received') {
      if (entry.source !== 'balance_settlement') throw new Error('Choose a recorded bill to accept a customer payment.');
      if (entry.amount > currentDue) throw new Error('Settlement cannot exceed the current outstanding balance.');
      dueDelta = -entry.amount;
      paidDelta = entry.amount;
    } else if (entry.type === 'due_added') {
      if (entry.source !== 'manual_due') throw new Error('Manual credit must be recorded with a reason.');
      dueDelta = entry.amount;
    } else if (entry.type === 'deposit_added') {
      walletDelta = entry.amount;
    } else if (entry.type === 'deposit_used') {
      if (entry.amount > currentWallet) throw new Error('Deposit use cannot exceed the customer’s available balance.');
      walletDelta = -entry.amount;
    }

    const savedEntry = {
      ...entry,
      clubId,
      customerId,
      recordedByEmail: auth.currentUser?.email || '',
      timestamp: entry.timestamp || Date.now(),
    };
    transaction.update(customerRef, {
      ...(dueDelta ? { outstandingDue: increment(dueDelta) } : {}),
      ...(walletDelta ? { walletBalance: increment(walletDelta) } : {}),
      ...(paidDelta ? { totalSpent: increment(paidDelta) } : {}),
      udhaarLedger: arrayUnion(savedEntry),
      lastAccountTransactionId: entry.id,
      updatedAt: Date.now(),
    });
    transaction.set(ledgerRef, savedEntry);
    const portal = portalSnap.exists() ? portalSnap.data() as CustomerPortalProfile : undefined;
    if (portal?.enabled) {
      transaction.set(portalRef, {
        ...(dueDelta ? { outstandingDue: increment(dueDelta) } : {}),
        ...(walletDelta ? { walletBalance: increment(walletDelta) } : {}),
        ...(paidDelta ? { totalSpent: increment(paidDelta) } : {}),
      }, { merge: true });
      const activity: CustomerPortalActivity = {
        id: entry.id,
        clubId,
        timestamp: savedEntry.timestamp,
        type: entry.type,
        amount: entry.amount,
        description: entry.description,
        receiptNo: entry.receiptNo,
        paymentMethod: entry.paymentMethod,
        recordedByEmail: auth.currentUser?.email || '',
      };
      transaction.set(activityRef, activity);
    }
    transaction.set(auditRef, {
      id: auditRef.id,
      clubId,
      action: 'CUSTOMER_ACCOUNT_TRANSACTION',
      performedBy: auth.currentUser?.email || entry.recordedBy,
      timestamp: savedEntry.timestamp,
      details: `${entry.type}: ${entry.amount} for customer ${customerId}${entry.receiptNo ? `, receipt ${entry.receiptNo}` : ''}`,
    });
  });
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

export const markNotificationAsResolved = async (
  clubId: string,
  notificationId: string
): Promise<void> => {
  const docRef = doc(db, 'clubs', clubId, 'notifications', notificationId);
  await updateDoc(docRef, { read: true, resolved: true, resolvedAt: Date.now() });
};

export const deleteNotification = async (
  clubId: string,
  notificationId: string
): Promise<void> => {
  const docRef = doc(db, 'clubs', clubId, 'notifications', notificationId);
  await deleteDoc(docRef).catch(() => {});
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
      if (tableData.currentSession) {
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
  const auditRef = doc(collection(db, 'clubs', clubId, 'auditLogs'));
  await runTransaction(db, async (transaction) => {
    const historySnap = await transaction.get(histRef);
    if (!historySnap.exists()) throw new Error('The bill could not be found. Refresh and try again.');
    const historyRecord = historySnap.data() as SessionHistoryItem;
    if (historyRecord.paymentStatus === 'refunded') throw new Error('This bill has already been refunded.');

    const customerChanges = new Map<string, { paid: number; due: number }>();
    const addRefundChange = (customerId: string | undefined, paid: number, due: number) => {
      if (!customerId) return;
      const previous = customerChanges.get(customerId) || { paid: 0, due: 0 };
      previous.paid += Math.max(0, paid || 0);
      previous.due += Math.max(0, due || 0);
      customerChanges.set(customerId, previous);
    };
    const splitPlayers = historyRecord.splitBreakdown?.splitType === 'players'
      ? historyRecord.splitBreakdown.players || []
      : [];
    if (splitPlayers.length > 0) {
      splitPlayers.forEach((player) => addRefundChange(
        player.customerId,
        player.method === 'credit' ? 0 : player.amount,
        player.method === 'credit' ? player.amount : 0
      ));
    } else {
      addRefundChange(historyRecord.customerId, historyRecord.amountPaid, historyRecord.balanceDue);
    }

    const customerRefs = new Map<string, ReturnType<typeof doc>>();
    for (const customerId of customerChanges.keys()) {
      customerRefs.set(customerId, doc(db, 'clubs', clubId, 'customers', customerId));
    }
    const customerSnapshots = new Map<string, any>();
    for (const [customerId, customerRef] of customerRefs) {
      customerSnapshots.set(customerId, await transaction.get(customerRef));
    }
    for (const [customerId, customerSnap] of customerSnapshots) {
      if (!customerSnap.exists()) throw new Error(`Customer ${customerId} is missing, so this refund was not recorded.`);
    }

    const refundedAt = Date.now();
    const portalSnapshots = new Map<string, any>();
    for (const customerId of customerChanges.keys()) {
      portalSnapshots.set(customerId, await transaction.get(doc(db, 'clubs', clubId, 'customerPortal', customerId)));
    }
    transaction.update(histRef, {
      paymentStatus: 'refunded',
      refundReason: reason,
      refundedBy: performedBy,
      refundedAt,
      refundedAmount: Math.max(0, Number(historyRecord.amountPaid) || 0),
    });
    for (const [customerId, change] of customerChanges) {
      const customer = customerSnapshots.get(customerId).data() as TopCustomer;
      const portal = portalSnapshots.get(customerId);
      const refundableDue = Math.min(Math.max(0, Number(customer.outstandingDue) || 0), change.due);
      const creditFromPreviouslySettledDue = Math.max(0, change.due - refundableDue);
      const reversal: UdhaarTransaction = {
        id: `${historyId}-refund-due-${customerId}`,
        timestamp: refundedAt,
        type: 'due_reversed',
        amount: change.due,
        description: `Credit reversed for refunded receipt #${historyRecord.receiptNo}`,
        receiptNo: historyRecord.receiptNo,
        receiptId: historyId,
        customerId,
        recordedByEmail: auth.currentUser?.email || '',
        recordedBy: performedBy,
      };
      transaction.update(customerRefs.get(customerId)!, {
        outstandingDue: increment(-refundableDue),
        walletBalance: increment(creditFromPreviouslySettledDue),
        totalSpent: increment(-change.paid),
        ...(change.due > 0 ? { udhaarLedger: arrayUnion(reversal) } : {}),
      });
      if (portal.exists() && portal.data().enabled === true) {
        transaction.set(doc(db, 'clubs', clubId, 'customerPortal', customerId), {
          outstandingDue: increment(-refundableDue),
          walletBalance: increment(creditFromPreviouslySettledDue),
          totalSpent: increment(-change.paid),
        }, { merge: true });
        transaction.set(doc(db, 'clubs', clubId, 'customerPortal', customerId, 'receipts', historyId), {
          paymentStatus: 'refunded',
          refundedAmount: change.paid,
          refundReason: reason,
        }, { merge: true });
        const activity: CustomerPortalActivity = {
          id: `${historyId}-refund-${customerId}`,
          clubId,
          timestamp: refundedAt,
          type: 'refund_issued',
          amount: change.paid + change.due,
          description: `Refund recorded for receipt #${historyRecord.receiptNo}`,
          receiptNo: historyRecord.receiptNo,
          receiptId: historyId,
          recordedByEmail: auth.currentUser?.email || '',
        };
        transaction.set(doc(db, 'clubs', clubId, 'customerPortal', customerId, 'activity', activity.id), activity);
      }
    }

    transaction.set(auditRef, {
      id: auditRef.id,
      clubId,
      action: 'REFUND_ISSUED',
      performedBy,
      timestamp: refundedAt,
      details: `Refunded receipt #${historyRecord.receiptNo}; paid amount ${historyRecord.amountPaid}; reversed due ${historyRecord.balanceDue}. Reason: ${reason}`,
    });
  });
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
    const email = invitation.email.toLowerCase().trim();
    const invitationId = email;
    const invRef = doc(db, 'invitations', invitationId);
    await setDoc(invRef, {
      ...invitation,
      email,
      createdAt: Date.now(),
      status: 'pending'
    });
    return invitationId;
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
