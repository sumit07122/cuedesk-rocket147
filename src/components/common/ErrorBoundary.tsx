import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends (Component as any)<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('CueDesk UI caught error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('cuedesk_review_user');
      localStorage.removeItem('cuedesk_review_role');
      localStorage.removeItem('cuedesk_logged_out');
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 shadow-xl">
            <AlertTriangle className="w-8 h-8 text-rose-400" />
          </div>

          <h2 className="text-xl font-black text-white tracking-tight mb-2">
            Something went wrong
          </h2>
          <p className="text-xs text-neutral-400 max-w-md mb-6 leading-relaxed">
            CueDesk encountered a runtime issue. You can reload the page or reset the local counter cache.
          </p>

          {this.state.error && (
            <div className="max-w-lg w-full bg-[#18181f] border border-white/10 rounded-2xl p-4 mb-6 text-left overflow-auto max-h-40">
              <p className="text-xs font-mono text-rose-300 font-bold mb-1">
                {this.state.error.name}: {this.state.error.message}
              </p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Application
            </button>
            <button
              onClick={this.handleReset}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              Reset Cache & Sign In
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
