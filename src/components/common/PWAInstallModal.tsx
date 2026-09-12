import React from 'react';
import { 
  X, 
  Download, 
  Smartphone, 
  Monitor, 
  Share, 
  PlusSquare, 
  CheckCircle2, 
  Zap, 
  WifiOff, 
  ShieldCheck 
} from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => Promise<boolean>;
  isIOS: boolean;
  isInstallable: boolean;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  onInstall,
  isIOS,
  isInstallable
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full border border-neutral-200 shadow-2xl p-6 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="CueDesk"
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-amber-400/30 shadow-md"
            />
            <div>
              <h3 className="text-base font-black text-neutral-900 leading-tight">Install CueDesk OS</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Gaming Club Management PWA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Value Proposition */}
        <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-neutral-50 border border-neutral-200/70 text-center">
          <div className="flex flex-col items-center gap-1 p-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-[11px] font-bold text-neutral-800">Instant Launch</span>
            <span className="text-[9px] text-neutral-400">Loads in &lt;1s</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2">
            <WifiOff className="w-4 h-4 text-emerald-500" />
            <span className="text-[11px] font-bold text-neutral-800">Works Offline</span>
            <span className="text-[9px] text-neutral-400">Never lose billing</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2">
            <Monitor className="w-4 h-4 text-blue-500" />
            <span className="text-[11px] font-bold text-neutral-800">Fullscreen POS</span>
            <span className="text-[9px] text-neutral-400">No browser address bar</span>
          </div>
        </div>

        {/* Platform Specific Instructions */}
        {isIOS ? (
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-black text-amber-950">
              <Smartphone className="w-4 h-4 text-amber-600" />
              <span>Install on iPhone / iPad (Safari)</span>
            </div>
            <ol className="text-xs text-amber-900/90 space-y-2 font-medium">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-200/80 text-amber-950 font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                <span>Tap the <strong>Share</strong> button at bottom of Safari:</span>
                <Share className="w-4 h-4 text-neutral-700 shrink-0 inline" />
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-200/80 text-amber-950 font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                <span>Scroll down &amp; tap <strong>Add to Home Screen</strong></span>
                <PlusSquare className="w-4 h-4 text-neutral-700 shrink-0 inline" />
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-200/80 text-amber-950 font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
                <span>Tap <strong>Add</strong> in top right corner. Done!</span>
              </li>
            </ol>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-neutral-600 leading-relaxed">
              Installing allows staff and cashier workers to run CueDesk as a full-screen desktop or tablet application with automatic offline backup and native desktop notifications.
            </p>
            <button
              onClick={async () => {
                const res = await onInstall();
                if (res) onClose();
              }}
              className="w-full py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>Install CueDesk App on Device</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-100">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secure Progressive Web App (PWA)</span>
          </span>
          <button
            onClick={onClose}
            className="font-bold text-neutral-500 hover:text-neutral-900"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
