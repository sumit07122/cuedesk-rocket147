import React, { useState, useEffect } from 'react';
import { 
  CircleDot, 
  Clock, 
  Utensils, 
  CheckCircle2, 
  User, 
  Phone, 
  Play, 
  Square, 
  Sparkles,
  Plus,
  Minus,
  Users,
  Loader2,
  ArrowRight,
  ChevronLeft,
  Receipt,
  Trophy,
  Bell,
  Search,
  ShoppingCart,
  Flame,
  Coffee,
  IceCream,
  CupSoda
} from 'lucide-react';
import { BusinessConfig, TableItem, MenuItem, OrderItem, FoodOrder } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatCurrency, formatTimerString, calculateSessionSeconds, calculateBillTotals } from '../../utils/formatters';

interface CustomerQRViewProps {
  config: BusinessConfig;
  tables: TableItem[];
  menuItems: MenuItem[];
  foodOrders?: FoodOrder[];
  onCustomerCheckIn: (tableId: string, name: string, phone: string) => void;
  onCustomerAddSnack: (tableId: string, items: OrderItem[]) => void;
  onCustomerRequestCheckout: (tableId: string) => void;
  onCreateFoodOrder?: (order: Omit<FoodOrder, 'id'>) => Promise<string>;
  onCallCueBoy?: (tableId: string, tableName: string) => void;
}

type QRStep = 'welcome' | 'enter-details' | 'choose-players' | 'waiting' | 'checkout-requested';

export const CustomerQRView: React.FC<CustomerQRViewProps> = ({
  config,
  tables,
  menuItems,
  foodOrders = [],
  onCustomerCheckIn,
  onCustomerAddSnack,
  onCustomerRequestCheckout,
  onCreateFoodOrder,
  onCallCueBoy,
}) => {
  const [selectedTableId, setSelectedTableId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTableId = params.get('tableId');
      if (urlTableId && tables.some((t) => t.id === urlTableId)) {
        return urlTableId;
      }
    }
    return tables[0]?.id || '';
  });

  useEffect(() => {
    if (tables.length > 0 && (!selectedTableId || !tables.some((t) => t.id === selectedTableId))) {
      const urlTableId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tableId') : null;
      if (urlTableId && tables.some((t) => t.id === urlTableId)) {
        setSelectedTableId(urlTableId);
      } else if (tables[0]?.id) {
        setSelectedTableId(tables[0].id);
      }
    }
  }, [tables, selectedTableId]);

  const [step, setStep] = useState<QRStep>('welcome');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [playersCount, setPlayersCount] = useState<number>(2);
  const [showSnackMenu, setShowSnackMenu] = useState(false);
  const [snackCart, setSnackCart] = useState<Record<string, number>>({});
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [now, setNow] = useState(Date.now());
  const [orderSentMessage, setOrderSentMessage] = useState(false);
  const [assistanceCalled, setAssistanceCalled] = useState(false);

  // Live Scoreboard State for Players
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [p1Name, setP1Name] = useState('Player 1');
  const [p2Name, setP2Name] = useState('Player 2');
  const [p1Frames, setP1Frames] = useState(0);
  const [p2Frames, setP2Frames] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeTable = tables.find((t) => t.id === selectedTableId) || tables[0];
  const isOccupied = (activeTable?.status === 'occupied' || activeTable?.status === 'payment_pending') && activeTable?.currentSession;
  const session = activeTable?.currentSession;

  useEffect(() => {
    if (isOccupied && step === 'waiting') {
      setStep('welcome');
    }
  }, [isOccupied, step]);

  let seconds = 0;
  let totals = { grandTotal: 0, tableFee: 0, foodFee: 0, subtotal: 0, discountAmount: 0, taxableAmount: 0, taxAmount: 0 };
  if (isOccupied && session) {
    seconds = calculateSessionSeconds(session, now);
    totals = calculateBillTotals(session, config.taxRatePercent, config.enableTax, 0, now);
  }

  const handleRequestSession = () => {
    if (!name.trim() || !activeTable) return;
    setStep('waiting');
    onCustomerCheckIn(activeTable.id, name.trim(), phone.trim());
  };

  const handleQuantityChange = (menuId: string, delta: number) => {
    setSnackCart((prev) => {
      const current = prev[menuId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[menuId];
        return copy;
      }
      return { ...prev, [menuId]: next };
    });
  };

  const cartItemsCount = Object.values(snackCart).reduce((a: number, b: number) => a + b, 0);
  const cartTotalPrice = Object.entries(snackCart).reduce((sum, [mId, qty]) => {
    const item = menuItems.find((m) => m.id === mId);
    const numQty = Number(qty) || 0;
    return sum + (item ? item.price * numQty : 0);
  }, 0);

  const handleSendSnackOrder = async () => {
    if (!activeTable || !isOccupied) return;
    const newItems: OrderItem[] = [];
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    Object.entries(snackCart).forEach(([menuId, qtyVal]) => {
      const qty = qtyVal as number;
      const menuObj = menuItems.find((m) => m.id === menuId);
      if (menuObj && qty > 0) {
        newItems.push({
          id: `cust-ord-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          menuId: menuObj.id,
          name: menuObj.name,
          price: menuObj.price,
          quantity: qty,
          category: menuObj.category,
          addedAt: timestamp,
        });
      }
    });

    if (newItems.length > 0) {
      if (onCreateFoodOrder) {
        const totalAmount = newItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
        await onCreateFoodOrder({
          clubId: config.id || 'club-royal-cue',
          tableId: activeTable.id,
          tableName: activeTable.name,
          customerName: session?.customerName || 'QR Customer',
          items: newItems,
          orderTime: Date.now(),
          status: 'new',
          totalAmount,
        });
      } else {
        onCustomerAddSnack(activeTable.id, newItems);
      }

      setSnackCart({});
      setShowSnackMenu(false);
      setOrderSentMessage(true);
      setTimeout(() => setOrderSentMessage(false), 5000);
    }
  };

  const handleCallAssistance = () => {
    if (activeTable?.id && onCallCueBoy) {
      onCallCueBoy(activeTable.id, activeTable.name);
    }
    setAssistanceCalled(true);
    setTimeout(() => setAssistanceCalled(false), 4000);
  };

  const handleCheckoutClick = () => {
    if (activeTable?.id) {
      onCustomerRequestCheckout(activeTable.id);
    }
    setStep('checkout-requested');
  };

  const filteredMenuItems = menuItems.filter((item) => {
    const q = menuSearch.toLowerCase();
    const matchName = item.name.toLowerCase().includes(q);
    const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchName && matchCategory;
  });

  if (!activeTable) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl border border-neutral-200 p-8 flex flex-col items-center gap-4 shadow-sm">
          <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
          <h2 className="text-base font-bold text-neutral-900">Loading Table Details...</h2>
          <p className="text-xs text-neutral-500">Please wait while we connect to {config.clubName || 'CueDesk'}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center p-4 sm:p-6 pb-24">
      <div className="max-w-md w-full flex flex-col gap-5">
        
        {/* Top Branding Header */}
        <div className="bg-white rounded-3xl border border-neutral-200/90 p-5 shadow-sm text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center mb-2 shadow-sm">
            <CircleDot className="w-7 h-7" />
          </div>
          <h1 className="text-lg font-extrabold text-neutral-900 tracking-tight">{config.clubName || 'Rocket 147 Snooker Club'}</h1>
          <p className="text-xs text-neutral-500">{config.tagline || 'Official Table Self-Service & Snack Ordering'}</p>

          {/* Table Selector for QR Simulation */}
          <div className="mt-3.5 w-full pt-3.5 border-t border-neutral-100 flex items-center justify-between text-xs">
            <span className="text-neutral-500 font-medium">Scanned Table:</span>
            <select
              value={selectedTableId}
              onChange={(e) => {
                setSelectedTableId(e.target.value);
                setStep('welcome');
              }}
              className="bg-neutral-100 border border-neutral-200 font-bold text-neutral-900 rounded-xl px-3 py-1 outline-none"
            >
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  Table #{t.number?.toString().padStart(2, '0') || '00'} ({(t.status || 'available').toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {orderSentMessage && (
          <div className="bg-emerald-600 text-white text-xs font-semibold p-4 rounded-2xl flex items-center gap-2 shadow-md">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Order sent to kitchen! Items added to your running bill.</span>
          </div>
        )}

        {assistanceCalled && (
          <div className="bg-amber-500 text-white text-xs font-semibold p-4 rounded-2xl flex items-center gap-2 shadow-md">
            <Bell className="w-5 h-5 shrink-0 animate-bounce" />
            <span>Cue Boy Alerted! Staff member is heading to Table #{activeTable.number}.</span>
          </div>
        )}

        {/* ACTIVE SESSION VIEW */}
        {isOccupied && session && step !== 'checkout-requested' && (
          <div className="flex flex-col gap-4">
            
            {/* Live Session Timer Card */}
            <div className="bg-neutral-900 text-white rounded-3xl p-6 text-center flex flex-col items-center shadow-xl relative overflow-hidden">
              <span className="text-[11px] uppercase font-bold text-emerald-400 tracking-wider mb-1 flex items-center gap-1.5 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                Session Active • Table #{activeTable.number}
              </span>
              <div className="text-5xl font-extrabold font-mono tracking-tight text-emerald-400 my-2">
                {formatTimerString(seconds)}
              </div>
              <p className="text-xs text-neutral-300">
                Player: <strong className="text-white">{session.customerName}</strong>
              </p>
            </div>

            {/* Live Bill Summary Card */}
            <div className="bg-white rounded-3xl border border-neutral-200 p-5 flex flex-col gap-2.5 shadow-xs text-xs">
              <div className="flex justify-between text-neutral-500 pb-2 border-b border-neutral-100">
                <span>Hourly Rate</span>
                <span className="font-semibold text-neutral-900">
                  {formatCurrency(session.hourlyRate, config.currencySymbol)}/hr
                </span>
              </div>
              <div className="flex justify-between text-neutral-500 pb-2 border-b border-neutral-100">
                <span>Table Time Fee</span>
                <span className="font-mono font-semibold text-neutral-900">
                  {formatCurrency(totals.tableFee, config.currencySymbol)}
                </span>
              </div>
              {totals.foodFee > 0 && (
                <div className="flex justify-between text-neutral-500 pb-2 border-b border-neutral-100">
                  <span>Food & Snacks</span>
                  <span className="font-mono font-semibold text-neutral-900">
                    {formatCurrency(totals.foodFee, config.currencySymbol)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-sm font-bold text-neutral-900">Live Total</span>
                <span className="text-xl font-bold font-mono text-neutral-900">
                  {formatCurrency(totals.grandTotal, config.currencySymbol)}
                </span>
              </div>
            </div>

            {/* Live Kitchen Order Status Tracker */}
            {foodOrders.filter((o) => o.tableId === activeTable.id).length > 0 && (
              <div className="bg-white rounded-3xl border border-neutral-200 p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
                    <Utensils className="w-4 h-4 text-emerald-600" />
                    Kitchen Order Status ({foodOrders.filter((o) => o.tableId === activeTable.id).length})
                  </h4>
                  <span className="text-[10px] text-neutral-400 font-mono">Live KDS</span>
                </div>

                <div className="space-y-2.5">
                  {foodOrders.filter((o) => o.tableId === activeTable.id).slice(0, 3).map((ord) => (
                    <div key={ord.id} className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs space-y-2">
                      <div className="flex items-center justify-between font-bold text-neutral-900">
                        <span className="truncate max-w-[180px]">{ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-extrabold ${
                          ord.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'ready'
                            ? 'bg-blue-100 text-blue-800'
                            : ord.status === 'preparing'
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {ord.status === 'delivered' ? '✓ SERVED' : ord.status === 'ready' ? 'READY' : ord.status === 'preparing' ? 'COOKING' : 'NEW'}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-1 text-[9px] font-extrabold font-mono text-center">
                        <div className={`py-1 rounded-lg ${ord.status === 'new' ? 'bg-amber-500 text-white' : 'bg-neutral-200 text-neutral-600'}`}>1. SENT</div>
                        <div className={`py-1 rounded-lg ${ord.status === 'preparing' ? 'bg-amber-500 text-white' : ord.status === 'ready' || ord.status === 'delivered' ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-400'}`}>2. COOKING</div>
                        <div className={`py-1 rounded-lg ${ord.status === 'ready' ? 'bg-blue-600 text-white' : ord.status === 'delivered' ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-400'}`}>3. READY</div>
                        <div className={`py-1 rounded-lg ${ord.status === 'delivered' ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-400'}`}>4. SERVED</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                size="lg"
                className="w-full justify-center bg-neutral-900 text-white hover:bg-neutral-800"
                leftIcon={<Utensils className="w-4 h-4 text-emerald-400" />}
                onClick={() => setShowSnackMenu(true)}
              >
                Order Snacks & Drinks
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full justify-center border-amber-300 bg-amber-50/50 text-amber-900 hover:bg-amber-100"
                leftIcon={<Bell className="w-4 h-4 text-amber-600" />}
                onClick={handleCallAssistance}
              >
                Call Cue Boy
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center text-xs"
                leftIcon={<Trophy className="w-4 h-4 text-amber-500" />}
                onClick={() => setShowScoreboard(!showScoreboard)}
              >
                {showScoreboard ? 'Hide Match Tracker' : 'Match Scoreboard'}
              </Button>

              <Button
                variant="danger"
                size="sm"
                className="w-full justify-center text-xs"
                leftIcon={<Square className="w-3.5 h-3.5 fill-current" />}
                onClick={handleCheckoutClick}
              >
                Request Checkout
              </Button>
            </div>

            {/* Live Frame Scoreboard Widget */}
            {showScoreboard && (
              <div className="p-5 bg-white rounded-3xl border border-neutral-200 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <span className="text-xs font-extrabold uppercase text-neutral-800 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-500" /> Snooker Frame Tracker
                  </span>
                  <button onClick={() => { setP1Frames(0); setP2Frames(0); }} className="text-[10px] text-neutral-400 hover:text-neutral-900 font-bold">
                    Reset Frames
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200">
                    <input
                      value={p1Name}
                      onChange={(e) => setP1Name(e.target.value)}
                      className="w-full bg-transparent text-xs font-bold text-center outline-none text-neutral-800 mb-1"
                    />
                    <div className="text-3xl font-black text-neutral-900 my-1">{p1Frames}</div>
                    <div className="flex justify-center gap-1.5">
                      <button onClick={() => setP1Frames(Math.max(0, p1Frames - 1))} className="w-7 h-7 rounded-lg bg-white border text-xs font-bold text-neutral-700">-</button>
                      <button onClick={() => setP1Frames(p1Frames + 1)} className="w-7 h-7 rounded-lg bg-neutral-900 text-white text-xs font-bold">+</button>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200">
                    <input
                      value={p2Name}
                      onChange={(e) => setP2Name(e.target.value)}
                      className="w-full bg-transparent text-xs font-bold text-center outline-none text-neutral-800 mb-1"
                    />
                    <div className="text-3xl font-black text-neutral-900 my-1">{p2Frames}</div>
                    <div className="flex justify-center gap-1.5">
                      <button onClick={() => setP2Frames(Math.max(0, p2Frames - 1))} className="w-7 h-7 rounded-lg bg-white border text-xs font-bold text-neutral-700">-</button>
                      <button onClick={() => setP2Frames(p2Frames + 1)} className="w-7 h-7 rounded-lg bg-neutral-900 text-white text-xs font-bold">+</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Snack Order Modal */}
            {showSnackMenu && (
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
                <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-neutral-200">
                  <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-neutral-900">Digital Food & Snack Menu</h3>
                      <p className="text-xs text-neutral-500">Delivered directly to Table #{activeTable.number}</p>
                    </div>
                    <button
                      onClick={() => setShowSnackMenu(false)}
                      className="text-neutral-400 hover:text-neutral-700 p-2 rounded-xl text-xs font-bold"
                    >
                      Close
                    </button>
                  </div>

                  {/* Menu Search & Category Filter Bar */}
                  <div className="p-3 bg-neutral-50 border-b border-neutral-100 flex flex-col gap-2">
                    <Input
                      placeholder="Search drinks or snacks..."
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      leftIcon={<Search className="w-3.5 h-3.5 text-neutral-400" />}
                      className="text-xs py-1.5"
                    />

                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'drinks', label: '🥤 Cold Drinks' },
                        { id: 'tea_coffee', label: '☕ Tea/Coffee' },
                        { id: 'snacks', label: '🍿 Snacks' },
                        { id: 'food', label: '🍔 Meals' },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-colors ${
                            selectedCategory === cat.id ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 border border-neutral-200'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Menu Catalog List */}
                  <div className="flex-1 overflow-y-auto p-4 divide-y divide-neutral-100">
                    {filteredMenuItems.length === 0 ? (
                      <div className="py-8 text-center text-xs text-neutral-400">
                        No menu items found for this category.
                      </div>
                    ) : (
                      filteredMenuItems.map((item) => {
                        const qty = snackCart[item.id] || 0;
                        return (
                          <div key={item.id} className="py-3 flex items-center justify-between">
                            <div>
                              <h4 className="text-xs font-bold text-neutral-900">{item.name}</h4>
                              <span className="text-xs font-mono font-bold text-emerald-600 block mt-0.5">
                                {formatCurrency(item.price, config.currencySymbol)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {qty > 0 ? (
                                <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-xl">
                                  <button
                                    onClick={() => handleQuantityChange(item.id, -1)}
                                    className="p-1 rounded-lg bg-white text-neutral-900 shadow-2xs"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="text-xs font-bold w-4 text-center">{qty}</span>
                                  <button
                                    onClick={() => handleQuantityChange(item.id, 1)}
                                    className="p-1 rounded-lg bg-white text-neutral-900 shadow-2xs"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuantityChange(item.id, 1)}
                                >
                                  Add
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Cart Footer */}
                  <div className="p-4 border-t border-neutral-100 bg-neutral-900 text-white flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-400">Cart Total</span>
                      <div className="text-sm font-bold font-mono text-emerald-400">
                        {formatCurrency(cartTotalPrice, config.currencySymbol)} ({cartItemsCount} items)
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      disabled={cartItemsCount === 0}
                      onClick={handleSendSnackOrder}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                    >
                      Send Order
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CHECKOUT REQUESTED CONFIRMATION */}
        {step === 'checkout-requested' && (
          <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 shadow-sm text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shadow-inner">
              <Receipt className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                Checkout Requested
              </span>
              <h2 className="text-xl font-bold text-neutral-900 mt-3">Desk Marker Alerted!</h2>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                Staff will arrive at Table #{activeTable.number} with your final receipt shortly. Thank you for playing!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 w-full text-xs flex justify-between items-baseline font-bold">
              <span>Final Total Due:</span>
              <span className="text-lg font-mono text-neutral-900">{formatCurrency(totals.grandTotal, config.currencySymbol)}</span>
            </div>

            <Button variant="outline" size="md" className="w-full justify-center" onClick={() => setStep('welcome')}>
              Return to Home View
            </Button>
          </div>
        )}

        {/* STEP 0: WELCOME SCREEN (When unoccupied or standard start) */}
        {!isOccupied && step === 'welcome' && (
          <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 shadow-sm text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/80">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Table #{activeTable.number} • {(activeTable.status || 'available').toUpperCase()}
              </span>
              <h2 className="text-xl font-extrabold text-neutral-900 mt-3">Welcome to {config.clubName || 'Rocket 147'}</h2>
              <p className="text-xs text-neutral-500 mt-1">
                Scan QR code, enter player details & start your cue session instantly.
              </p>
            </div>

            <div className="w-full p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs flex justify-between items-center">
              <span className="text-neutral-500 font-medium">Hourly Rate</span>
              <strong className="text-neutral-900 font-mono text-sm">{formatCurrency(activeTable.hourlyRate || 0, config.currencySymbol)}/hr</strong>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full justify-center mt-1"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => setStep('enter-details')}
            >
              Begin Session Check-in
            </Button>
          </div>
        )}

        {/* STEP 1: ENTER NAME & PHONE */}
        {!isOccupied && step === 'enter-details' && (
          <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 cursor-pointer" onClick={() => setStep('welcome')}>
              <ChevronLeft className="w-4 h-4" /> Back to Welcome
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider">Step 1 of 3</span>
              <h2 className="text-lg font-bold text-neutral-900 mt-0.5">Enter Player Details</h2>
              <p className="text-xs text-neutral-500">Who is playing on Table #{activeTable.number}?</p>
            </div>

            <Input
              label="Your Name"
              placeholder="e.g. Marcus Vance"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            <Input
              label="Phone Number (Optional)"
              placeholder="e.g. +91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone className="w-4 h-4" />}
            />

            <Button
              variant="primary"
              size="lg"
              className="w-full justify-center mt-2"
              disabled={!name.trim()}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => setStep('choose-players')}
            >
              Next: Choose Players
            </Button>
          </div>
        )}

        {/* STEP 2: CHOOSE PLAYERS */}
        {!isOccupied && step === 'choose-players' && (
          <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 cursor-pointer" onClick={() => setStep('enter-details')}>
              <ChevronLeft className="w-4 h-4" /> Back to Details
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider">Step 2 of 3</span>
              <h2 className="text-lg font-bold text-neutral-900 mt-0.5">Select Number of Players</h2>
              <p className="text-xs text-neutral-500">Choose how many cues will be on Table #{activeTable.number}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { count: 1, label: 'Solo Practice', icon: '🎱' },
                { count: 2, label: '1v1 Match', icon: '⚔️' },
                { count: 4, label: 'Doubles (2v2)', icon: '👥' },
                { count: 6, label: 'Group Match', icon: '🏆' },
              ].map((opt) => (
                <button
                  key={opt.count}
                  type="button"
                  onClick={() => setPlayersCount(opt.count)}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    playersCount === opt.count
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-md scale-[1.02]'
                      : 'bg-white text-neutral-800 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <span className="text-xs font-bold">{opt.label}</span>
                </button>
              ))}
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full justify-center mt-2"
              leftIcon={<Play className="w-4 h-4 fill-current text-white" />}
              onClick={handleRequestSession}
            >
              Request Session Start
            </Button>
          </div>
        )}

        {/* STEP 3: WAITING SCREEN */}
        {!isOccupied && step === 'waiting' && (
          <div className="bg-white rounded-3xl border border-neutral-200/90 p-8 shadow-sm text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center relative shadow-xs">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-amber-800 uppercase tracking-wider bg-amber-100/80 px-3 py-1 rounded-full border border-amber-200">
                Waiting for desk approval...
              </span>
              <h2 className="text-lg font-bold text-neutral-900 mt-3">Request Sent to Desk Marker</h2>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs leading-relaxed">
                Table #{activeTable.number} request submitted for <strong>{name}</strong> ({playersCount} players). As soon as the marker approves, your timer will start automatically!
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="mt-2 text-neutral-500 hover:text-neutral-900"
              onClick={() => setStep('welcome')}
            >
              Cancel Request
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
