import React, { useState } from 'react';
import { 
  TableItem, 
  MenuItem, 
  SessionHistoryItem, 
  TopCustomer, 
  BusinessConfig, 
  PageView, 
  OrderItem,
  SessionData 
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
import { TablesManagerView } from './components/tables/TablesManagerView';
import { FoodInventoryView } from './components/menu/FoodInventoryView';
import { CustomerCRMView } from './components/crm/CustomerCRMView';
import { EmployeeManagementView } from './components/employees/EmployeeManagementView';
import { ExpenseProfitView } from './components/expenses/ExpenseProfitView';
import { TableMaintenanceView } from './components/maintenance/TableMaintenanceView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { SuperAdminView } from './components/saas/SuperAdminView';
import { KitchenDisplayView } from './components/kds/KitchenDisplayView';
import { LoginView } from './components/auth/LoginView';
import { ToastContainer, ToastMessage } from './components/ui/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useRealtimeClubData } from './hooks/useRealtimeClubData';
import { performDailyAutoSnapshot } from './utils/autoSnapshot';
import { OfflineBanner } from './components/common/OfflineBanner';
import { createNotification } from './services/dbService';
import { RoleGuard } from './components/common/RoleGuard';
import { CheckCircle2, Sparkles, CircleDot, ChefHat } from 'lucide-react';
import { UserRole } from './types';

function CueDeskApp() {
  const { user, currentClubId, role, signOutUser, switchClub, isLoading: isAuthLoading, hasPermission } = useAuth();
  
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
    attendance,
    expenses,
    maintenanceRecords,
    notifications,
    saasClubs,
    isLoading: isDataLoading,
    updateConfig,
    saveTable,
    deleteTable,
    startSession,
    togglePause,
    addOrders,
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
    resetClubData,
    saveCustomer,
    deleteCustomer,
    saveEmployee,
    deleteEmployee,
    checkInEmployee,
    checkOutEmployee,
    saveExpense,
    deleteExpense,
    recordMaintenance,
    resolveMaintenance,
    markNotificationRead,
    clearAllNotifications,
    createSaaSClubWorkspace,
    updateSaaSClubPlan,
    extendSaaSClubTrial,
    updateSaaSClubFeatureFlags,
    suspendSaaSClubWorkspace,
    deleteSaaSClubWorkspace,
  } = useRealtimeClubData(currentClubId);

  // View state
  const [activePage, setActivePage] = useState<PageView>('dashboard');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Daily Background Auto-Snapshot Trigger
  React.useEffect(() => {
    if (currentClubId && !isDataLoading) {
      performDailyAutoSnapshot(currentClubId);
    }
  }, [currentClubId, isDataLoading]);

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
      'super-admin': 'owner',
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
  const [selectedTableDetails, setSelectedTableDetails] = useState<TableItem | null>(null);
  const [startSessionTable, setStartSessionTable] = useState<TableItem | null>(null);
  const [isStartSessionOpen, setIsStartSessionOpen] = useState(false);

  const [transferSourceTable, setTransferSourceTable] = useState<TableItem | null>(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const [addSnackTargetTable, setAddSnackTargetTable] = useState<TableItem | null>(null);
  const [isAddSnackOpen, setIsAddSnackOpen] = useState(false);

  const [activeReceiptItem, setActiveReceiptItem] = useState<SessionHistoryItem | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Derived Metrics
  const occupiedCount = tables.filter((t) => t.status === 'occupied' || t.status === 'payment_pending').length;
  const availableTables = tables.filter((t) => t.status === 'available');

  const revenueToday = history.reduce((sum, h) => sum + h.grandTotal, 0);
  const pendingPaymentsTotal = tables
    .filter((t) => (t.status === 'occupied' || t.status === 'payment_pending') && t.currentSession)
    .reduce((sum, t) => {
      const s = t.currentSession!;
      const hrs = Math.max(0.5, (Date.now() - s.startTime) / (1000 * 3600));
      const food = s.foodOrders ? s.foodOrders.reduce((fSum, item) => fSum + item.price * item.quantity, 0) : 0;
      return sum + hrs * s.hourlyRate + food;
    }, 0);

  const pendingRequests = sessionRequests.filter((r) => r.status === 'pending');

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------

  // 1. Start Session
  const handleConfirmStartSession = async (
    tableId: string,
    customerName: string,
    customerPhone: string,
    isMember: boolean,
    hourlyRate: number
  ) => {
    const targetTable = tables.find((t) => t.id === tableId);
    if (!targetTable) return;

    const newSession: SessionData = {
      id: `sess-${Date.now()}`,
      tableId,
      customerName,
      customerPhone,
      isMember,
      memberDiscountPercent: isMember ? 10 : 0,
      startTime: Date.now(),
      hourlyRate,
      isPaused: false,
      totalPausedSeconds: 0,
      foodOrders: [],
      rateType: isMember ? 'discounted' : 'standard',
    };

    await startSession(tableId, newSession, user?.email);
    addToast('success', `Session Started`, `Table #${targetTable.number} registered for ${customerName}`);
  };

  // 2. Pause / Resume Session
  const handlePauseResumeSession = async (table: TableItem) => {
    if (!table.currentSession) return;
    await togglePause(table.id, table.currentSession, user?.email);

    const isNowPaused = !table.currentSession.isPaused;
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
    const source = tables.find((t) => t.id === sourceTableId);
    const target = tables.find((t) => t.id === targetTableId);

    if (!source || !target || !source.currentSession) return;

    const transferredSession: SessionData = {
      ...source.currentSession,
      tableId: targetTableId,
    };

    // Save transferred session on target and clear source
    await startSession(targetTableId, transferredSession, user?.email);
    await startSession(sourceTableId, null as any, user?.email);

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

    // Send ticket to Kitchen Display System (KDS)
    const orderTotal = itemsToAdd.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    await createFoodOrder({
      clubId: currentClubId,
      tableId,
      tableName: targetTable.name,
      customerName: targetTable.currentSession.customerName || 'Guest',
      items: itemsToAdd,
      status: 'new',
      totalAmount: orderTotal,
      orderTime: Date.now(),
    }).catch(() => {});

    addToast('success', `Items Added & Sent to Kitchen`, `${itemsToAdd.length} item(s) added to Table #${targetTable.number} and sent to KDS.`);
  };

  // 6. Remove Order Item
  const handleRemoveOrderItem = async (tableId: string, orderId: string) => {
    const targetTable = tables.find((t) => t.id === tableId);
    if (!targetTable || !targetTable.currentSession) return;

    const remainingOrders = targetTable.currentSession.foodOrders.filter((o) => o.id !== orderId);
    const updatedSession = { ...targetTable.currentSession, foodOrders: remainingOrders };
    await startSession(tableId, updatedSession, user?.email);

    addToast('info', `Item Removed`, `Order item removed from bill.`);
  };

  // 7. Mark Paid & Clear Table in Firestore
  const handleMarkPaid = async (historyItem: SessionHistoryItem) => {
    await finalizeBill(historyItem, user?.email);

    // Automated Credit Ledger Sync when payment method is "Pay on Credit / Due Ledger"
    if (historyItem.paymentMethod === 'due_ledger' || historyItem.paymentStatus === 'due_ledger') {
      const existingCustomer = topCustomers.find(
        (c) => c.name.toLowerCase() === historyItem.customerName.toLowerCase() || 
               (historyItem.customerPhone && c.phone === historyItem.customerPhone)
      );

      const newTx = {
        id: `tx_${Date.now()}`,
        timestamp: Date.now(),
        type: 'due_added' as const,
        amount: historyItem.grandTotal,
        description: `Table Session — Receipt #${historyItem.receiptNo || historyItem.id.slice(-6).toUpperCase()}`,
        receiptNo: historyItem.receiptNo || historyItem.id.slice(-6).toUpperCase(),
        recordedBy: user?.displayName || user?.email || 'Staff'
      };

      if (existingCustomer) {
        const newDue = (existingCustomer.outstandingDue || 0) + historyItem.grandTotal;
        const creditLimit = existingCustomer.creditLimit || config.maxCreditLimit || 2000;
        const isOverLimit = newDue >= creditLimit;

        await saveCustomer({
          ...existingCustomer,
          outstandingDue: newDue,
          sessionsCount: (existingCustomer.sessionsCount || 0) + 1,
          totalHoursPlayed: (existingCustomer.totalHoursPlayed || 0) + Math.round((historyItem.durationSeconds / 3600) * 10) / 10,
          lastVisit: 'Today',
          udhaarLedger: [newTx, ...(existingCustomer.udhaarLedger || [])]
        });

        if (isOverLimit) {
          addToast('error', `⚠️ CREDIT LIMIT EXCEEDED`, `${historyItem.customerName} now owes ₹${newDue.toFixed(0)} — over their ₹${creditLimit} limit!`);
        } else {
          addToast('warning', 'Credit Due Invoiced', `₹${historyItem.grandTotal.toFixed(0)} added to ${historyItem.customerName}'s Credit Ledger. Total dues: ₹${newDue.toFixed(0)}`);
        }
      } else {
        // Auto-create new customer CRM record for first-time credit user
        await saveCustomer({
          id: `cust-${Date.now()}`,
          name: historyItem.customerName,
          phone: historyItem.customerPhone || 'N/A',
          sessionsCount: 1,
          totalSpent: 0,
          totalHoursPlayed: Math.round((historyItem.durationSeconds / 3600) * 10) / 10,
          dateJoined: new Date().toISOString().split('T')[0],
          membershipStatus: 'Regular',
          creditLimit: config.maxCreditLimit || 2000,
          lastVisit: 'Today',
          outstandingDue: historyItem.grandTotal,
          udhaarLedger: [newTx]
        });
        addToast('warning', 'New Credit Customer Created', `${historyItem.customerName} added to CRM. Dues: ₹${historyItem.grandTotal.toFixed(0)}`);
      }
    } else {
      // Standard paid — update customer's totalSpent in CRM if record exists
      const matchedCustomer = topCustomers.find(
        (c) => c.name.toLowerCase() === historyItem.customerName.toLowerCase() || 
               (historyItem.customerPhone && c.phone === historyItem.customerPhone)
      );
      if (matchedCustomer) {
        await saveCustomer({
          ...matchedCustomer,
          totalSpent: (matchedCustomer.totalSpent || 0) + historyItem.grandTotal,
          sessionsCount: (matchedCustomer.sessionsCount || 0) + 1,
          totalHoursPlayed: (matchedCustomer.totalHoursPlayed || 0) + Math.round((historyItem.durationSeconds / 3600) * 10) / 10,
          lastVisit: 'Today',
        }).catch(() => {}); // non-blocking
      }
      addToast('success', `Payment Settled!`, `Receipt #${historyItem.receiptNo} • ${config.currencySymbol}${historyItem.grandTotal.toFixed(2)}`);
    }
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
      isMember: false,
      startTime: Date.now(),
      hourlyRate: rate,
      isPaused: false,
      totalPausedSeconds: 0,
      foodOrders: [],
      rateType: 'standard',
    };

    await approveSessionRequest(reqId, tableId, newSession);
    addToast('success', 'QR Session Approved!', `Table #${targetTable?.number || tableId} active for ${custName}`);
  };

  const handleRejectRequest = async (reqId: string) => {
    await rejectSessionRequest(reqId);
    addToast('warning', 'Session Request Rejected', 'Customer request was declined.');
  };

  // Auth Protection: If user is not signed in, show professional LoginView
  if (!user && !isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] selection:bg-amber-500 selection:text-black">
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
        <LoginView onLoginSuccess={() => addToast('success', 'Welcome Back', 'Signed in to One Shot Snooker Club.')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-neutral-900 flex flex-col lg:flex-row antialiased font-sans">
      {/* Network Status Banner */}
      <OfflineBanner />

      {/* Toast Notifications Overlay */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Desktop Left Sidebar */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        occupiedCount={occupiedCount}
        totalTables={tables.length}
        clubs={saasClubs}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenSuperAdmin={() => setActivePage('super-admin')}
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
          onMarkNotificationRead={async (id) => markNotificationRead(id)}
          onClearAllNotifications={async () => clearAllNotifications()}
          onQuickStartSession={() => {
            setStartSessionTable(availableTables[0] || null);
            setIsStartSessionOpen(true);
          }}
        />

        {/* Pending Kitchen Food Orders Notification Banner */}
        {foodOrders.filter(o => o.status === 'new').length > 0 && (
          <div className="mx-4 sm:mx-6 mt-3 p-3.5 bg-emerald-50 border border-emerald-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <ChefHat className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-2">
                  <span>{foodOrders.filter(o => o.status === 'new').length} New Kitchen Order(s) Received</span>
                  <span className="animate-pulse w-2 h-2 rounded-full bg-emerald-500" />
                </h4>
                <p className="text-[11px] text-emerald-800">
                  New food or beverage orders queued for kitchen preparation.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActivePage('kds')}
                className="px-3 py-1.5 bg-emerald-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <ChefHat className="w-3.5 h-3.5" />
                Open Kitchen Display (KDS)
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Page Views */}
        <main className="flex-1">
          {activePage === 'dashboard' ? (
          <DashboardView
              tables={tables}
              revenueToday={revenueToday}
              pendingPaymentsTotal={pendingPaymentsTotal}
              currencySymbol={config.currencySymbol}
              sessionRequests={sessionRequests}
              notifications={notifications}
              onMarkNotificationRead={markNotificationRead}
              onApproveRequest={(req) => handleApproveRequest(req.id, req.tableId, req.customerName, req.customerPhone)}
              onRejectRequest={(reqId) => handleRejectRequest(reqId)}
              onSelectTable={(table) => setSelectedTableDetails(table)}
              onStartSession={(table) => {
                setStartSessionTable(table);
                setIsStartSessionOpen(true);
              }}
              onEndSession={handleEndSession}
              onPauseResumeSession={handlePauseResumeSession}
              onAddSnack={(table) => {
                setAddSnackTargetTable(table);
                setIsAddSnackOpen(true);
              }}
              onQuickStartAnySession={() => {
                setStartSessionTable(availableTables[0] || null);
                setIsStartSessionOpen(true);
              }}
            />
          ) : activePage === 'tables' ? (
            <TablesManagerView
              tables={tables}
              currencySymbol={config.currencySymbol}
              onSelectTable={(table) => setSelectedTableDetails(table)}
              onStartSession={(table) => {
                setStartSessionTable(table);
                setIsStartSessionOpen(true);
              }}
              onEndSession={handleEndSession}
              onPauseResumeSession={handlePauseResumeSession}
              onAddSnack={(table) => {
                setAddSnackTargetTable(table);
                setIsAddSnackOpen(true);
              }}
              onQuickStartAnySession={() => {
                setStartSessionTable(availableTables[0] || null);
                setIsStartSessionOpen(true);
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
          ) : activePage === 'kds' ? (
            <KitchenDisplayView
              foodOrders={foodOrders}
              onUpdateOrderStatus={async (orderId, status) => {
                await updateOrderStatus(orderId, status, user?.email || 'staff');
                addToast('success', 'Order Updated', `Order status changed to ${status.toUpperCase()}`);
              }}
            />
          ) : activePage === 'customers' ? (
            <CustomerCRMView
              customers={topCustomers}
              config={config}
              onSaveCustomer={async (cust) => {
                await saveCustomer(cust);
                addToast('success', 'Customer Profile Saved', `${cust.name} updated in CRM.`);
              }}
              onDeleteCustomer={async (id) => {
                await deleteCustomer(id);
                addToast('info', 'Customer Deleted', 'Record removed from CRM.');
              }}
            />
          ) : activePage === 'employees' ? (
            <RoleGuard requiredPage="employees" onNavigateHome={() => setActivePage('dashboard')}>
              <EmployeeManagementView
                employees={employees}
                attendance={attendance}
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
                onCheckIn={async (empId, empName, role, notes) => {
                  await checkInEmployee(empId, empName, role, notes);
                  addToast('success', 'Shift Check-In Recorded', `${empName} on active duty.`);
                }}
                onCheckOut={async (attendanceId) => {
                  await checkOutEmployee(attendanceId);
                  addToast('info', 'Shift Clocked Out', 'Working hours logged.');
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
                onUpdateConfig={(newConf) => {
                  updateConfig(newConf, user?.email);
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
                onResetClub={async (type) => {
                  await resetClubData(type);
                  addToast(
                    'success',
                    'Club Reset Completed',
                    type === 'history'
                      ? 'Sales and session history wiped clean.'
                      : 'Full club data reset: sessions cleared, tables ready, dues set to ₹0.'
                  );
                }}
              />
            </RoleGuard>
          ) : activePage === 'super-admin' ? (
            <RoleGuard requiredPage="super-admin" onNavigateHome={() => setActivePage('dashboard')}>
              <SuperAdminView
                clubs={saasClubs}
                currentClubId={currentClubId || ''}
                onSwitchWorkspace={(clubId) => switchClub(clubId)}
                onOpenOnboarding={() => setIsOnboardingOpen(true)}
                onUpdateClubPlan={updateSaaSClubPlan}
                onExtendTrial={extendSaaSClubTrial}
                onUpdateFeatureFlags={updateSaaSClubFeatureFlags}
                onSuspendClub={suspendSaaSClubWorkspace}
                onDeleteClub={deleteSaaSClubWorkspace}
              />
            </RoleGuard>
          ) : (
            <DashboardView
              tables={tables}
              revenueToday={revenueToday}
              pendingPaymentsTotal={pendingPaymentsTotal}
              currencySymbol={config.currencySymbol}
              sessionRequests={sessionRequests}
              onApproveRequest={(req) => handleApproveRequest(req.id, req.tableId, req.customerName, req.customerPhone)}
              onRejectRequest={(reqId) => handleRejectRequest(reqId)}
              onSelectTable={(table) => setSelectedTableDetails(table)}
              onStartSession={(table) => {
                setStartSessionTable(table);
                setIsStartSessionOpen(true);
              }}
              onEndSession={handleEndSession}
              onPauseResumeSession={handlePauseResumeSession}
              onAddSnack={(table) => {
                setAddSnackTargetTable(table);
                setIsAddSnackOpen(true);
              }}
              onQuickStartAnySession={() => {
                setStartSessionTable(availableTables[0] || null);
                setIsStartSessionOpen(true);
              }}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav
          activePage={activePage}
          setActivePage={setActivePage}
          occupiedCount={occupiedCount}
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
        onStartSession={(t) => {
          setSelectedTableDetails(null);
          setStartSessionTable(t);
          setIsStartSessionOpen(true);
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
        onRemoveOrderItem={handleRemoveOrderItem}
      />

      {/* Start Session Modal */}
      <StartSessionModal
        isOpen={isStartSessionOpen}
        onClose={() => setIsStartSessionOpen(false)}
        table={startSessionTable}
        availableTables={availableTables}
        currencySymbol={config.currencySymbol}
        onConfirmStart={handleConfirmStartSession}
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

export default function App() {
  return (
    <AuthProvider>
      <CueDeskApp />
    </AuthProvider>
  );
}
