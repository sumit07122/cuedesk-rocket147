import React, { useState } from 'react';
import { 
  Building2, 
  Sparkles, 
  Check, 
  X, 
  Plus, 
  Grid2X2, 
  DollarSign, 
  Clock, 
  ShieldCheck, 
  Rocket
} from 'lucide-react';
import { SubscriptionPlanId, SaaSClubProfile } from '../../types';
import { SUBSCRIPTION_PLANS } from '../../data/saasPlans';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOnboardClub: (newClubData: Partial<SaaSClubProfile>, initialTablesCount: number) => Promise<void>;
  ownerEmail?: string;
}

const PRESET_LOGOS = [
  'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=120&auto=format&fit=crop&q=80',
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onOnboardClub,
  ownerEmail = 'owner@cuedesk.com',
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [clubName, setClubName] = useState('');
  const [tagline, setTagline] = useState('Premier Snooker & Pool Experience');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(ownerEmail);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [timeZone, setTimeZone] = useState('EST');
  const [tablesCount, setTablesCount] = useState(6);
  const [hourlyRate, setHourlyRate] = useState(18.00);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>('professional');
  const [selectedLogo, setSelectedLogo] = useState(PRESET_LOGOS[0]);
  const [themeAccent, setThemeAccent] = useState('#09090b');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName.trim()) return;

    try {
      setIsSubmitting(true);
      const chosenPlan = SUBSCRIPTION_PLANS[selectedPlan];
      const now = Date.now();
      const trialDays = 14;

      const profile: Partial<SaaSClubProfile> = {
        clubName: clubName.trim(),
        tagline: tagline.trim(),
        address: address.trim() || '123 Cue Sports Way',
        phone: phone.trim() || '+1 (555) 000-1122',
        email: email.trim(),
        currencySymbol,
        currencyCode,
        timeZone,
        defaultHourlyRate: hourlyRate,
        tablesCount,
        logoUrl: selectedLogo,
        themeAccentColor: themeAccent,
        ownerId: ownerEmail,
        planId: selectedPlan,
        subscriptionStatus: 'trial',
        trialStartDate: now,
        trialEndDate: now + (trialDays * 24 * 60 * 60 * 1000),
        renewalDate: now + (trialDays * 24 * 60 * 60 * 1000),
        featureFlags: { ...chosenPlan.features },
        branding: {
          logoUrl: selectedLogo,
          clubName: clubName.trim(),
          receiptFooter: `Thank you for choosing ${clubName.trim()}!`,
          themeAccentColor: themeAccent,
        },
      };

      await onOnboardClub(profile, tablesCount);
      onClose();
    } catch (err) {
      console.error('Onboarding failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
              <Rocket className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-neutral-900 tracking-tight">Onboard New Club Workspace</h3>
              <p className="text-xs text-neutral-500">Multi-Tenant SaaS Onboarding Flow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 my-5">
          <div
            onClick={() => setStep(1)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 cursor-pointer transition-all ${
              step === 1
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-neutral-50 text-neutral-500 border-neutral-200'
            }`}
          >
            <span>1. Business & Pricing Profile</span>
          </div>
          <div
            onClick={() => setStep(2)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 cursor-pointer transition-all ${
              step === 2
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-neutral-50 text-neutral-500 border-neutral-200'
            }`}
          >
            <span>2. SaaS Plan & Capacity</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Club / Business Name"
                  placeholder="e.g. Apex Snooker Lounge"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  required
                />
                <Input
                  label="Tagline / Motto"
                  placeholder="e.g. Master Your Cue Game"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Business Address"
                  placeholder="e.g. 500 Grand Avenue, Suite 10"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <Input
                  label="Contact Phone Number"
                  placeholder="e.g. +1 (555) 234-5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">Currency Symbol</label>
                  <select
                    value={currencySymbol}
                    onChange={(e) => {
                      setCurrencySymbol(e.target.value);
                      const map: Record<string, string> = { '$': 'USD', '₹': 'INR', '€': 'EUR', '£': 'GBP', 'A$': 'AUD' };
                      setCurrencyCode(map[e.target.value] || 'USD');
                    }}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-neutral-900"
                  >
                    <option value="$">$ (USD)</option>
                    <option value="₹">₹ (INR)</option>
                    <option value="€">€ (EUR)</option>
                    <option value="£">£ (GBP)</option>
                    <option value="A$">A$ (AUD)</option>
                  </select>
                </div>

                <Input
                  label="Default Hourly Rate"
                  type="number"
                  step="0.5"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                  required
                />

                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">Time Zone</label>
                  <select
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-neutral-900"
                  >
                    <option value="EST">EST (US Eastern)</option>
                    <option value="PST">PST (US Pacific)</option>
                    <option value="IST">IST (India)</option>
                    <option value="CET">CET (Central Europe)</option>
                    <option value="GMT">GMT (London)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">Select Club Avatar Logo</label>
                <div className="flex items-center gap-3">
                  {PRESET_LOGOS.map((logo, idx) => (
                    <img
                      key={idx}
                      src={logo}
                      alt="Logo Preset"
                      onClick={() => setSelectedLogo(logo)}
                      className={`w-12 h-12 rounded-xl object-cover border-2 cursor-pointer transition-all ${
                        selectedLogo === logo ? 'border-neutral-900 scale-105 shadow-xs' : 'border-neutral-200 opacity-60'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    if (!clubName.trim()) {
                      alert('Please enter a club name.');
                      return;
                    }
                    setStep(2);
                  }}
                >
                  Next: Choose Plan & Capacity →
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1.5">Initial Table Capacity to Create</label>
                <div className="flex items-center gap-3">
                  {[2, 4, 6, 8, 12].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setTablesCount(num)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                        tablesCount === num
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-200'
                      }`}
                    >
                      {num} Tables
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-900 block mb-2">Select SaaS Subscription Plan (14-Day Free Trial)</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(Object.keys(SUBSCRIPTION_PLANS) as SubscriptionPlanId[]).map((planKey) => {
                    const plan = SUBSCRIPTION_PLANS[planKey];
                    const isSelected = selectedPlan === planKey;
                    return (
                      <div
                        key={planKey}
                        onClick={() => setSelectedPlan(planKey)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-neutral-900 bg-neutral-50/80 shadow-md'
                            : 'border-neutral-200 bg-white hover:border-neutral-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-neutral-900 text-sm">{plan.name}</span>
                            {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                          </div>
                          <div className="text-base font-black font-mono text-neutral-900 my-1">
                            ${plan.priceMonthly}<span className="text-[10px] text-neutral-400 font-sans font-medium">/mo</span>
                          </div>
                          <p className="text-[11px] text-neutral-500 leading-snug">{plan.description}</p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-neutral-200 text-[11px] font-semibold text-neutral-700 space-y-0.5">
                          <div>• Max Tables: {plan.maxTables === 999 ? 'Unlimited' : plan.maxTables}</div>
                          <div>• Max Staff: {plan.maxEmployees === 999 ? 'Unlimited' : plan.maxEmployees}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Starts with 14-Day Full Free Trial. No credit card required.</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  ← Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  leftIcon={<ShieldCheck className="w-4 h-4" />}
                >
                  {isSubmitting ? 'Creating Workspace...' : 'Launch Club Workspace'}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
