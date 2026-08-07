import React, { useState } from 'react';
import { 
  Utensils, 
  Package, 
  ShoppingBag, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  Truck, 
  XCircle, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  FileText, 
  Layers, 
  ArrowUpRight, 
  RefreshCw,
  Image as ImageIcon,
  ChevronDown,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { 
  MenuItem, 
  FoodOrder, 
  PurchaseRecord, 
  InventoryAdjustment, 
  FoodCategory, 
  FoodOrderStatus, 
  TableItem, 
  BusinessConfig 
} from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

interface FoodInventoryViewProps {
  config: BusinessConfig;
  menuItems: MenuItem[];
  foodOrders: FoodOrder[];
  purchaseRecords: PurchaseRecord[];
  inventoryAdjustments: InventoryAdjustment[];
  tables: TableItem[];
  onSaveMenuItem: (item: MenuItem) => Promise<void>;
  onDeleteMenuItem: (itemId: string) => Promise<void>;
  onCreateFoodOrder: (order: Omit<FoodOrder, 'id'>) => Promise<string>;
  onUpdateOrderStatus: (order: FoodOrder, status: FoodOrderStatus) => Promise<void>;
  onRecordStockAdjustment: (
    menuId: string,
    menuName: string,
    type: InventoryAdjustment['adjustmentType'],
    quantityChange: number,
    newStock: number,
    reason?: string
  ) => Promise<void>;
  onRecordPurchase: (purchase: Omit<PurchaseRecord, 'id' | 'timestamp'>) => Promise<void>;
}

export const CATEGORIES: { id: FoodCategory; label: string; icon: string }[] = [
  { id: 'cold_drinks', label: 'Cold Drinks', icon: '🥤' },
  { id: 'tea_coffee', label: 'Tea & Coffee', icon: '☕' },
  { id: 'snacks', label: 'Snacks', icon: '🍟' },
  { id: 'instant_food', label: 'Instant Food', icon: '🍜' },
  { id: 'desserts', label: 'Desserts', icon: '🍰' },
  { id: 'other', label: 'Other Items', icon: '🍱' },
  { id: 'accessories', label: 'Accessories', icon: '🎱' },
];

export const FoodInventoryView: React.FC<FoodInventoryViewProps> = ({
  config,
  menuItems,
  foodOrders,
  purchaseRecords,
  inventoryAdjustments,
  tables,
  onSaveMenuItem,
  onDeleteMenuItem,
  onCreateFoodOrder,
  onUpdateOrderStatus,
  onRecordStockAdjustment,
  onRecordPurchase,
}) => {
  const { role, user, hasPermission } = useAuth();
  const isManagerOrOwner = hasPermission('manager');

  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'inventory' | 'reports'>('orders');

  // Menu Search & Filter
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'out_of_stock'>('all');

  // Modal States
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({
    supplierName: '',
    menuId: '',
    quantity: 10,
    purchasePrice: 0,
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [showStockModal, setShowStockModal] = useState(false);
  const [stockItem, setStockItem] = useState<MenuItem | null>(null);
  const [stockAdjustmentType, setStockAdjustmentType] = useState<InventoryAdjustment['adjustmentType']>('add');
  const [stockValueInput, setStockValueInput] = useState<number>(10);
  const [stockReason, setStockReason] = useState<string>('');

  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [newOrderTableId, setNewOrderTableId] = useState<string>(tables[0]?.id || '');
  const [newOrderCart, setNewOrderCart] = useState<Record<string, number>>({});

  // Status Filter for Orders
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  // Category Helper Label
  const getCategoryLabel = (cat: string) => {
    const found = CATEGORIES.find((c) => c.id === cat);
    return found ? `${found.icon} ${found.label}` : cat;
  };

  // Low stock items count
  const lowStockItems = menuItems.filter((i) => (i.stockQuantity || 0) <= (i.lowStockThreshold || 5));

  // --- MENU HANDLERS ---
  const handleOpenNewItem = () => {
    setEditingItem({
      name: '',
      category: 'cold_drinks',
      price: 5.0,
      costPrice: 2.5,
      stockQuantity: 20,
      lowStockThreshold: 5,
      available: true,
      displayOrder: menuItems.length + 1,
      description: '',
      image: '',
    });
    setShowItemModal(true);
  };

  const handleEditItemClick = (item: MenuItem) => {
    setEditingItem({ ...item });
    setShowItemModal(true);
  };

  const handleSaveItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name) return;

    const itemToSave: MenuItem = {
      id: editingItem.id || `item-${Date.now()}`,
      name: editingItem.name,
      category: editingItem.category || 'cold_drinks',
      price: Number(editingItem.price) || 0,
      costPrice: Number(editingItem.costPrice) || 0,
      stockQuantity: Number(editingItem.stockQuantity) || 0,
      lowStockThreshold: Number(editingItem.lowStockThreshold) || 5,
      available: editingItem.available ?? true,
      displayOrder: Number(editingItem.displayOrder) || 1,
      description: editingItem.description || '',
      image: editingItem.image || '',
    };

    await onSaveMenuItem(itemToSave);
    setShowItemModal(false);
    setEditingItem(null);
  };

  // --- STOCK ADJUSTMENT SUBMIT ---
  const handleStockAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockItem) return;

    let newStock = stockItem.stockQuantity || 0;
    if (stockAdjustmentType === 'add') {
      newStock += Number(stockValueInput);
    } else if (stockAdjustmentType === 'reduce') {
      newStock = Math.max(0, newStock - Number(stockValueInput));
    } else if (stockAdjustmentType === 'correct') {
      newStock = Number(stockValueInput);
    } else if (stockAdjustmentType === 'out_of_stock') {
      newStock = 0;
    }

    await onRecordStockAdjustment(
      stockItem.id,
      stockItem.name,
      stockAdjustmentType,
      Number(stockValueInput),
      newStock,
      stockReason
    );

    setShowStockModal(false);
    setStockItem(null);
  };

  // --- PURCHASE SUBMIT ---
  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const item = menuItems.find((m) => m.id === purchaseForm.menuId);
    if (!item) return;

    await onRecordPurchase({
      supplierName: purchaseForm.supplierName || 'General Supplier',
      menuId: item.id,
      menuName: item.name,
      quantity: Number(purchaseForm.quantity),
      purchasePrice: Number(purchaseForm.purchasePrice),
      date: purchaseForm.date,
      notes: purchaseForm.notes,
      recordedBy: user?.displayName || 'Owner',
    });

    setShowPurchaseModal(false);
    setPurchaseForm({
      supplierName: '',
      menuId: '',
      quantity: 10,
      purchasePrice: 0,
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  // --- MANUAL NEW ORDER BY STAFF ---
  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const table = tables.find((t) => t.id === newOrderTableId);
    if (!table) return;

    const items = Object.entries(newOrderCart)
      .map(([menuId, qtyVal]) => {
        const qtyNum = Number(qtyVal);
        const menuObj = menuItems.find((m) => m.id === menuId);
        if (!menuObj || qtyNum <= 0) return null;
        return {
          id: `ord-item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          menuId: menuObj.id,
          name: menuObj.name,
          price: menuObj.price,
          quantity: qtyNum,
          category: menuObj.category,
          addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      })
      .filter(Boolean) as any[];

    if (items.length === 0) return;

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    await onCreateFoodOrder({
      clubId: config.clubId || 'club-royal-cue',
      tableId: table.id,
      tableName: table.name,
      customerName: table.currentSession?.customerName || 'Walk-in Customer',
      items,
      orderTime: Date.now(),
      status: 'new',
      totalAmount,
    });

    setShowNewOrderModal(false);
    setNewOrderCart({});
  };

  // Filtered Menu Items
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(menuSearch.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesAvail = availabilityFilter === 'all' || 
                         (availabilityFilter === 'available' && item.available && item.stockQuantity > 0) ||
                         (availabilityFilter === 'out_of_stock' && (!item.available || item.stockQuantity <= 0));
    return matchesSearch && matchesCategory && matchesAvail;
  });

  // Filtered Live Orders
  const filteredOrders = foodOrders.filter((o) => {
    if (orderStatusFilter === 'all') return true;
    return o.status === orderStatusFilter;
  });

  // Inventory Report Totals
  const totalStockValueCost = menuItems.reduce((acc, item) => acc + (item.stockQuantity || 0) * (item.costPrice || 0), 0);
  const totalStockValueRetail = menuItems.reduce((acc, item) => acc + (item.stockQuantity || 0) * (item.price || 0), 0);

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-[#F8F9FA] min-h-screen">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
            <Utensils className="w-4 h-4 text-emerald-600" /> Phase 6 Module
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Food, Beverage & Inventory Management
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Manage menu items, live customer orders, stock levels, purchases, and low-stock alerts in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            leftIcon={<ShoppingBag className="w-4 h-4 text-emerald-600" />}
            onClick={() => setShowNewOrderModal(true)}
          >
            Place New Order
          </Button>

          {isManagerOrOwner && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleOpenNewItem}
            >
              Add Menu Item
            </Button>
          )}
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockItems.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950">
                Low Stock Alert ({lowStockItems.length} {lowStockItems.length === 1 ? 'item' : 'items'})
              </h4>
              <p className="text-xs text-amber-800">
                {lowStockItems.map((i) => `${i.name} (${i.stockQuantity} remaining)`).join(', ')}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-amber-300 text-amber-900 hover:bg-amber-100/60 shrink-0"
            onClick={() => setActiveTab('inventory')}
          >
            Manage Inventory Stock
          </Button>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-white border border-neutral-200/90 mb-6 shadow-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'orders'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Live Customer Orders</span>
          {foodOrders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-500 text-white">
              {foodOrders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length} Active
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'menu'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Menu Catalog ({menuItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'inventory'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Stock & Purchases</span>
          {lowStockItems.length > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-500 text-white">
              {lowStockItems.length} Low
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'reports'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Food & Stock Analytics</span>
        </button>
      </div>

      {/* TAB 1: LIVE ORDERS PANEL */}
      {activeTab === 'orders' && (
        <div className="flex flex-col gap-6">
          {/* Order Filters */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {['all', 'new', 'preparing', 'ready', 'delivered', 'cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setOrderStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                    orderStatusFilter === status
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="text-xs text-neutral-500 font-medium">
              Showing {filteredOrders.length} order(s)
            </div>
          </div>

          {/* Orders Grid */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-neutral-200/90 p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mb-3">
                <ChefHat className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-neutral-800">No Orders Found</h3>
              <p className="text-xs text-neutral-500 max-w-sm mt-1">
                There are no active orders matching the selected filter. When customers order via QR code or cashier places an order, it will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((order) => {
                const statusColors: Record<FoodOrderStatus, { bg: string; text: string; border: string; icon: any }> = {
                  new: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Sparkles },
                  preparing: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', icon: ChefHat },
                  ready: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', icon: CheckCircle2 },
                  delivered: { bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-neutral-200', icon: Truck },
                  cancelled: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: XCircle },
                };

                const style = statusColors[order.status] || statusColors.new;
                const StatusIcon = style.icon;

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl border border-neutral-200/90 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      {/* Top Order Card Bar */}
                      <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-3">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase text-neutral-400 tracking-wider">
                            Table #{order.tableName}
                          </span>
                          <h4 className="text-sm font-extrabold text-neutral-900 truncate">
                            {order.customerName}
                          </h4>
                        </div>

                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${style.bg} ${style.text} ${style.border}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {order.status}
                        </span>
                      </div>

                      {/* Items Ordered */}
                      <div className="space-y-2 mb-4">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2 font-medium text-neutral-800">
                              <span className="w-5 h-5 rounded-md bg-neutral-100 text-neutral-900 font-mono font-bold flex items-center justify-center text-[10px]">
                                {item.quantity}x
                              </span>
                              <span>{item.name}</span>
                            </div>
                            <span className="font-mono text-neutral-600">
                              {formatCurrency(item.price * item.quantity, config.currencySymbol)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Order Info & Status Actions */}
                    <div className="border-t border-neutral-100 pt-3 flex flex-col gap-3">
                      <div className="flex justify-between items-center text-xs font-bold text-neutral-900">
                        <span className="text-neutral-500 font-normal">Order Total:</span>
                        <span className="text-sm font-mono">{formatCurrency(order.totalAmount, config.currencySymbol)}</span>
                      </div>

                      {/* Realtime Status Update Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {order.status === 'new' && (
                          <>
                            <Button
                              variant="outline"
                              size="xs"
                              className="w-full justify-center text-amber-800 border-amber-300 hover:bg-amber-50"
                              onClick={() => onUpdateOrderStatus(order, 'preparing')}
                            >
                              Set Preparing
                            </Button>
                            <Button
                              variant="primary"
                              size="xs"
                              className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 border-none text-white"
                              onClick={() => onUpdateOrderStatus(order, 'delivered')}
                            >
                              Mark Delivered
                            </Button>
                          </>
                        )}

                        {order.status === 'preparing' && (
                          <>
                            <Button
                              variant="outline"
                              size="xs"
                              className="w-full justify-center text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                              onClick={() => onUpdateOrderStatus(order, 'ready')}
                            >
                              Mark Ready
                            </Button>
                            <Button
                              variant="primary"
                              size="xs"
                              className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 border-none text-white"
                              onClick={() => onUpdateOrderStatus(order, 'delivered')}
                            >
                              Deliver to Table
                            </Button>
                          </>
                        )}

                        {order.status === 'ready' && (
                          <Button
                            variant="primary"
                            size="xs"
                            className="col-span-2 w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => onUpdateOrderStatus(order, 'delivered')}
                          >
                            Complete & Deliver to Bill
                          </Button>
                        )}

                        {(order.status === 'delivered' || order.status === 'cancelled') && (
                          <div className="col-span-2 text-center text-[11px] font-semibold text-neutral-400 py-1">
                            {order.status === 'delivered' ? 'Added to Table Bill & Stock Reduced' : 'Order Cancelled'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MENU MANAGEMENT CATALOG */}
      {activeTab === 'menu' && (
        <div className="flex flex-col gap-6">
          {/* Menu Search & Category Filter Controls */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 p-4 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-center">
            <div className="w-full md:w-80">
              <Input
                placeholder="Search menu items..."
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto py-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    selectedCategory === 'all'
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  All Categories
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                      selectedCategory === cat.id
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>

              {/* Availability Filter */}
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value as any)}
                className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 outline-none cursor-pointer"
              >
                <option value="all">All Availability</option>
                <option value="available">In Stock & Available</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMenuItems.map((item) => {
              const isLowStock = item.stockQuantity <= (item.lowStockThreshold || 5);
              const isOutOfStock = !item.available || item.stockQuantity <= 0;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-3xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                    isOutOfStock
                      ? 'border-neutral-200/80 bg-neutral-50/50 opacity-80'
                      : isLowStock
                      ? 'border-amber-300 bg-white'
                      : 'border-neutral-200/90 hover:border-neutral-300'
                  }`}
                >
                  <div>
                    {/* Item Category Header */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
                        {getCategoryLabel(item.category)}
                      </span>

                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          isOutOfStock
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : isLowStock
                            ? 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {isOutOfStock ? 'Out of Stock' : isLowStock ? `Low Stock (${item.stockQuantity})` : `In Stock (${item.stockQuantity})`}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-neutral-900 leading-snug">
                      {item.name}
                    </h3>
                    <p className="text-xs text-neutral-500 line-clamp-2 mt-1 mb-3">
                      {item.description || 'No description provided.'}
                    </p>

                    {/* Price & Cost */}
                    <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-between text-xs mb-3">
                      <div>
                        <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Selling Price</span>
                        <span className="text-base font-extrabold font-mono text-neutral-900">
                          {formatCurrency(item.price, config.currencySymbol)}
                        </span>
                      </div>

                      {isManagerOrOwner && item.costPrice !== undefined && (
                        <div className="text-right">
                          <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Cost Price</span>
                          <span className="text-xs font-mono font-bold text-neutral-600">
                            {formatCurrency(item.costPrice, config.currencySymbol)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions for Manager/Owner */}
                  <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                    <Button
                      variant="outline"
                      size="xs"
                      className="flex-1 justify-center"
                      onClick={() => {
                        setStockItem(item);
                        setStockValueInput(10);
                        setShowStockModal(true);
                      }}
                    >
                      Update Stock
                    </Button>

                    {isManagerOrOwner && (
                      <>
                        <button
                          onClick={() => handleEditItemClick(item)}
                          className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
                          title="Edit Menu Item"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteMenuItem(item.id)}
                          className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Delete Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: INVENTORY STOCK & PURCHASES */}
      {activeTab === 'inventory' && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-neutral-200/90 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-neutral-900">Inventory Stock & Supplier Purchases</h3>
              <p className="text-xs text-neutral-500">
                Track exact physical stock, record bulk purchases from suppliers, and view automatic deduction logs.
              </p>
            </div>

            {isManagerOrOwner && (
              <Button
                variant="primary"
                size="md"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setShowPurchaseModal(true)}
              >
                Record Supplier Purchase
              </Button>
            )}
          </div>

          {/* Stock Table */}
          <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-neutral-100 font-bold text-sm text-neutral-900 flex justify-between items-center">
              <span>Current Item Stock Master</span>
              <span className="text-xs text-neutral-500 font-normal">{menuItems.length} Total Items</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Item Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Selling Price</th>
                    <th className="px-4 py-3">Cost Price</th>
                    <th className="px-4 py-3">Current Stock</th>
                    <th className="px-4 py-3">Threshold</th>
                    <th className="px-4 py-3">Stock Value (Cost)</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {menuItems.map((item) => {
                    const isLow = item.stockQuantity <= (item.lowStockThreshold || 5);
                    return (
                      <tr key={item.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-neutral-900">{item.name}</td>
                        <td className="px-4 py-3.5 text-neutral-600">{getCategoryLabel(item.category)}</td>
                        <td className="px-4 py-3.5 font-mono font-semibold">{formatCurrency(item.price, config.currencySymbol)}</td>
                        <td className="px-4 py-3.5 font-mono text-neutral-500">{formatCurrency(item.costPrice || 0, config.currencySymbol)}</td>
                        <td className="px-4 py-3.5 font-bold font-mono">
                          <span className={`px-2.5 py-1 rounded-full text-xs ${
                            isLow ? 'bg-amber-100 text-amber-900 font-bold' : 'bg-neutral-100 text-neutral-800'
                          }`}>
                            {item.stockQuantity} units
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-neutral-400 font-mono">{item.lowStockThreshold || 5}</td>
                        <td className="px-4 py-3.5 font-mono font-bold text-neutral-900">
                          {formatCurrency((item.stockQuantity || 0) * (item.costPrice || 0), config.currencySymbol)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => {
                              setStockItem(item);
                              setStockValueInput(10);
                              setShowStockModal(true);
                            }}
                          >
                            Adjust Stock
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Supplier Purchase History */}
          <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-xs p-5">
            <h4 className="text-sm font-extrabold text-neutral-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" /> Recent Supplier Purchases
            </h4>

            {purchaseRecords.length === 0 ? (
              <p className="text-xs text-neutral-400 italic">No supplier purchases recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {purchaseRecords.slice(0, 10).map((rec) => (
                  <div key={rec.id} className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/60 flex justify-between items-center text-xs">
                    <div>
                      <strong className="text-neutral-900">{rec.menuName}</strong>
                      <span className="text-neutral-500 ml-2">from {rec.supplierName}</span>
                      <span className="text-[10px] text-neutral-400 block">{rec.date} • Recorded by {rec.recordedBy}</span>
                    </div>

                    <div className="text-right font-mono">
                      <span className="font-bold text-emerald-700 block">+{rec.quantity} units</span>
                      <span className="text-neutral-600 font-bold">{formatCurrency(rec.purchasePrice, config.currencySymbol)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: FOOD SALES & INVENTORY REPORTS */}
      {activeTab === 'reports' && (
        <div className="flex flex-col gap-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-neutral-200/90 shadow-xs">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">Total Stock Cost Value</span>
              <h3 className="text-2xl font-extrabold text-neutral-900 font-mono mt-1">
                {formatCurrency(totalStockValueCost, config.currencySymbol)}
              </h3>
              <span className="text-[10px] text-neutral-500 mt-1 block">Value based on purchase cost</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-neutral-200/90 shadow-xs">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">Potential Retail Value</span>
              <h3 className="text-2xl font-extrabold text-emerald-700 font-mono mt-1">
                {formatCurrency(totalStockValueRetail, config.currencySymbol)}
              </h3>
              <span className="text-[10px] text-neutral-500 mt-1 block">Value at current menu selling prices</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-neutral-200/90 shadow-xs">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">Total Menu Items</span>
              <h3 className="text-2xl font-extrabold text-neutral-900 mt-1">{menuItems.length}</h3>
              <span className="text-[10px] text-neutral-500 mt-1 block">Active food & beverage items</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-neutral-200/90 shadow-xs">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">Low Stock Alerts</span>
              <h3 className={`text-2xl font-extrabold mt-1 ${lowStockItems.length > 0 ? 'text-amber-600' : 'text-neutral-900'}`}>
                {lowStockItems.length}
              </h3>
              <span className="text-[10px] text-neutral-500 mt-1 block">Items below threshold</span>
            </div>
          </div>

          {/* Best Sellers & Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-neutral-200/90 p-5 shadow-xs">
              <h4 className="text-base font-extrabold text-neutral-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" /> Best Selling Food & Drinks
              </h4>
              <div className="space-y-3">
                {menuItems.slice(0, 5).map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 border border-neutral-100 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-neutral-900 text-white font-mono font-bold text-[11px] flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <div>
                        <strong className="text-neutral-900 block">{item.name}</strong>
                        <span className="text-[10px] text-neutral-400">{getCategoryLabel(item.category)}</span>
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold text-neutral-800">
                      {formatCurrency(item.price, config.currencySymbol)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-neutral-200/90 p-5 shadow-xs">
              <h4 className="text-base font-extrabold text-neutral-900 mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" /> Category Stock Breakdown
              </h4>
              <div className="space-y-3">
                {CATEGORIES.map((cat) => {
                  const catItems = menuItems.filter((m) => m.category === cat.id);
                  const totalCatStock = catItems.reduce((acc, i) => acc + (i.stockQuantity || 0), 0);
                  return (
                    <div key={cat.id} className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 border border-neutral-100 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{cat.icon}</span>
                        <strong className="text-neutral-800">{cat.label}</strong>
                      </div>
                      <span className="font-mono font-bold text-neutral-900 bg-white px-2.5 py-1 rounded-lg border border-neutral-200">
                        {totalCatStock} units ({catItems.length} items)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT MENU ITEM */}
      {showItemModal && editingItem && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 my-8">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-neutral-100">
              <h3 className="text-lg font-extrabold text-neutral-900">
                {editingItem.id ? 'Edit Menu Item' : 'Create New Menu Item'}
              </h3>
              <button
                onClick={() => setShowItemModal(false)}
                className="text-neutral-400 hover:text-neutral-800 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItemSubmit} className="space-y-4">
              <Input
                label="Item Name"
                placeholder="e.g. Chilled Energy Drink"
                value={editingItem.name || ''}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Category</label>
                  <select
                    value={editingItem.category || 'cold_drinks'}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label={`Selling Price (${config.currencySymbol})`}
                  type="number"
                  step="0.01"
                  value={editingItem.price ?? ''}
                  onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={`Cost Price (${config.currencySymbol})`}
                  type="number"
                  step="0.01"
                  placeholder="Optional cost"
                  value={editingItem.costPrice ?? ''}
                  onChange={(e) => setEditingItem({ ...editingItem, costPrice: parseFloat(e.target.value) })}
                />

                <Input
                  label="Initial Stock Quantity"
                  type="number"
                  value={editingItem.stockQuantity ?? 20}
                  onChange={(e) => setEditingItem({ ...editingItem, stockQuantity: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Low Stock Threshold"
                  type="number"
                  value={editingItem.lowStockThreshold ?? 5}
                  onChange={(e) => setEditingItem({ ...editingItem, lowStockThreshold: parseInt(e.target.value) || 5 })}
                />

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Availability</label>
                  <select
                    value={editingItem.available ? 'yes' : 'no'}
                    onChange={(e) => setEditingItem({ ...editingItem, available: e.target.value === 'yes' })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 outline-none"
                  >
                    <option value="yes">Available for Sale</option>
                    <option value="no">Unavailable / Hidden</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Description</label>
                <textarea
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Short description of ingredients or size..."
                  rows={2}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs text-neutral-900 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <Button type="button" variant="outline" size="md" onClick={() => setShowItemModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md">
                  Save Item
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: STOCK ADJUSTMENT */}
      {showStockModal && stockItem && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200">
            <h3 className="text-base font-extrabold text-neutral-900 mb-1">
              Adjust Stock: {stockItem.name}
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Current Stock: <strong className="font-mono text-neutral-900">{stockItem.stockQuantity} units</strong>
            </p>

            <form onSubmit={handleStockAdjustmentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Adjustment Action</label>
                <select
                  value={stockAdjustmentType}
                  onChange={(e) => setStockAdjustmentType(e.target.value as any)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 outline-none"
                >
                  <option value="add">Add Stock (+)</option>
                  <option value="reduce">Reduce Stock / Wastage (-)</option>
                  <option value="correct">Set Exact Stock (=)</option>
                  <option value="out_of_stock">Mark Out of Stock (0)</option>
                </select>
              </div>

              {stockAdjustmentType !== 'out_of_stock' && (
                <Input
                  label="Quantity Value"
                  type="number"
                  value={stockValueInput}
                  onChange={(e) => setStockValueInput(parseInt(e.target.value) || 0)}
                  required
                />
              )}

              <Input
                label="Reason / Notes (Optional)"
                placeholder="e.g. Shipment received, damaged goods..."
                value={stockReason}
                onChange={(e) => setStockReason(e.target.value)}
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <Button type="button" variant="outline" size="md" onClick={() => setShowStockModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md">
                  Confirm Adjustment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RECORD SUPPLIER PURCHASE */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200">
            <h3 className="text-base font-extrabold text-neutral-900 mb-3">
              Record Supplier Purchase
            </h3>

            <form onSubmit={handlePurchaseSubmit} className="space-y-4">
              <Input
                label="Supplier Name"
                placeholder="e.g. Metro Wholesale Foods"
                value={purchaseForm.supplierName}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, supplierName: e.target.value })}
                required
              />

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Select Menu Item</label>
                <select
                  value={purchaseForm.menuId}
                  onChange={(e) => {
                    const selected = menuItems.find((m) => m.id === e.target.value);
                    setPurchaseForm({
                      ...purchaseForm,
                      menuId: e.target.value,
                      purchasePrice: selected ? (selected.costPrice || selected.price * 0.5) * 10 : 0,
                    });
                  }}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 outline-none"
                  required
                >
                  <option value="">-- Choose Item --</option>
                  {menuItems.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Current: {m.stockQuantity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Purchase Quantity"
                  type="number"
                  value={purchaseForm.quantity}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: parseInt(e.target.value) || 0 })}
                  required
                />

                <Input
                  label={`Total Cost (${config.currencySymbol})`}
                  type="number"
                  step="0.01"
                  value={purchaseForm.purchasePrice}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, purchasePrice: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <Input
                label="Purchase Date"
                type="date"
                value={purchaseForm.date}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, date: e.target.value })}
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <Button type="button" variant="outline" size="md" onClick={() => setShowPurchaseModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md">
                  Record & Add Stock
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: PLACE NEW ORDER BY CASHIER */}
      {showNewOrderModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-extrabold text-neutral-900 mb-1">
              Place Table Order (Staff Console)
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Select an occupied table and pick food/beverage items to send directly to kitchen & bill.
            </p>

            <form onSubmit={handleCreateOrderSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Target Table</label>
                <select
                  value={newOrderTableId}
                  onChange={(e) => setNewOrderTableId(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 outline-none"
                >
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      Table #{t.number} ({t.currentSession ? t.currentSession.customerName : 'Available'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-neutral-700">Select Items & Quantities</label>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {menuItems.filter((m) => m.available && m.stockQuantity > 0).map((m) => {
                    const qty = newOrderCart[m.id] || 0;
                    return (
                      <div key={m.id} className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-neutral-900 block">{m.name}</strong>
                          <span className="text-neutral-500 font-mono">{formatCurrency(m.price, config.currencySymbol)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setNewOrderCart({ ...newOrderCart, [m.id]: Math.max(0, qty - 1) })}
                            className="w-7 h-7 rounded-lg bg-white border border-neutral-200 font-bold hover:bg-neutral-100"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-bold font-mono text-sm">{qty}</span>
                          <button
                            type="button"
                            onClick={() => setNewOrderCart({ ...newOrderCart, [m.id]: qty + 1 })}
                            className="w-7 h-7 rounded-lg bg-neutral-900 text-white font-bold hover:bg-neutral-800"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <Button type="button" variant="outline" size="md" onClick={() => setShowNewOrderModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md">
                  Send Order
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
