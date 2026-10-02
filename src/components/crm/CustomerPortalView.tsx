import React, { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { CalendarDays, Clock3, CreditCard, LogOut, ReceiptText, ShieldCheck, Wallet } from 'lucide-react';
import { db } from '../../lib/firebase';
import { CustomerPortalActivity, CustomerPortalProfile, CustomerPortalReceipt, UserProfile } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

interface CustomerPortalViewProps {
  user: UserProfile;
}

const formatDate = (value: number) => new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Kolkata',
}).format(value);

export const CustomerPortalView: React.FC<CustomerPortalViewProps> = ({ user }) => {
  const { signOutUser } = useAuth();
  const [profile, setProfile] = useState<CustomerPortalProfile | null>(null);
  const [receipts, setReceipts] = useState<CustomerPortalReceipt[]>([]);
  const [activity, setActivity] = useState<CustomerPortalActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const customerId = user.customerId;
  const clubId = user.clubId;

  useEffect(() => {
    if (!clubId || !customerId) {
      setLoadError('This account is not linked to a customer profile. Please contact the club.');
      setLoading(false);
      return;
    }
    const base = ['clubs', clubId, 'customerPortal', customerId] as const;
    const unsubscribeProfile = onSnapshot(doc(db, ...base), (snapshot) => {
      if (!snapshot.exists() || snapshot.data().enabled !== true) {
        setProfile(null);
        setLoadError('This customer profile is currently unavailable. Please contact the club.');
      } else {
        setProfile({ id: snapshot.id, ...snapshot.data() } as CustomerPortalProfile);
        setLoadError('');
      }
      setLoading(false);
    }, () => {
      setProfile(null);
      setLoadError('Your club account could not be loaded. Check your connection and try again.');
      setLoading(false);
    });
    const unsubscribeReceipts = onSnapshot(
      query(collection(db, ...base, 'receipts'), orderBy('endTime', 'desc')),
      (snapshot) => setReceipts(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as CustomerPortalReceipt))),
      () => setReceipts([])
    );
    const unsubscribeActivity = onSnapshot(
      query(collection(db, ...base, 'activity'), orderBy('timestamp', 'desc')),
      (snapshot) => setActivity(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as CustomerPortalActivity))),
      () => setActivity([])
    );
    return () => {
      unsubscribeProfile();
      unsubscribeReceipts();
      unsubscribeActivity();
    };
  }, [clubId, customerId]);

  const currencySymbol = profile?.currencySymbol || '₹';
  const currency = (amount: number) => formatCurrency(amount || 0, currencySymbol);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-5">
        <header className="flex items-start justify-between gap-4 rounded-3xl border border-amber-500/20 bg-[#121216] p-5 sm:p-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">Customer account</p>
            <h1 className="mt-2 text-2xl font-black">{profile?.clubName || 'One Shot Snooker Gaming Club'}</h1>
            {profile && <p className="mt-1 text-sm text-neutral-400">{profile.name} · Customer ID {profile.customerNumber}</p>}
            <p className="mt-1 text-xs text-neutral-500">Signed in as {user.email}</p>
          </div>
          <button onClick={() => void signOutUser()} className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-neutral-300 hover:bg-white/5">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </header>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-[#121216] p-8 text-center text-sm text-neutral-400">Loading your club account…</div>
        ) : loadError ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-950/30 p-5 text-sm text-rose-200">{loadError}</div>
        ) : profile ? (
          <>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard icon={<ReceiptText />} label="Visits" value={String(profile.sessionsCount || 0)} />
              <SummaryCard icon={<Clock3 />} label="Playing time" value={`${(profile.totalHoursPlayed || 0).toFixed(1)} hrs`} />
              <SummaryCard icon={<CreditCard />} label="Total paid" value={currency(profile.totalSpent)} />
              <SummaryCard icon={<Wallet />} label="Current due" value={currency(profile.outstandingDue)} accent={(profile.outstandingDue || 0) > 0} />
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-[#121216] p-5">
                <div className="flex items-center gap-2 text-sm font-bold"><CalendarDays className="h-4 w-4 text-amber-400" /> Club account summary</div>
                <div className="mt-4 space-y-3 text-sm">
                  <InfoRow label="Last visit" value={profile.lastVisit || 'No visits recorded'} />
                  <InfoRow label="Advance balance" value={currency(profile.walletBalance)} />
                  <InfoRow label="Paid to date" value={currency(profile.totalSpent)} />
                  <InfoRow label="Outstanding amount" value={currency(profile.outstandingDue)} />
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/15 p-5">
                <div className="flex items-center gap-2 text-sm font-bold"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Private, view-only access</div>
                <p className="mt-3 text-sm leading-6 text-neutral-300">This page shows the visits, receipts, payments, and account balances linked to your customer profile. It cannot be used to change your details or make payments.</p>
                <p className="mt-3 text-xs leading-5 text-neutral-500">If you spot an error, ask the club staff to review the original receipt.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#121216] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold">Receipts and visits</h2>
                  <p className="mt-1 text-xs text-neutral-500">Your bills, gaming time, food orders, and payment status.</p>
                </div>
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-neutral-400">{receipts.length}</span>
              </div>
              {receipts.length === 0 ? (
                <p className="py-8 text-center text-sm text-neutral-500">No completed visits are linked to this profile yet.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {receipts.map((receipt) => (
                    <details key={receipt.id} className="group rounded-xl border border-white/10 bg-black/20 p-4">
                      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold">Receipt {receipt.receiptNo}</p>
                          <p className="mt-1 text-xs text-neutral-500">{formatDate(receipt.endTime)} · {receipt.tableName} · {Math.floor(receipt.durationSeconds / 3600)}h {Math.floor((receipt.durationSeconds % 3600) / 60)}m</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-extrabold">{currency(receipt.total)}</p>
                          <p className={`mt-1 text-[11px] font-semibold ${receipt.paymentStatus === 'refunded' ? 'text-rose-300' : receipt.due > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
                            {receipt.paymentStatus === 'refunded' ? 'Refunded' : receipt.due > 0 ? `${currency(receipt.due)} due` : 'Paid'}
                          </p>
                        </div>
                      </summary>
                      <div className="mt-4 border-t border-white/10 pt-3 text-xs text-neutral-300">
                        <InfoRow label="Table charge" value={currency(receipt.tableFee)} />
                        <InfoRow label="Food and drinks" value={currency(receipt.foodFee)} />
                        {receipt.extraFee > 0 && <InfoRow label="Other charges" value={currency(receipt.extraFee)} />}
                        <InfoRow label="Paid" value={currency(receipt.paid)} />
                        <InfoRow label="Payment method" value={receipt.paymentMethod} />
                        {receipt.refundedAmount ? <InfoRow label="Refund recorded" value={currency(receipt.refundedAmount)} /> : null}
                        {receipt.foodOrders?.length ? <p className="mt-3 text-neutral-400">Items: {receipt.foodOrders.map((item) => `${item.name} × ${item.quantity}`).join(', ')}</p> : null}
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#121216] p-5">
              <h2 className="text-base font-extrabold">Payments and account activity</h2>
              {activity.length === 0 ? <p className="mt-3 text-sm text-neutral-500">No account transactions recorded yet.</p> : (
                <div className="mt-3 divide-y divide-white/5">
                  {activity.map((item) => (
                    <div key={item.id} className="flex justify-between gap-3 py-3 text-sm">
                      <div><p className="font-semibold">{item.description}</p><p className="mt-1 text-xs text-neutral-500">{formatDate(item.timestamp)}{item.receiptNo ? ` · Receipt ${item.receiptNo}` : ''}</p></div>
                      <p className="shrink-0 font-bold">{item.type === 'due_added' ? '+' : ''}{currency(item.amount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
        <p className="text-center text-[11px] text-neutral-600">Customer view · One Shot Snooker Gaming Club</p>
      </div>
    </div>
  );
};

const SummaryCard: React.FC<{ icon: React.ReactNode; label: string; value: string; accent?: boolean }> = ({ icon, label, value, accent }) => (
  <div className="rounded-2xl border border-white/10 bg-[#121216] p-4">
    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">{React.cloneElement(icon as React.ReactElement, { className: 'h-4 w-4 text-amber-400' })}{label}</div>
    <p className={`mt-3 text-xl font-black ${accent ? 'text-amber-300' : 'text-white'}`}>{value}</p>
  </div>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 py-1"><span className="text-neutral-500">{label}</span><span className="text-right font-semibold text-neutral-200">{value}</span></div>
);
