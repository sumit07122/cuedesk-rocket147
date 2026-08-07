import React from 'react';
import { ChefHat, Clock, CheckCircle2, AlertCircle, Utensils, RefreshCw } from 'lucide-react';
import { FoodOrder, FoodOrderStatus } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface KitchenDisplayViewProps {
  foodOrders: FoodOrder[];
  onUpdateOrderStatus: (orderId: string, status: FoodOrderStatus) => void;
}

export const KitchenDisplayView: React.FC<KitchenDisplayViewProps> = ({
  foodOrders,
  onUpdateOrderStatus,
}) => {
  const activeOrders = foodOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  const completedOrders = foodOrders.filter(o => o.status === 'delivered').slice(0, 10);

  const getStatusBadge = (status: FoodOrderStatus) => {
    switch (status) {
      case 'new':
        return <Badge variant="warning" className="animate-pulse">NEW ORDER</Badge>;
      case 'preparing':
        return <Badge variant="info">PREPARING</Badge>;
      case 'ready':
        return <Badge variant="success">READY TO SERVE</Badge>;
      case 'delivered':
        return <Badge variant="default">SERVED</Badge>;
      default:
        return <Badge variant="danger">{status.toUpperCase()}</Badge>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900 text-white p-6 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Kitchen Display System (KDS)</h1>
            <p className="text-sm text-neutral-400">Live order queue for table snacks, tea, coffee & beverages</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-neutral-800 px-4 py-2 rounded-xl border border-neutral-700 text-center">
            <span className="text-xs font-medium text-neutral-400 block">Pending Orders</span>
            <span className="text-xl font-bold text-amber-400">{activeOrders.length}</span>
          </div>
        </div>
      </div>

      {/* Live Order Cards Grid */}
      {activeOrders.length === 0 ? (
        <Card className="p-12 text-center space-y-3 border-dashed">
          <Utensils className="w-12 h-12 text-neutral-300 mx-auto" />
          <h3 className="text-lg font-bold text-neutral-800">Kitchen Queue Clean</h3>
          <p className="text-sm text-neutral-500 max-w-md mx-auto">
            No active food or beverage orders right now. Orders placed from table QR codes or Cashier POS will appear here instantly.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeOrders.map((order) => {
            const elapsedMins = Math.floor((Date.now() - order.orderTime) / 60000);
            const isUrgent = elapsedMins > 15 && order.status === 'new';

            return (
              <div
                key={order.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm space-y-4 transition-all duration-200 ${
                  isUrgent ? 'border-rose-400 ring-2 ring-rose-400/20' : 'border-neutral-200'
                }`}
              >
                {/* Order Top Bar */}
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
                      {order.tableName}
                    </span>
                    <h4 className="text-base font-extrabold text-neutral-900">{order.customerName}</h4>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(order.status)}
                    <span className="text-[11px] font-medium text-neutral-400 block mt-1">
                      {elapsedMins} min ago
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm font-medium text-neutral-800">
                      <span className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-neutral-900 text-white text-xs font-bold flex items-center justify-center">
                          {item.quantity}x
                        </span>
                        {item.name}
                      </span>
                      <span className="text-xs text-neutral-500 font-semibold">₹{(item.price * item.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                  {order.notes && (
                    <p className="text-xs italic text-amber-700 bg-amber-50 p-2 rounded-lg mt-2 border border-amber-200">
                      Note: {order.notes}
                    </p>
                  )}
                </div>

                {/* Status Action Buttons */}
                <div className="pt-2 flex gap-2">
                  {order.status === 'new' && (
                    <Button
                      fullWidth
                      variant="primary"
                      onClick={() => onUpdateOrderStatus(order.id, 'preparing')}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      Start Preparing
                    </Button>
                  )}
                  {order.status === 'preparing' && (
                    <Button
                      fullWidth
                      variant="primary"
                      onClick={() => onUpdateOrderStatus(order.id, 'ready')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Mark Ready to Serve
                    </Button>
                  )}
                  {order.status === 'ready' && (
                    <Button
                      fullWidth
                      variant="primary"
                      onClick={() => onUpdateOrderStatus(order.id, 'delivered')}
                      className="bg-neutral-900 hover:bg-neutral-800 text-white"
                    >
                      Mark Served / Delivered
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recently Served Section */}
      {completedOrders.length > 0 && (
        <div className="pt-6 border-t border-neutral-200 space-y-3">
          <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider">Recently Served</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {completedOrders.map((order) => (
              <div key={order.id} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-neutral-800">{order.tableName}</span>
                  <span className="text-neutral-500 block">{order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</span>
                </div>
                <Badge variant="success">SERVED</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
