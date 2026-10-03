import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth, formatAuthError } from '../../context/AuthContext';

interface LoginViewProps {
  onLoginSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { signInWithEmail } = useAuth();

  const [username, setUsername] = useState('owner');
  const [password, setPassword] = useState('1234');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const clearMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmail(username.trim(), password.trim());
      if (onLoginSuccess) onLoginSuccess();
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
          <div className="relative group cursor-pointer mb-3">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-amber-500 to-amber-300 opacity-40 blur-md group-hover:opacity-75 transition duration-500" />
            <img
              src="/logo.png"
              alt="One Shot Gaming Club ERP"
              className="relative w-20 h-20 rounded-2xl object-cover shadow-2xl ring-2 ring-amber-400/40"
            />
          </div>
          
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            ONE SHOT
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-widest">
              GAMING CLUB
            </span>
          </h1>
          <p className="text-[11px] font-medium text-amber-200/70 mt-1 tracking-wider uppercase font-mono">
            Dedicated Club Management &amp; ERP System
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

          {/* SIGN IN FORM */}
          <form onSubmit={handleSignIn} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1">Username / Email</label>
              <div className="relative">
                <User className="w-4 h-4 text-amber-500/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="Enter username or email..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#18181f] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1">Password</label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-amber-500/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Enter password..."
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
        </div>

        {/* Security Badge Footer */}
        <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-neutral-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Enterprise 256-Bit SSL Encrypted • One Shot Gaming Club ERP</span>
        </div>

      </div>
    </div>
  );
};
