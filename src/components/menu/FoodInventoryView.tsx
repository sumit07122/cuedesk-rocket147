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
  Sparkles,
  Download
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
import { exportInventoryToExcel } from '../../utils/excelExport';
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

  const [activeTab, setActiveTab] = useState<'menu' | 'inventory' | 'reports'>('menu');

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

  // Filtered Menu Items
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(menuSearch.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesAvail = availabilityFilter === 'all' || 
                         (availabilityFilter === 'available' && item.available && (item.stockQuantity ?? 0) > 0) ||
                         (availabilityFilter === 'out_of_stock' && (!item.available || (item.stockQuantity ?? 0) <= 0));
    return matchesSearch && matchesCategory && matchesAvail;
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
            <Utensils className="w-4 h-4 text-emerald-600" /> F&B & Inventory
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Food, Beverage & Inventory Management
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Manage café menu items, vendor purchases, stock adjustments, and inventory analysis in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            leftIcon={<Download className="w-4 h-4 text-neutral-600" />}
            onClick={() => exportInventoryToExcel(menuItems, config.clubName)}
          >
            Export Catalog
          </Button>

          {isManagerOrOwner && (
            <Button
              variant="outline"
              size="md"
              leftIcon={<Plus className="w-4 h-4 text-emerald-600" />}
              onClick={() => {
                setPurchaseForm({
                  supplierName: '',
                  menuId: menuItems[0]?.id || '',
                  quantity: 10,
                  purchasePrice: 0,
                  date: new Date().toISOString().split('T')[0],
                  notes: '',
                });
                setShowPurchaseModal(true);
              }}
            >
              Record Purchase
            </Button>
          )}

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



      {/* TAB 1: MENU MANAGEMENT CATALOG */}
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

    </div>
  );
};
