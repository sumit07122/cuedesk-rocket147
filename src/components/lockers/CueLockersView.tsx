import React, { useState } from 'react';
import { Key, Plus, User, Calendar, ShieldCheck, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { CueLocker } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../utils/formatters';

interface CueLockersViewProps {
  lockers?: CueLocker[];
  currencySymbol: string;
  onSaveLocker?: (locker: CueLocker) => void;
  onDeleteLocker?: (lockerId: string) => void;
}

export const CueLockersView: React.FC<CueLockersViewProps> = ({
  lockers = [],
  currencySymbol,
  onSaveLocker = (_locker: CueLocker) => {},
  onDeleteLocker = (_lockerId: string) => {},
}) => {
  const [localLockers, setLocalLockers] = useState<CueLocker[]>(() => {
    if (lockers.length > 0) return lockers;
    // Default 12 lockers for Rocket 147
    return Array.from({ length: 12 }, (_, i) => ({
      id: `locker-${i + 1}`,
      lockerNumber: `Locker #${String(i + 1).padStart(2, '0')}`,
      status: i < 3 ? 'rented' : 'available',
      monthlyFee: 500,
      customerName: i === 0 ? 'Rahul Sharma' : i === 1 ? 'Vikas Verma' : i === 2 ? 'Amit Patel' : undefined,
      customerPhone: i === 0 ? '9876543210' : i === 1 ? '9812345678' : undefined,
      rentedDate: i < 3 ? '2026-08-01' : undefined,
      expiryDate: i < 3 ? '2026-09-01' : undefined,
    }));
  });

  const [selectedLocker, setSelectedLocker] = useState<CueLocker | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [monthlyFee, setMonthlyFee] = useState('500');
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });

  const handleOpenAssignModal = (locker: CueLocker) => {
    setSelectedLocker(locker);
    setCustomerName(locker.customerName || '');
    setCustomerPhone(locker.customerPhone || '');
    setMonthlyFee(String(locker.monthlyFee || 500));
    setExpiryDate(locker.expiryDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleSaveLocker = () => {
    if (!selectedLocker) return;
    const updated: CueLocker = {
      ...selectedLocker,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      monthlyFee: Number(monthlyFee) || 500,
      rentedDate: customerName.trim() ? new Date().toISOString().split('T')[0] : undefined,
      expiryDate: customerName.trim() ? expiryDate : undefined,
      status: customerName.trim() ? 'rented' : 'available',
    };

    setLocalLockers(prev => prev.map(l => l.id === updated.id ? updated : l));
    onSaveLocker(updated);
    setIsModalOpen(false);
  };

  const handleReleaseLocker = (locker: CueLocker) => {
    const updated: CueLocker = {
      ...locker,
      customerName: undefined,
      customerPhone: undefined,
      rentedDate: undefined,
      expiryDate: undefined,
      status: 'available',
    };
    setLocalLockers(prev => prev.map(l => l.id === updated.id ? updated : l));
    onSaveLocker(updated);
    setIsModalOpen(false);
  };

  const rentedCount = localLockers.filter(l => l.status === 'rented').length;
  const totalRevenue = localLockers.filter(l => l.status === 'rented').reduce((acc, l) => acc + l.monthlyFee, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900 text-white p-6 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">VIP Cue Locker Management</h1>
            <p className="text-sm text-neutral-400">Track cue stick locker rentals, player allocations & monthly dues</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-neutral-800 px-4 py-2 rounded-xl border border-neutral-700 text-center">
            <span className="text-xs font-medium text-neutral-400 block">Rented Lockers</span>
            <span className="text-xl font-bold text-amber-400">{rentedCount} / {localLockers.length}</span>
          </div>
          <div className="bg-neutral-800 px-4 py-2 rounded-xl border border-neutral-700 text-center">
            <span className="text-xs font-medium text-neutral-400 block">Monthly Revenue</span>
            <span className="text-xl font-bold text-emerald-400">{formatCurrency(totalRevenue, currencySymbol)}</span>
          </div>
        </div>
      </div>

      {/* Lockers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {localLockers.map((locker) => {
          const isRented = locker.status === 'rented';

          return (
            <Card
              key={locker.id}
              className={`p-5 space-y-4 border transition-all duration-200 hover:shadow-md cursor-pointer ${
                isRented ? 'border-amber-300 bg-amber-50/20' : 'border-neutral-200 hover:border-neutral-400'
              }`}
              onClick={() => handleOpenAssignModal(locker)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className={`w-5 h-5 ${isRented ? 'text-amber-600' : 'text-neutral-400'}`} />
                  <span className="font-extrabold text-neutral-900">{locker.lockerNumber}</span>
                </div>
                {isRented ? (
                  <Badge variant="warning">RENTED</Badge>
                ) : (
                  <Badge variant="success">VACANT</Badge>
                )}
              </div>

              {isRented ? (
                <div className="space-y-1.5 pt-2 border-t border-neutral-100 text-xs text-neutral-600">
                  <p className="font-bold text-neutral-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-neutral-500" />
                    {locker.customerName}
                  </p>
                  {locker.customerPhone && <p className="text-neutral-500 pl-5">{locker.customerPhone}</p>}
                  <p className="text-neutral-500 flex items-center gap-1.5 pt-1">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    Expires: <span className="font-semibold text-neutral-800">{locker.expiryDate}</span>
                  </p>
                  <p className="font-bold text-emerald-600 pt-1">
                    {formatCurrency(locker.monthlyFee, currencySymbol)} / month
                  </p>
                </div>
              ) : (
                <div className="pt-4 text-center">
                  <span className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 block">
                    + Assign Cue Locker
                  </span>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Assign / Release Locker Modal */}
      {selectedLocker && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Manage ${selectedLocker.lockerNumber}`}
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">Member / Player Name</label>
              <Input
                placeholder="Enter player name..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">Phone Number</label>
              <Input
                placeholder="Enter 10-digit mobile number..."
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Monthly Fee ({currencySymbol})</label>
                <Input
                  type="number"
                  value={monthlyFee}
                  onChange={(e) => setMonthlyFee(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Rent Expiry Date</label>
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-neutral-100 gap-3">
              {selectedLocker.status === 'rented' && (
                <Button
                  variant="outline"
                  onClick={() => handleReleaseLocker(selectedLocker)}
                  className="text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  Vacate Locker
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleSaveLocker}>Save Locker Rental</Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
