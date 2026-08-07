import React, { useState } from 'react';
import { Plus, Minus, Search, Utensils, Coffee, Pizza } from 'lucide-react';
import { TableItem, MenuItem, OrderItem } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatCurrency } from '../../utils/formatters';

interface AddSnackModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: TableItem | null;
  menuItems: MenuItem[];
  currencySymbol: string;
  onAddOrderItems: (tableId: string, itemsToAdd: OrderItem[]) => void;
}

export const AddSnackModal: React.FC<AddSnackModalProps> = ({
  isOpen,
  onClose,
  table,
  menuItems,
  currencySymbol,
  onAddOrderItems,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'drinks' | 'snacks' | 'food' | 'accessories'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});

  if (!isOpen || !table) return null;

  const handleQuantityChange = (menuId: string, delta: number) => {
    setCartQuantities((prev) => {
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

  const filteredMenu = menuItems.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (selectedCategory !== 'all') return item.category === selectedCategory;
    return true;
  });

  const totalItemsCount = Object.values(cartQuantities).reduce((acc: number, q: number) => acc + q, 0);

  const handleConfirmAdd = () => {
    const newOrderItems: OrderItem[] = [];
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    Object.entries(cartQuantities).forEach(([menuId, qtyVal]) => {
      const qty = qtyVal as number;
      const menuObj = menuItems.find((m) => m.id === menuId);
      if (menuObj && qty > 0) {
        newOrderItems.push({
          id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          menuId: menuObj.id,
          name: menuObj.name,
          price: menuObj.price,
          quantity: qty,
          category: menuObj.category,
          addedAt: timestamp,
        });
      }
    });

    if (newOrderItems.length > 0) {
      onAddOrderItems(table.id, newOrderItems);
    }
    setCartQuantities({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Food & Drinks — Table #${table.number}`}
      subtitle={`Customer: ${table.currentSession?.customerName || 'Guest'}`}
      maxWidth="max-w-xl"
    >
      <div className="flex flex-col gap-4 pt-1">
        {/* Search & Category Tabs */}
        <Input
          placeholder="Search menu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'drinks', label: 'Beverages' },
            { id: 'snacks', label: 'Snacks' },
            { id: 'food', label: 'Meals & Food' },
            { id: 'accessories', label: 'Cue Accessories' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Menu Items List */}
        <div className="max-h-72 overflow-y-auto border border-neutral-200/80 rounded-2xl divide-y divide-neutral-100">
          {filteredMenu.map((item) => {
            const qty = cartQuantities[item.id] || 0;
            return (
              <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-neutral-50/80 transition-colors">
                <div>
                  <h4 className="text-xs font-semibold text-neutral-900">{item.name}</h4>
                  {item.description && <p className="text-[11px] text-neutral-400 mt-0.5">{item.description}</p>}
                  <span className="text-xs font-bold text-neutral-800 font-mono mt-1 block">
                    {formatCurrency(item.price, currencySymbol)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {qty > 0 ? (
                    <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-xl border border-neutral-200">
                      <button
                        onClick={() => handleQuantityChange(item.id, -1)}
                        className="p-1 rounded-lg bg-white hover:bg-neutral-200 text-neutral-800"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold w-5 text-center">{qty}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, 1)}
                        className="p-1 rounded-lg bg-white hover:bg-neutral-200 text-neutral-800"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                      onClick={() => handleQuantityChange(item.id, 1)}
                    >
                      Add
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Confirmation */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
          <span className="text-xs font-medium text-neutral-600">
            Selected: <strong className="text-neutral-900">{totalItemsCount} items</strong>
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={totalItemsCount === 0}
              onClick={handleConfirmAdd}
            >
              Add Selected Items to Bill
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
