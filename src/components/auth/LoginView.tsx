import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth, formatAuthError } from '../../context/AuthContext';

interface LoginViewProps {
  onLoginSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { signInWithEmail, sendPasswordReset } = useAuth();

  const [mode, setMode] = useState<'signin' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const clearMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmail(email, password);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err: any) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!email) {
      setErrorMsg('Please enter your account email address.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordReset(email);
      setSuccessMsg(`Password reset link sent to ${email}. Please check your inbox.`);
    } catch (err: any) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-amber-500 selection:text-black relative overflow-hidden">
      {/* Background Decorative Gold Radial Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-amber-500/15 via-amber-600/5 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-amber-600/10 blur-3xl pointer-events-none rounded-full" />

      <div className="w-full max-w-md flex flex-col gap-5 z-10">
        
        {/* Logo & Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative group cursor-pointer mb-2">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-amber-500 to-amber-300 opacity-40 blur-md group-hover:opacity-75 transition duration-500" />
            <img
              src="/logo.png"
              alt="CueDesk - One Shot Snooker Gaming Club Management"
              className="relative w-24 h-24 rounded-3xl object-cover shadow-2xl ring-1 ring-amber-400/30"
            />
          </div>
          
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            CueDesk
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-widest">
              OFFICIAL OS
            </span>
          </h1>
          <p className="text-[11px] font-medium text-amber-200/70 mt-0.5 tracking-wide uppercase">
            One Shot Snooker Gaming Club
          </p>
        </div>

        {/* Auth Glass Card */}
        <div className="bg-[#121216]/90 backdrop-blur-xl rounded-3xl border border-amber-500/20 p-5 sm:p-6 shadow-2xl flex flex-col gap-4">
          
          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs rounded-2xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="font-medium leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs rounded-2xl flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <div className="font-medium leading-relaxed">{successMsg}</div>
            </div>
          )}

          {/* MODE 1: SIGN IN */}
          {mode === 'signin' && (
            <form onSubmit={handleEmailSignIn} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">User Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-amber-500/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    autoComplete="off"
                    placeholder="Enter email address..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#18181f] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-neutral-300">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      clearMessages();
                    }}
                    className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    Reset Password
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-amber-500/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#18181f] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-neutral-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-neutral-400" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/20 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE 2: FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <form onSubmit={handlePasswordReset} className="flex flex-col gap-3.5">
              <div className="text-center p-1">
                <KeyRound className="w-7 h-7 text-amber-400 mx-auto mb-1" />
                <h3 className="text-xs font-extrabold text-white">Reset Password</h3>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-amber-500/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="your-email@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#18181f] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-amber-400 transition-all font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider transition-all hover:shadow-lg hover:shadow-amber-500/20 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>Send Password Reset Link</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  clearMessages();
                }}
                className="text-xs font-bold text-neutral-400 hover:text-amber-300 text-center transition-colors cursor-pointer"
              >
                ← Back to Sign In
              </button>
            </form>
          )}
        </div>

        {/* Security Badge Footer */}
        <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-neutral-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Encrypted Portal • Official CueDesk OS</span>
        </div>

      </div>
    </div>
  );
};
