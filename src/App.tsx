import React, { useState } from 'react';
import { 
  TableItem, 
  MenuItem, 
  SessionHistoryItem, 
  TopCustomer, 
  BusinessConfig, 
  PageView, 
  OrderItem,
  SessionData,
  UserRole
} from './types';
import { Sidebar } from './components/navigation/Sidebar';
import { Navbar } from './components/navigation/Navbar';
import { MobileBottomNav } from './components/navigation/MobileBottomNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { BillingView } from './components/billing/BillingView';
import { TableDetailsModal } from './components/tables/TableDetailsModal';
import { StartSessionModal } from './components/tables/StartSessionModal';
import { TransferTableModal } from './components/tables/TransferTableModal';
import { AddSnackModal } from './components/tables/AddSnackModal';
import { ReceiptModal } from './components/billing/ReceiptModal';
import { FoodInventoryView } from './components/menu/FoodInventoryView';
import { CustomerCRMView } from './components/crm/CustomerCRMView';
import { CustomerPortalView } from './components/crm/CustomerPortalView';
import { EmployeeManagementView } from './components/employees/EmployeeManagementView';
import { ExpenseProfitView } from './components/expenses/ExpenseProfitView';
import { TableMaintenanceView } from './components/maintenance/TableMaintenanceView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { LoginView } from './components/auth/LoginView';
import { ToastContainer, ToastMessage } from './components/ui/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useRealtimeClubData } from './hooks/useRealtimeClubData';
import { performDailyAutoSnapshot } from './utils/autoSnapshot';
import { OfflineBanner } from './components/common/OfflineBanner';
import { createNotification } from './services/dbService';
import { RoleGuard } from './components/common/RoleGuard';
import { CheckCircle2, Sparkles, CircleDot } from 'lucide-react';
import { soundEffects } from './utils/soundEffects';
import { calculateBillTotals, getBusinessDateKey } from './utils/formatters';
import { getFriendlyErrorMessage } from './utils/errorHandler';

function StaffClubApp() {
  const { user, currentClubId, role, signOutUser, hasPermission } = useAuth();
  
  // Realtime Firestore Hook for current Club
  const {
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
    expenses,
    maintenanceRecords,
    notifications,
    isLoading: isDataLoading,
    updateConfig,
    saveTable,
    deleteTable,
    startSession,
    transferSession,
    togglePause,
    addOrders,
    removeOrder,
    requestCheckout,
    finalizeBill,
    refundPayment,
    updateHistoryRecord,
    saveMenuItem,
    deleteMenuItem,
    createCustomerSessionRequest,
    approveSessionRequest,
    rejectSessionRequest,
    createFoodOrder,
    updateOrderStatus,
    recordStockAdjustment,
    recordPurchase,
    saveCustomer,
    recordCustomerAccountTransaction,
    deleteCustomer,
    saveEmployee,
    deleteEmployee,
    saveExpense,
    deleteExpense,
    recordMaintenance,
    resolveMaintenance,
    markNotificationRead,
    resolveNotification,
    deleteNotification,
    clearAllNotifications,
    resetClubData,
  } = useRealtimeClubData(currentClubId, role);

  // View state
  const [activePage, setActivePage] = useState<PageView>('dashboard');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cuedesk_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapsed = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('cuedesk_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Daily Background Auto-Snapshot Trigger
  React.useEffect(() => {
    if (currentClubId && !isDataLoading) {
      performDailyAutoSnapshot(currentClubId, config.timeZone || 'Asia/Kolkata');
    }
  }, [currentClubId, config.timeZone, isDataLoading]);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      title,
      message,
    };
    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check route permission when activePage changes
  React.useEffect(() => {
    if (!user) return;
    
    // Page Permission map
    const pagePermissions: Record<string, UserRole> = {
      'settings': 'owner',
      'employees': 'owner',
      'reports': 'manager',
      'expenses': 'manager',
      'menu-inventory': 'manager',
      'maintenance': 'manager',
    };

    const requiredRole = pagePermissions[activePage];
    if (requiredRole && !hasPermission(requiredRole)) {
      addToast('warning', 'Access Restricted', `Your role (${user.role.toUpperCase()}) does not have permission to access ${activePage}. Redirecting to Dashboard.`);
      setActivePage('dashboard');
    }
  }, [activePage, user]);

  // Modals & Selection state
  const previousUnreadCueBoysRef = React.useRef<number>(0);

  React.useEffect(() => {
    const unreadCueBoys = notifications.filter(
      (n) => !n.read && (n.title?.includes('Cue Boy') || n.title?.includes('Assistance'))
    ).length;

    if (unreadCueBoys > previousUnreadCueBoysRef.current) {
      soundEffects.playCueBoyCallSound();
    }
    previousUnreadCueBoysRef.current = unreadCueBoys;
  }, [notifications]);

  const [selectedTableDetails, setSelectedTableDetails] = useState<TableItem | null>(null);
  const [transferSourceTable, setTransferSourceTable] = useState<TableItem | null>(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const [addSnackTargetTable, setAddSnackTargetTable] = useState<TableItem | null>(null);
  const [isAddSnackOpen, setIsAddSnackOpen] = useState(false);

  const [activeReceiptItem, setActiveReceiptItem] = useState<SessionHistoryItem | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const [isStartSessionModalOpen, setIsStartSessionModalOpen] = useState(false);
  const [startSessionTargetTable, setStartSessionTargetTable] = useState<TableItem | null>(null);

  // Derived Metrics
  const occupiedCount = tables.filter((t) => t.status === 'occupied' || t.status === 'payment_pending').length;
  const availableTables = tables.filter((t) => t.status === 'available');

  const businessTimeZone = config.timeZone || 'Asia/Kolkata';
  const todayKey = getBusinessDateKey(Date.now(), businessTimeZone);
  const historyToday = history.filter((h) =>
    getBusinessDateKey(h.endTime || h.startTime, businessTimeZone) === todayKey
  );
  const sessionCollectionsToday = historyToday.reduce((sum, h) =>
    sum + (Number(h.amountPaid) || 0), 0
  );
  const accountCollectionsToday = topCustomers.reduce((sum, customer) =>
    sum + (customer.udhaarLedger || []).reduce((customerSum, transaction) => {
      const postedToday = getBusinessDateKey(transaction.timestamp, businessTimeZone) === todayKey;
      const isSeparateCollection = transaction.type === 'payment_received' && transaction.source === 'balance_settlement';
      const isDeposit = transaction.type === 'deposit_added' && transaction.source === 'deposit';
      return customerSum + (postedToday && (isSeparateCollection || isDeposit) ? Number(transaction.amount) || 0 : 0);
    }, 0), 0
  );
  const refundsToday = history.reduce((sum, h) =>
    sum + (h.paymentStatus === 'refunded' && getBusinessDateKey(h.refundedAt, businessTimeZone) === todayKey
      ? Number(h.refundedAmount ?? h.amountPaid) || 0
      : 0), 0
  );
  const revenueToday = sessionCollectionsToday + accountCollectionsToday - refundsToday;
  const expensesToday = expenses
    .filter((e) => getBusinessDateKey(e.date || e.timestamp, businessTimeZone) === todayKey)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netProfitToday = revenueToday - expensesToday;
  const pendingPaymentsTotal = tables
    .filter((t) => (t.status === 'occupied' || t.status === 'payment_pending') && t.currentSession)
    .reduce((sum, t) => {
      const s = t.currentSession!;
      const estimate = calculateBillTotals(
        s,
        0,
        false,
        0,
        Date.now(),
        [],
        config.roundingRule,
        config.minimumChargeMinutes || 0
      );
      return sum + estimate.grandTotal;
    }, 0);

  const pendingRequests = sessionRequests.filter((r) => r.status === 'pending');

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------

  // 1. Instant Start Table (No upfront prompt - customer details recorded on checkout)
  const handleInstantStartTable = async (table: TableItem) => {
    if (!table || table.status !== 'available' || table.currentSession) return;
    const hourlyRate = table.hourlyRate || config.defaultHourlyRate || 180;
    const newSession: SessionData = {
      id: `sess-${Date.now()}`,
      tableId: table.id,
      customerName: `Table #${table.number}`,
      customerPhone: '',
      startTime: Date.now(),
      hourlyRate,
      isPaused: false,
      totalPausedSeconds: 0,
      foodOrders: [],
      foodTotal: 0,
      rateType: 'standard',
    };

    try {
      await startSession(table.id, newSession, user?.email);
      soundEffects.playStartChime();
      addToast('success', `Table #${table.number} Started!`, `Session is running. Name & payment will be recorded when closing.`);
    } catch (error) {
      addToast('error', 'Session Not Started', getFriendlyErrorMessage(error));
    }
  };

  // 1b. Start Table with Customer Details / Modal Selection
  const handleStartSessionWithDetails = async (
    tableId: string,
    customerName: string,
    customerPhone: string,
    hourlyRate: number
  ) => {
    const targetTable = tables.find((t) => t.id === tableId);
    if (!targetTable || targetTable.status !== 'available' || targetTable.currentSession) {
      addToast('warning', 'Table Unavailable', 'Selected table is no longer available.');
      return;
    }
    const rate = hourlyRate || targetTable.hourlyRate || config.defaultHourlyRate || 180;
    const newSession: SessionData = {
      id: `sess-${Date.now()}`,
      tableId: targetTable.id,
      customerName: customerName.trim() || `Table #${targetTable.number}`,
      customerPhone: customerPhone.trim(),
      startTime: Date.now(),
      hourlyRate: rate,
      isPaused: false,
      totalPausedSeconds: 0,
      foodOrders: [],
      foodTotal: 0,
      rateType: 'standard',
    };

    try {
      await startSession(targetTable.id, newSession, user?.email);
      soundEffects.playStartChime();
      addToast('success', `Table #${targetTable.number} Started!`, `Session is running for ${newSession.customerName}.`);
    } catch (error) {
      addToast('error', 'Session Not Started', getFriendlyErrorMessage(error));
    }
  };

  // 2. Pause / Resume Session
  const handlePauseResumeSession = async (table: TableItem) => {
    if (!table.currentSession) return;
    await togglePause(table.id, table.currentSession, user?.email);

    const isNowPaused = !table.currentSession.isPaused;
    if (isNowPaused) {
      soundEffects.playPauseChime();
    } else {
      soundEffects.playStartChime();
    }
    addToast(
      isNowPaused ? 'warning' : 'success',
      isNowPaused ? `Timer Paused` : `Timer Resumed`,
      `Table #${table.number} session is now ${isNowPaused ? 'paused' : 'running'}`
    );
  };

  // 3. End Session & Redirect to Billing
  const handleEndSession = async (table: TableItem) => {
    await requestCheckout(table.id, user?.email);
    setSelectedTableDetails(null);
    setActivePage('billing');
    addToast('info', `Table #${table.number} Checkout Pending`, `Review statement and collect payment.`);
  };

  // 4. Transfer Table
  const handleConfirmTransfer = async (sourceTableId: string, targetTableId: string) => {
    if (role === 'worker') {
      addToast('warning', 'Manager approval required', 'Ask the club owner or manager to transfer this active session.');
      return;
    }
    const source = tables.find((t) => t.id === sourceTableId);
    const target = tables.find((t) => t.id === targetTableId);

    if (!source || !target || !source.currentSession) return;
    await transferSession(sourceTableId, targetTableId, user?.email);

    addToast(
      'success',
      `Table Transferred`,
      `Session moved from Table #${source.number} to Table #${target.number}`
    );
  };

  // 5. Add Order Items (Snacks/Beverages)
  const handleAddOrderItems = async (tableId: string, itemsToAdd: OrderItem[]) => {
    const targetTable = tables.find((t) => t.id === tableId);
    if (!targetTable || !targetTable.currentSession) return;

    await addOrders(tableId, targetTable.currentSession, itemsToAdd, user?.email);
    soundEffects.playSnackAddSound();

    addToast('success', `Items Added`, `${itemsToAdd.length} item(s) added to Table #${targetTable.number}.`);
  };

  // 6. Remove Order Item
  const handleRemoveOrderItem = async (tableId: string, orderId: string) => {
    const targetTable = tables.find((t) => t.id === tableId);
    if (!targetTable || !targetTable.currentSession) return;

    const order = targetTable.currentSession.foodOrders.find((item) => item.id === orderId);
    if (!order || !window.confirm(`Remove ${order.name} from this table bill?`)) return;

    try {
      await removeOrder(tableId, targetTable.currentSession.id, orderId, user?.email);
      addToast('info', 'Item Removed', `${order.name} removed from the bill.`);
    } catch (error) {
      addToast('error', 'Item Not Removed', error instanceof Error ? error.message : 'Refresh the table and try again.');
    }
  };

  // 7. Finalize bill, customer activity, balances and audit record atomically.
  const handleMarkPaid = async (historyItem: SessionHistoryItem) => {
    const receipt = {
      ...historyItem,
      processedBy: user?.email || 'Staff',
    };
    await finalizeBill(receipt, user?.email);
    soundEffects.playPaymentSuccessChime();
    addToast(
      'success',
      'Payment Recorded',
      `Receipt #${receipt.receiptNo} • ${config.currencySymbol}${(receipt.grandTotal || 0).toFixed(2)}`
    );
  };

  // 8. Settings Handlers
  const handleAddTable = async (newTableData: Omit<TableItem, 'id' | 'status'>) => {
    const newTable: TableItem = {
      ...newTableData,
      id: `tbl-${Date.now()}`,
      status: 'available',
    };
    await saveTable(newTable, user?.email);
    addToast('success', 'Table Added', `${newTable.name} saved in Firestore.`);
  };

  const handleDeleteTable = async (tableId: string) => {
    await deleteTable(tableId, user?.email);
    addToast('warning', 'Table Deleted', 'Table removed from Firestore database.');
  };

  const handleAddMenuItem = async (newItemData: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = {
      ...newItemData,
      id: `m-${Date.now()}`,
    };
    await saveMenuItem(newItem, user?.email);
    addToast('success', 'Menu Item Added', `${newItem.name} saved in Firestore.`);
  };

  const handleDeleteMenuItem = async (itemId: string) => {
    await deleteMenuItem(itemId, user?.email);
    addToast('info', 'Menu Item Removed', 'Item deleted from Firestore menu database.');
  };

  // Approve pending QR request from customer
  const handleApproveRequest = async (reqId: string, tableId: string, custName: string, custPhone?: string) => {
    const targetTable = tables.find((t) => t.id === tableId);
    const rate = targetTable ? targetTable.hourlyRate : config.defaultHourlyRate;

    const newSession: SessionData = {
      id: `sess-${Date.now()}`,
      tableId,
      customerName: custName,
      customerPhone: custPhone || '',
      startTime: Date.now(),
      hourlyRate: rate,
      isPaused: false,
      totalPausedSeconds: 0,
      foodOrders: [],
      foodTotal: 0,
      rateType: 'standard',
    };

    await approveSessionRequest(reqId, tableId, newSession);
    addToast('success', 'QR Session Approved!', `Table #${targetTable?.number || tableId} active for ${custName}`);
  };

  const handleRejectRequest = async (reqId: string) => {
    await rejectSessionRequest(reqId);
    addToast('warning', 'Session Request Rejected', 'Customer request was declined.');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-neutral-900 flex flex-col lg:flex-row antialiased font-sans">
      {/* Network Status Banner */}
      <OfflineBanner />

      {/* Toast Notifications Overlay */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Desktop & Mobile Drawer Sidebar */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        occupiedCount={occupiedCount}
        totalTables={tables.length}
        clubName={config.clubName}
        isMobileOpen={isMobileDrawerOpen}
        onCloseMobile={() => setIsMobileDrawerOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapsed={toggleSidebarCollapsed}
        onLogout={() => {
          signOutUser();
          addToast('info', 'Signed Out', 'You have been signed out to the login screen.');
        }}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Navbar */}
        <Navbar
          activePage={activePage}
          setActivePage={setActivePage}
          notifications={notifications}
          onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={toggleSidebarCollapsed}
          onMarkNotificationRead={async (id) => markNotificationRead(id)}
          onResolveNotification={async (id) => resolveNotification(id)}
          onDeleteNotification={async (id) => deleteNotification(id)}
          onQuickStartSession={() => {
            setStartSessionTargetTable(null);
            setIsStartSessionModalOpen(true);
          }}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1">
          {activePage === 'dashboard' || activePage === 'tables' ? (
            <DashboardView
              tables={tables}
              revenueToday={revenueToday}
              netProfitToday={netProfitToday}
              pendingPaymentsTotal={pendingPaymentsTotal}
              currencySymbol={config.currencySymbol}
              taxRatePercent={config.taxRatePercent}
              enableTax={config.enableTax}
              minimumChargeMinutes={config.minimumChargeMinutes || 0}
              roundingRule={config.roundingRule || 'nearest_1'}
              lowStockCount={menuItems.filter(m => (m.stock ?? 0) <= 5).length}
              sessionRequests={sessionRequests}
              notifications={notifications}
              onMarkNotificationRead={markNotificationRead}
              onResolveNotification={resolveNotification}
              onApproveRequest={(req) => handleApproveRequest(req.id, req.tableId, req.customerName, req.customerPhone)}
              onRejectRequest={(reqId) => handleRejectRequest(reqId)}
              onSelectTable={(table) => setSelectedTableDetails(table)}
              onStartSession={(table) => {
                handleInstantStartTable(table);
              }}
              onEndSession={handleEndSession}
              onPauseResumeSession={handlePauseResumeSession}
              onAddSnack={(table) => {
                setAddSnackTargetTable(table);
                setIsAddSnackOpen(true);
              }}
              onQuickStartAnySession={() => {
                setStartSessionTargetTable(null);
                setIsStartSessionModalOpen(true);
              }}
            />
          ) : activePage === 'billing' ? (
            <BillingView
              tables={tables}
              currencySymbol={config.currencySymbol}
              taxRatePercent={0}
              enableTax={false}
              upiId={config.upiId}
              upiName={config.upiName}
              config={config}
              history={history}
              userRole={role || 'owner'}
              auditLogs={auditLogs}
              topCustomers={topCustomers}
              onMarkPaid={handleMarkPaid}
              onShowReceipt={(hist) => {
                setActiveReceiptItem(hist);
                setIsReceiptOpen(true);
              }}
              onRefund={(historyId, reason) => {
                refundPayment(historyId, reason, user?.email || 'owner');
                addToast('success', 'Refund Processed', `Payment #${historyId} refunded.`);
              }}
              onUpdateHistoryRecord={(historyId, updates) => {
                updateHistoryRecord(historyId, updates, user?.email || 'owner');
                addToast('info', 'Record Updated', `Receipt updated in Firestore.`);
              }}
            />
          ) : activePage === 'menu-inventory' ? (
            <FoodInventoryView
              config={config}
              menuItems={menuItems}
              foodOrders={foodOrders}
              purchaseRecords={purchaseRecords}
              inventoryAdjustments={inventoryAdjustments}
              tables={tables}
              onSaveMenuItem={async (item) => {
                await saveMenuItem(item, user?.email);
                addToast('success', 'Menu Item Saved', `${item.name} updated in catalog.`);
              }}
              onDeleteMenuItem={async (itemId) => {
                await deleteMenuItem(itemId, user?.email);
                addToast('info', 'Item Removed', `Menu item deleted.`);
              }}
              onCreateFoodOrder={async (order) => {
                const id = await createFoodOrder(order);
                addToast('success', 'Food Order Placed', `Order #${id.slice(0, 6)} sent to kitchen.`);
                return id;
              }}
              onUpdateOrderStatus={async (order, status) => {
                await updateOrderStatus(order, status, user?.email || 'staff');
                addToast(
                  status === 'delivered' ? 'success' : 'info',
                  'Order Status Updated',
                  `Order #${order.id.slice(0, 6)} is now ${status.toUpperCase()}`
                );
              }}
              onRecordStockAdjustment={async (menuId, menuName, type, qty, newStock, reason) => {
                await recordStockAdjustment(menuId, menuName, type, qty, newStock, user?.email || 'staff', reason);
                addToast('info', 'Stock Adjusted', `${menuName} stock set to ${newStock}.`);
              }}
              onRecordPurchase={async (purchase) => {
                await recordPurchase(purchase, user?.email || 'staff');
                addToast('success', 'Purchase Recorded', `Added ${purchase.quantity}x ${purchase.menuName} to stock.`);
              }}
            />
          ) : activePage === 'customers' ? (
            <CustomerCRMView
              customers={topCustomers}
              history={history}
              config={config}
              onSaveCustomer={async (cust) => {
                await saveCustomer(cust);
                addToast('success', 'Customer Profile Saved', `${cust.name} updated in CRM.`);
              }}
              onRecordAccountTransaction={recordCustomerAccountTransaction}
              onDeleteCustomer={async (id) => {
                await deleteCustomer(id);
                addToast('info', 'Customer Deleted', 'Record removed from CRM.');
              }}
            />
          ) : activePage === 'employees' ? (
            <RoleGuard requiredPage="employees" onNavigateHome={() => setActivePage('dashboard')}>
              <EmployeeManagementView
                employees={employees}
                clubName={config.clubName}
                onSaveEmployee={async (emp) => {
                  const id = await saveEmployee(emp);
                  addToast('success', 'Staff Member Saved', `${emp.name} account active.`);
                  return id;
                }}
                onDeleteEmployee={async (id) => {
                  await deleteEmployee(id);
                  addToast('warning', 'Staff Member Removed', 'Account deleted.');
                }}
              />
            </RoleGuard>
          ) : activePage === 'expenses' ? (
            <RoleGuard requiredPage="expenses" onNavigateHome={() => setActivePage('dashboard')}>
              <ExpenseProfitView
                expenses={expenses}
                history={history}
                config={config}
                onSaveExpense={async (exp) => {
                  await saveExpense(exp);
                  addToast('success', 'Expense Recorded', `${exp.category} - ${config.currencySymbol}${exp.amount}`);
                }}
                onDeleteExpense={async (id) => {
                  await deleteExpense(id);
                  addToast('info', 'Expense Removed', 'Record deleted.');
                }}
              />
            </RoleGuard>
          ) : activePage === 'maintenance' ? (
            <RoleGuard requiredPage="maintenance" onNavigateHome={() => setActivePage('dashboard')}>
              <TableMaintenanceView
                tables={tables}
                maintenanceRecords={maintenanceRecords}
                config={config}
                onRecordMaintenance={async (record) => {
                  await recordMaintenance(record);
                  addToast('warning', 'Table Flagged for Maintenance', `${record.tableName} under repair.`);
                }}
                onResolveMaintenance={async (tableId, maintenanceId) => {
                  await resolveMaintenance(tableId, maintenanceId);
                  addToast('success', 'Maintenance Resolved', `Table is now operational!`);
                }}
              />
            </RoleGuard>
          ) : activePage === 'reports' ? (
            <RoleGuard requiredPage="reports" onNavigateHome={() => setActivePage('dashboard')}>
              <ReportsView
                history={history}
                topCustomers={topCustomers}
                tables={tables}
                currencySymbol={config.currencySymbol}
                timeZone={businessTimeZone}
              />
            </RoleGuard>
          ) : activePage === 'settings' ? (
            <RoleGuard requiredPage="settings" onNavigateHome={() => setActivePage('dashboard')}>
              <SettingsView
                config={config}
                tables={tables}
                menuItems={menuItems}
                employees={employees}
                history={history}
                customers={topCustomers}
                onUpdateConfig={async (newConf) => {
                  await updateConfig(newConf, user?.email);
                  addToast('success', 'Settings Saved', 'Business configuration updated in Firestore.');
                }}
                onAddTable={handleAddTable}
                onEditTable={saveTable}
                onDeleteTable={handleDeleteTable}
                onAddMenuItem={handleAddMenuItem}
                onEditMenuItem={saveMenuItem}
                onDeleteMenuItem={handleDeleteMenuItem}
                onSaveEmployee={saveEmployee}
                onDeleteEmployee={deleteEmployee}
              />
            </RoleGuard>
          ) : (
            <DashboardView
              tables={tables}
              revenueToday={revenueToday}
              netProfitToday={netProfitToday}
              pendingPaymentsTotal={pendingPaymentsTotal}
              currencySymbol={config.currencySymbol}
              taxRatePercent={config.taxRatePercent}
              enableTax={config.enableTax}
              minimumChargeMinutes={config.minimumChargeMinutes || 0}
              roundingRule={config.roundingRule || 'nearest_1'}
              lowStockCount={menuItems.filter(m => (m.stock ?? 0) <= 5).length}
              sessionRequests={sessionRequests}
              notifications={notifications}
              onMarkNotificationRead={markNotificationRead}
              onResolveNotification={resolveNotification}
              onApproveRequest={(req) => handleApproveRequest(req.id, req.tableId, req.customerName, req.customerPhone)}
              onRejectRequest={(reqId) => handleRejectRequest(reqId)}
              onSelectTable={(table) => setSelectedTableDetails(table)}
              onStartSession={(table) => {
                handleInstantStartTable(table);
              }}
              onEndSession={handleEndSession}
              onPauseResumeSession={handlePauseResumeSession}
              onAddSnack={(table) => {
                setAddSnackTargetTable(table);
                setIsAddSnackOpen(true);
              }}
              onQuickStartAnySession={() => {
                setStartSessionTargetTable(null);
                setIsStartSessionModalOpen(true);
              }}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav
          activePage={activePage}
          setActivePage={setActivePage}
          occupiedCount={occupiedCount}
          role={role}
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODALS & DRAWERS */}
      {/* ------------------------------------------------------------- */}

      {/* Table Details Modal */}
      <TableDetailsModal
        isOpen={Boolean(selectedTableDetails)}
        onClose={() => setSelectedTableDetails(null)}
        table={selectedTableDetails}
        currencySymbol={config.currencySymbol}
        taxRatePercent={config.taxRatePercent}
        enableTax={config.enableTax}
        minimumChargeMinutes={config.minimumChargeMinutes || 0}
        roundingRule={config.roundingRule || 'nearest_1'}
        canTransfer={role === 'owner' || role === 'manager'}
        onStartSession={(t) => {
          setSelectedTableDetails(null);
          handleInstantStartTable(t);
        }}
        onPauseResumeSession={handlePauseResumeSession}
        onEndSession={handleEndSession}
        onOpenAddSnacks={(t) => {
          setSelectedTableDetails(null);
          setAddSnackTargetTable(t);
          setIsAddSnackOpen(true);
        }}
        onOpenTransferTable={(t) => {
          setSelectedTableDetails(null);
          setTransferSourceTable(t);
          setIsTransferOpen(true);
        }}
        onRemoveOrderItem={role === 'worker' ? undefined : handleRemoveOrderItem}
      />

      {/* Transfer Table Modal */}
      <TransferTableModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        currentTable={transferSourceTable}
        availableTables={availableTables.filter((t) => t.id !== transferSourceTable?.id)}
        currencySymbol={config.currencySymbol}
        onConfirmTransfer={handleConfirmTransfer}
      />

      {/* Add Snack / Order Modal */}
      <AddSnackModal
        isOpen={isAddSnackOpen}
        onClose={() => setIsAddSnackOpen(false)}
        table={addSnackTargetTable}
        menuItems={menuItems}
        currencySymbol={config.currencySymbol}
        onAddOrderItems={handleAddOrderItems}
      />

      {/* Start Session Modal */}
      <StartSessionModal
        isOpen={isStartSessionModalOpen}
        onClose={() => {
          setIsStartSessionModalOpen(false);
          setStartSessionTargetTable(null);
        }}
        table={startSessionTargetTable}
        availableTables={availableTables}
        currencySymbol={config.currencySymbol}
        onConfirmStart={(tableId, custName, custPhone, rate) => {
          handleStartSessionWithDetails(tableId, custName, custPhone, rate);
        }}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        historyItem={activeReceiptItem}
        config={config}
      />
    </div>
  );
}

function AppRouter() {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#0a0a0c] text-sm font-semibold text-amber-300">Loading CueDesk Club…</div>;
  }
  if (!user) {
    return <div className="min-h-screen bg-[#0a0a0c] selection:bg-amber-500 selection:text-black"><LoginView /></div>;
  }
  if (user.role === 'customer') return <CustomerPortalView user={user} />;
  return <StaffClubApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
