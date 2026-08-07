import React, { useState } from 'react';
import { 
  Building2, 
  ChevronDown, 
  PlusCircle, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  Crown,
  Laptop
} from 'lucide-react';
import { SaaSClubProfile, PageView } from '../../types';
import { calculateTrialDaysRemaining } from '../../data/saasPlans';

interface WorkspaceSwitcherProps {
  clubs: SaaSClubProfile[];
  currentClubId: string;
  onSwitchClub: (clubId: string) => void;
  onOpenOnboarding: () => void;
  onOpenSuperAdmin?: () => void;
  userRole?: string;
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  clubs,
  currentClubId,
  onSwitchClub,
  onOpenOnboarding,
  onOpenSuperAdmin,
  userRole = 'owner',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const currentClub = clubs.find((c) => c.id === currentClubId) || clubs[0] || {
    id: currentClubId,
    clubName: 'Royal Cue Sports & Lounge',
    planId: 'professional',
    subscriptionStatus: 'active',
  };

  const trialDaysLeft = currentClub.trialEndDate
    ? calculateTrialDaysRemaining(currentClub.trialEndDate)
    : 0;

  return (
    <div className="relative w-full">
      {/* Switcher Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 rounded-2xl p-2.5 flex items-center justify-between text-left transition-all cursor-pointer shadow-2xs group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden border border-neutral-200">
            {currentClub.logoUrl ? (
              <img src={currentClub.logoUrl} alt={currentClub.clubName} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <h4 className="text-xs font-bold text-neutral-900 truncate group-hover:text-black">
                {currentClub.clubName}
              </h4>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] uppercase font-bold text-neutral-500 bg-neutral-200/60 px-1.5 py-0.2 rounded">
                {currentClub.planId || 'Starter'}
              </span>
              {currentClub.subscriptionStatus === 'trial' && (
                <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  {trialDaysLeft}d Trial
                </span>
              )}
            </div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Switcher Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-neutral-200 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150 max-h-80 overflow-y-auto">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Active Workspaces
            </div>

            {clubs.map((c) => {
              const isSelected = c.id === currentClubId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onSwitchClub(c.id);
                    setIsOpen(false);
                  }}
                  className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected ? 'bg-neutral-900 text-white font-semibold' : 'hover:bg-neutral-100 text-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 font-bold text-[10px] ${
                        isSelected ? 'bg-white text-neutral-900' : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {c.clubName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs truncate font-bold">{c.clubName}</div>
                      <div className={`text-[10px] ${isSelected ? 'text-neutral-300' : 'text-neutral-400'}`}>
                        {c.currencySymbol} • {c.tablesCount || 6} Tables
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                </button>
              );
            })}

            <div className="pt-2 border-t border-neutral-100 space-y-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenOnboarding();
                }}
                className="w-full px-2.5 py-2 rounded-xl text-xs font-bold text-neutral-900 bg-neutral-50 hover:bg-neutral-100 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                <span>+ Onboard New Club</span>
              </button>

              {onOpenSuperAdmin && userRole === 'owner' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenSuperAdmin();
                  }}
                  className="w-full px-2.5 py-2 rounded-xl text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 flex items-center justify-between transition-colors cursor-pointer border border-amber-200"
                >
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-600" />
                    <span>Super Admin Console</span>
                  </div>
                  <span className="text-[9px] uppercase font-mono bg-amber-200/80 px-1 rounded font-bold">HQ</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
