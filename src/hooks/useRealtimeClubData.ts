import { useState, useEffect } from 'react';
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
  UserRole
} from '../types';
import { 
  subscribeClubSettings, 
  subscribeTables, 
  subscribeMenuItems, 
  subscribeHistory, 
  subscribeTopCustomers, 
  subscribeSessionRequests,
  subscribeAuditLogs,
  subscribeFoodOrders,
  subscribePurchaseRecords,
  subscribeInventoryAdjustments,
  subscribeEmployees,
  subscribeAttendance,
  subscribeExpenses,
  subscribeMaintenance,
  subscribeNotifications,
  updateClubSettings,
  saveTable,
  updateTableStatus,
  deleteTableDoc,
  startTableSession,
  transferTableSession,
  togglePauseTableSession,
  addOrdersToSession,
  requestTableCheckout,
  finalizeSessionPayment,
  saveMenuItem,
  deleteMenuItemDoc,
  createCustomerSessionRequest,
  approveCustomerSessionRequest,
  rejectCustomerSessionRequest,
  refundSessionPayment,
  updateHistoryRecordDoc,
  createFoodOrder,
  updateFoodOrderStatus,
  recordStockAdjustment,
  recordPurchase,
  saveCustomerCRM,
  recordCustomerAccountTransaction,
  deleteCustomerCRM,
  saveEmployee,
  deleteEmployee,
  recordAttendanceCheckIn,
  recordAttendanceCheckOut,
  saveExpense,
  deleteExpense,
  recordTableMaintenance,
  resolveTableMaintenance,
  createNotification,
  markNotificationAsRead,
  markNotificationAsResolved,
  deleteNotification,
  clearAllNotifications,
  logAuditEvent
} from '../services/dbService';
import { 
  initialBusinessConfig,
  initialTables,
  initialMenuItems,
  initialSessionHistory,
  initialTopCustomers,
  initialEmployees,
  initialAttendance,
  initialExpenses,
  initialMaintenanceRecords,
  initialNotifications
} from '../data/mockData';

export const useRealtimeClubData = (clubId: string) => {
  const [config, setConfig] = useState<BusinessConfig>(initialBusinessConfig);
  const [tables, setTables] = useState<TableItem[]>(initialTables);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [history, setHistory] = useState<SessionHistoryItem[]>(initialSessionHistory);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>(initialTopCustomers);
  const [sessionRequests, setSessionRequests] = useState<SessionRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [foodOrders, setFoodOrders] = useState<FoodOrder[]>([]);
  const [purchaseRecords, setPurchaseRecords] = useState<PurchaseRecord[]>([]);
  const [inventoryAdjustments, setInventoryAdjustments] = useState<InventoryAdjustment[]>([]);
  const [employees, setEmployees] = useState<EmployeeUser[]>(initialEmployees);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialAttendance);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(initialExpenses);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(initialMaintenanceRecords);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!clubId) return;

    // Safety timeout: never leave UI in loading state
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    const unsubConfig = subscribeClubSettings(clubId, (data) => setConfig(data));
    const unsubTables = subscribeTables(clubId, (data) => {
      if (data && data.length > 0) {
        setTables(data);
      }
      setIsLoading(false);
    });
    const unsubMenuItems = subscribeMenuItems(clubId, (data) => {
      if (data && data.length > 0) setMenuItems(data);
    });
    const unsubHistory = subscribeHistory(clubId, (data) => {
      if (data) setHistory(data);
    });
    const unsubCustomers = subscribeTopCustomers(clubId, (data) => {
      if (data) setTopCustomers(data);
    });
    const unsubRequests = subscribeSessionRequests(clubId, (data) => setSessionRequests(data || []));
    const unsubLogs = subscribeAuditLogs(clubId, (data) => setAuditLogs(data || []));
    const unsubFoodOrders = subscribeFoodOrders(clubId, (data) => setFoodOrders(data || []));
    const unsubPurchases = subscribePurchaseRecords(clubId, (data) => setPurchaseRecords(data || []));
    const unsubAdjustments = subscribeInventoryAdjustments(clubId, (data) => setInventoryAdjustments(data || []));
    const unsubEmployees = subscribeEmployees(clubId, (data) => {
      if (data) setEmployees(data);
    });
    const unsubAttendance = subscribeAttendance(clubId, (data) => {
      if (data) setAttendance(data);
    });
    const unsubExpenses = subscribeExpenses(clubId, (data) => {
      if (data) setExpenses(data);
    });
    const unsubMaintenance = subscribeMaintenance(clubId, (data) => {
      if (data) setMaintenanceRecords(data);
    });
    const unsubNotifications = subscribeNotifications(clubId, (data) => {
      if (data) setNotifications(data);
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubConfig();
      unsubTables();
      unsubMenuItems();
      unsubHistory();
      unsubCustomers();
      unsubRequests();
      unsubLogs();
      unsubFoodOrders();
      unsubPurchases();
      unsubAdjustments();
      unsubEmployees();
      unsubAttendance();
      unsubExpenses();
      unsubMaintenance();
      unsubNotifications();
    };
  }, [clubId]);

  // Handlers
  const handleUpdateConfig = async (newConfig: Partial<BusinessConfig>, userEmail: string = 'system') => {
    await updateClubSettings(clubId, newConfig);
    await logAuditEvent(clubId, 'UPDATE_CLUB_SETTINGS', userEmail, 'Updated business config');
  };

  const handleSaveTable = async (table: TableItem, userEmail: string = 'system') => {
    await saveTable(clubId, table);
    await logAuditEvent(clubId, 'SAVE_TABLE', userEmail, `Saved table ${table.name}`);
  };

  const handleDeleteTable = async (tableId: string, userEmail: string = 'system') => {
    await deleteTableDoc(clubId, tableId);
    await logAuditEvent(clubId, 'DELETE_TABLE', userEmail, `Deleted table ID ${tableId}`);
  };

  const handleStartSession = async (tableId: string, session: SessionData, userEmail: string = 'system') => {
    await startTableSession(clubId, tableId, session);
    await logAuditEvent(clubId, 'START_SESSION', userEmail, `Started session for ${session.customerName} on table ${tableId}`);
  };

  const handleTransferTableSession = async (sourceTableId: string, targetTableId: string, userEmail: string = 'system') => {
    await transferTableSession(clubId, sourceTableId, targetTableId);
    await logAuditEvent(clubId, 'TRANSFER_SESSION', userEmail, `Moved an active session from table ${sourceTableId} to ${targetTableId}`);
  };

  const handleTogglePause = async (tableId: string, currentSession: SessionData, userEmail: string = 'system') => {
    await togglePauseTableSession(clubId, tableId, currentSession);
    await logAuditEvent(clubId, 'TOGGLE_PAUSE_SESSION', userEmail, `Toggled pause on table ${tableId}`);
  };

  const handleAddOrders = async (tableId: string, currentSession: SessionData, orders: OrderItem[], userEmail: string = 'system') => {
    await addOrdersToSession(clubId, tableId, currentSession, orders);
    await logAuditEvent(clubId, 'ADD_FOOD_ORDERS', userEmail, `Added ${orders.length} order items to table ${tableId}`);
  };

  const handleRequestCheckout = async (tableId: string, userEmail: string = 'system') => {
    await requestTableCheckout(clubId, tableId);
    await createNotification(clubId, {
      clubId,
      type: 'checkout_req',
      title: 'Checkout Requested',
      message: `Table ID ${tableId} has requested checkout & settlement.`,
      timestamp: Date.now(),
      read: false,
      severity: 'info'
    });
    await logAuditEvent(clubId, 'REQUEST_CHECKOUT', userEmail, `Requested checkout for table ${tableId}`);
  };

  const handleFinalizeBill = async (historyRecord: SessionHistoryItem, userEmail: string = 'system') => {
    await finalizeSessionPayment(clubId, {
      ...historyRecord,
      processedBy: historyRecord.processedBy || userEmail,
    });
    // Auto-resolve any checkout requests for this table
    const relatedNotifs = notifications.filter(
      (n) => n.type === 'checkout_req' && (n.targetId === historyRecord.tableId || n.message?.includes(`Table ID ${historyRecord.tableId}`) || n.message?.includes(`Table #${historyRecord.tableId}`))
    );
    for (const notif of relatedNotifs) {
      markNotificationAsResolved(clubId, notif.id).catch(() => {});
    }
  };

  const handleRefundPayment = async (historyId: string, reason: string, userEmail: string = 'system') => {
    await refundSessionPayment(clubId, historyId, reason, userEmail);
  };

  const handleUpdateHistoryRecord = async (historyId: string, updates: Partial<SessionHistoryItem>, userEmail: string = 'system') => {
    await updateHistoryRecordDoc(clubId, historyId, updates, userEmail);
  };

  const handleSaveMenuItem = async (item: MenuItem, userEmail: string = 'system') => {
    await saveMenuItem(clubId, item);
    await logAuditEvent(clubId, 'SAVE_MENU_ITEM', userEmail, `Saved menu item ${item.name}`);
  };

  const handleDeleteMenuItem = async (itemId: string, userEmail: string = 'system') => {
    await deleteMenuItemDoc(clubId, itemId);
    await logAuditEvent(clubId, 'DELETE_MENU_ITEM', userEmail, `Deleted menu item ID ${itemId}`);
  };

  const handleCustomerSessionRequest = async (tableId: string, name: string, phone: string, count: number = 2) => {
    await createCustomerSessionRequest(clubId, tableId, name, phone, count);
    await createNotification(clubId, {
      clubId,
      type: 'new_booking',
      title: 'New QR Customer Booking',
      message: `${name} requested a session on Table ID ${tableId}`,
      timestamp: Date.now(),
      read: false,
      severity: 'info',
      targetId: tableId
    });
  };

  const handleApproveSessionRequest = async (requestId: string, tableId: string, session: SessionData) => {
    await approveCustomerSessionRequest(clubId, requestId, tableId, session);
    // Auto-resolve booking notification
    const relatedNotifs = notifications.filter(
      (n) => n.type === 'new_booking' && (n.targetId === requestId || n.targetId === tableId || n.message?.includes(tableId))
    );
    for (const notif of relatedNotifs) {
      markNotificationAsResolved(clubId, notif.id).catch(() => {});
    }
  };

  const handleRejectSessionRequest = async (requestId: string) => {
    await rejectCustomerSessionRequest(clubId, requestId);
    // Auto-resolve booking notification
    const relatedNotifs = notifications.filter(
      (n) => n.type === 'new_booking' && (n.targetId === requestId)
    );
    for (const notif of relatedNotifs) {
      markNotificationAsResolved(clubId, notif.id).catch(() => {});
    }
  };

  const handleCreateFoodOrder = async (order: Omit<FoodOrder, 'id'>) => {
    return await createFoodOrder(clubId, order);
  };

  const handleUpdateOrderStatus = async (order: FoodOrder, status: FoodOrderStatus, userEmail: string = 'staff') => {
    await updateFoodOrderStatus(clubId, order, status, userEmail);
    if (status === 'delivered' || status === 'cancelled') {
      const relatedNotifs = notifications.filter(
        (n) => n.type === 'food_order' && (n.targetId === order.id || n.message?.includes(order.tableName || ''))
      );
      for (const notif of relatedNotifs) {
        markNotificationAsResolved(clubId, notif.id).catch(() => {});
      }
    }
  };

  const handleRecordStockAdjustment = async (
    menuId: string,
    menuName: string,
    type: InventoryAdjustment['adjustmentType'],
    quantityChange: number,
    newStock: number,
    performedBy: string = 'staff',
    reason?: string
  ) => {
    await recordStockAdjustment(clubId, menuId, menuName, type, quantityChange, newStock, performedBy, reason);
    if (newStock <= 5) {
      await createNotification(clubId, {
        clubId,
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: `${menuName} is now down to ${newStock} units in inventory.`,
        timestamp: Date.now(),
        read: false,
        severity: 'warning'
      });
    }
  };

  const handleRecordPurchase = async (
    purchase: Omit<PurchaseRecord, 'id' | 'timestamp'>,
    performedBy: string = 'staff'
  ) => {
    await recordPurchase(clubId, purchase, performedBy);
  };

  // Phase 7 new handlers
  const handleSaveCustomerCRM = async (customer: TopCustomer) => {
    await saveCustomerCRM(clubId, customer);
  };

  const handleRecordCustomerAccountTransaction = async (customerId: string, entry: import('../types').UdhaarTransaction) => {
    await recordCustomerAccountTransaction(clubId, customerId, entry);
  };

  const handleDeleteCustomerCRM = async (customerId: string) => {
    setTopCustomers((prev) => prev.filter((c) => c.id !== customerId));
    await deleteCustomerCRM(clubId, customerId);
  };

  const handleSaveEmployee = async (employee: Partial<EmployeeUser>) => {
    const empId = await saveEmployee(clubId, employee);
    await createNotification(clubId, {
      clubId,
      type: 'employee_login',
      title: 'Employee Profile Saved',
      message: `Staff member ${employee.name || 'User'} (${employee.role || 'staff'}) updated.`,
      timestamp: Date.now(),
      read: false,
      severity: 'info'
    });
    return empId;
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    await deleteEmployee(clubId, employeeId);
  };

  const handleCheckIn = async (employeeId: string, employeeName: string, role: UserRole, notes?: string) => {
    await recordAttendanceCheckIn(clubId, employeeId, employeeName, role, notes);
    await createNotification(clubId, {
      clubId,
      type: 'employee_login',
      title: 'Staff Checked In',
      message: `${employeeName} checked in for shift duty.`,
      timestamp: Date.now(),
      read: false,
      severity: 'success'
    });
  };

  const handleCheckOut = async (attendanceId: string) => {
    await recordAttendanceCheckOut(clubId, attendanceId);
  };

  const handleSaveExpense = async (expense: Omit<ExpenseRecord, 'id'> & { id?: string }) => {
    await saveExpense(clubId, expense);
    await logAuditEvent(clubId, 'RECORD_EXPENSE', expense.recordedBy, `Recorded expense ${expense.category}: $${expense.amount}`);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    await deleteExpense(clubId, expenseId);
  };

  const handleRecordMaintenance = async (record: Omit<MaintenanceRecord, 'id'>) => {
    await recordTableMaintenance(clubId, record);
    await createNotification(clubId, {
      clubId,
      type: 'table_maintenance',
      title: 'Table Under Maintenance',
      message: `${record.tableName} set to maintenance: ${record.reason}`,
      timestamp: Date.now(),
      read: false,
      severity: 'error',
      targetId: record.tableId
    });
  };

  const handleResolveMaintenance = async (tableId: string, maintenanceId: string) => {
    await resolveTableMaintenance(clubId, tableId, maintenanceId);
    // Auto-resolve any maintenance notification for this table
    const relatedNotifs = notifications.filter(
      (n) => n.type === 'table_maintenance' && (n.targetId === tableId || n.message?.includes(tableId))
    );
    for (const notif of relatedNotifs) {
      markNotificationAsResolved(clubId, notif.id).catch(() => {});
    }
  };

  const handleMarkNotificationRead = async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    await markNotificationAsRead(clubId, notificationId);
  };

  const handleResolveNotification = async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true, resolved: true, resolvedAt: Date.now() } : n))
    );
    await markNotificationAsResolved(clubId, notificationId);
  };

  const handleDeleteNotification = async (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    await deleteNotification(clubId, notificationId);
  };

  const handleClearNotifications = async () => {
    const ids = notifications.map(n => n.id);
    setNotifications([]);
    await clearAllNotifications(clubId, ids);
  };

  return {
    config,
    tables,
    menuItems,
    history,
    topCustomers,
    sessionRequests,
    auditLogs,
    foodOrders,
    purchaseRecords,
    inventoryAdjustments,
    employees,
    attendance,
    expenses,
    maintenanceRecords,
    notifications,
    isLoading,
    updateConfig: handleUpdateConfig,
    saveTable: handleSaveTable,
    deleteTable: handleDeleteTable,
    startSession: handleStartSession,
    transferSession: handleTransferTableSession,
    togglePause: handleTogglePause,
    addOrders: handleAddOrders,
    requestCheckout: handleRequestCheckout,
    finalizeBill: handleFinalizeBill,
    refundPayment: handleRefundPayment,
    updateHistoryRecord: handleUpdateHistoryRecord,
    saveMenuItem: handleSaveMenuItem,
    deleteMenuItem: handleDeleteMenuItem,
    createCustomerSessionRequest: handleCustomerSessionRequest,
    approveSessionRequest: handleApproveSessionRequest,
    rejectSessionRequest: handleRejectSessionRequest,
    createFoodOrder: handleCreateFoodOrder,
    updateOrderStatus: handleUpdateOrderStatus,
    recordStockAdjustment: handleRecordStockAdjustment,
    recordPurchase: handleRecordPurchase,
    // Phase 7 Actions
    saveCustomer: handleSaveCustomerCRM,
    saveCustomerCRM: handleSaveCustomerCRM,
    recordCustomerAccountTransaction: handleRecordCustomerAccountTransaction,
    deleteCustomer: handleDeleteCustomerCRM,
    deleteCustomerCRM: handleDeleteCustomerCRM,
    saveEmployee: handleSaveEmployee,
    deleteEmployee: handleDeleteEmployee,
    checkInEmployee: handleCheckIn,
    checkOutEmployee: handleCheckOut,
    saveExpense: handleSaveExpense,
    deleteExpense: handleDeleteExpense,
    recordMaintenance: handleRecordMaintenance,
    resolveMaintenance: handleResolveMaintenance,
    markNotificationRead: handleMarkNotificationRead,
    resolveNotification: handleResolveNotification,
    deleteNotification: handleDeleteNotification,
    clearAllNotifications: handleClearNotifications,
    clearNotifications: handleClearNotifications,
  };
};
