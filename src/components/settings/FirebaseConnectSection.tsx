import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Sliders, 
  ArrowRight,
  Trash2,
  HelpCircle,
  Activity,
  Server
} from 'lucide-react';
import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import { 
  getActiveFirebaseConfig, 
  saveCustomFirebaseConfig, 
  clearCustomFirebaseConfig, 
  FirebaseAppConfig 
} from '../../lib/firebase';
import { ensureClubInitialized } from '../../services/dbService';

export const FirebaseConnectSection: React.FC<{ currentClubId?: string }> = ({ currentClubId = 'club-royal-cue' }) => {
  const { config: currentConfig, isCustom } = getActiveFirebaseConfig();

  const [rawSnippet, setRawSnippet] = useState('');
  const [projectId, setProjectId] = useState(currentConfig.projectId || '');
  const [apiKey, setApiKey] = useState(currentConfig.apiKey || '');
  const [authDomain, setAuthDomain] = useState(currentConfig.authDomain || '');
  const [storageBucket, setStorageBucket] = useState(currentConfig.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(currentConfig.messagingSenderId || '');
  const [appId, setAppId] = useState(currentConfig.appId || '');

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    message: string;
  } | null>(null);

  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  // Auto-parse when user pastes into raw snippet textarea
  const handleSnippetChange = (text: string) => {
    setRawSnippet(text);
    setTestResult(null);

    try {
      // 1. Try standard JSON parse
      let parsed: any = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        // 2. Try parsing JS object format (e.g. apiKey: "...",)
        const extract = (key: string): string => {
          const regex = new RegExp(`["']?${key}["']?\\s*:\\s*["']([^"']+)["']`, 'i');
          const match = text.match(regex);
          return match ? match[1] : '';
        };

        const pId = extract('projectId');
        const aKey = extract('apiKey');
        if (pId || aKey) {
          parsed = {
            projectId: pId,
            apiKey: aKey,
            authDomain: extract('authDomain'),
            storageBucket: extract('storageBucket'),
            messagingSenderId: extract('messagingSenderId'),
            appId: extract('appId'),
          };
        }
      }

      if (parsed) {
        if (parsed.projectId) setProjectId(parsed.projectId);
        if (parsed.apiKey) setApiKey(parsed.apiKey);
        if (parsed.authDomain) setAuthDomain(parsed.authDomain);
        if (parsed.storageBucket) setStorageBucket(parsed.storageBucket);
        if (parsed.messagingSenderId) setMessagingSenderId(parsed.messagingSenderId);
        if (parsed.appId) setAppId(parsed.appId);
      }
    } catch (e) {
      console.warn('Snippet parse warning:', e);
    }
  };

  // Test live connection to target Firebase project
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const testConfig: FirebaseAppConfig = {
      projectId: projectId.trim(),
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    };

    if (!testConfig.projectId || !testConfig.apiKey) {
      setTestResult({
        success: false,
        message: 'Project ID and API Key are required to test connection.'
      });
      setIsTesting(false);
      return;
    }

    const testAppName = `test-${Date.now()}`;
    const startTime = performance.now();

    try {
      const tempApp = initializeApp(testConfig, testAppName);
      const tempDb = getFirestore(tempApp);

      // Attempt light read
      const clubsRef = collection(tempDb, 'clubs');
      const q = query(clubsRef, limit(1));
      
      // 5-second timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timed out after 5s. Check API key & internet.')), 5000)
      );

      await Promise.race([getDocs(q), timeoutPromise]);
      const latency = Math.round(performance.now() - startTime);

      await deleteApp(tempApp);

      setTestResult({
        success: true,
        latencyMs: latency,
        message: `Successfully connected to project "${testConfig.projectId}"! Firestore read responded in ${latency}ms.`
      });
    } catch (err: any) {
      console.warn('Test connection error:', err);
      let msg = err.message || 'Connection failed.';
      if (msg.includes('permission-denied')) {
        msg = `Connected to Firebase, but Firestore rules returned "permission-denied". Ensure your firestore.rules allow read access.`;
      }
      setTestResult({
        success: false,
        message: msg
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Save and switch database
  const handleApplyConfig = () => {
    if (!projectId.trim() || !apiKey.trim()) {
      alert('Please provide at least a Project ID and API Key.');
      return;
    }

    const newConfig: FirebaseAppConfig = {
      projectId: projectId.trim(),
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      storageBucket: storageBucket.trim() || `${projectId.trim()}.appspot.com`,
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    };

    saveCustomFirebaseConfig(newConfig);
    if (confirm('Client Firebase configured! Reload the page now to activate the new database connection?')) {
      window.location.reload();
    }
  };

  // Reset back to bundled default
  const handleResetToDefault = () => {
    if (confirm('Reset to the bundled default Firebase database? This will clear client database credentials from this browser.')) {
      clearCustomFirebaseConfig();
      window.location.reload();
    }
  };

  // Seed data to current database
  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setSeedSuccess(null);
    try {
      await ensureClubInitialized(currentClubId, undefined, true);
      setSeedSuccess(`Initial tables, menu items, and business rules successfully seeded into club "${currentClubId}"!`);
    } catch (e: any) {
      alert(`Seeding error: ${e.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  const copyAuthorizedDomain = () => {
    navigator.clipboard.writeText(currentDomain);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. Header & Live Connection Status Card */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-neutral-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start gap-4 z-10">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400 shadow-inner">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black tracking-tight text-white">Cloud Database & Firebase Engine</h3>
              {isCustom ? (
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Custom Client Project
                </span>
              ) : (
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Bundled Cloud DB Active
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 mt-1 max-w-xl">
              Connect the client's own Firebase project directly from this portal, or use the high-speed bundled instance with zero configuration required.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10 shrink-0 w-full md:w-auto">
          {isCustom && (
            <button
              onClick={handleResetToDefault}
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl border border-neutral-700 hover:border-neutral-500 text-xs font-bold text-neutral-300 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Reset to Default</span>
            </button>
          )}

          <button
            onClick={handleSeedDatabase}
            disabled={isSeeding}
            className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isSeeding ? 'Seeding Tables...' : 'Seed Initial Data'}</span>
          </button>
        </div>
      </div>

      {seedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{seedSuccess}</span>
        </div>
      )}

      {/* 2. Direct Connection Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Easy Paste & Manual Inputs */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-2xs flex flex-col gap-6">
          <div className="border-b border-neutral-100 pb-4">
            <h4 className="text-sm font-black text-neutral-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-500" />
              Connect Client's Firebase Project
            </h4>
            <p className="text-xs text-neutral-500 mt-0.5">
              Copy the configuration object from <strong>Firebase Console &gt; Project Settings &gt; General &gt; Your apps &gt; SDK setup and configuration</strong>.
            </p>
          </div>

          {/* Quick Paste Area */}
          <div>
            <label className="text-xs font-extrabold text-neutral-700 block mb-1.5 flex items-center justify-between">
              <span>Quick Importer: Paste Firebase Config Object (JSON or JS)</span>
              <span className="text-[11px] font-normal text-neutral-400">Auto-fills all fields below</span>
            </label>
            <textarea
              rows={4}
              value={rawSnippet}
              onChange={(e) => handleSnippetChange(e.target.value)}
              placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  projectId: "client-club-db",\n  authDomain: "client-club-db.firebaseapp.com",\n  appId: "1:..."\n};`}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-3 text-xs font-mono text-neutral-800 placeholder-neutral-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
            />
          </div>

          {/* Detailed Input Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">Project ID *</label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  setTestResult(null);
                }}
                placeholder="e.g. one-shot-arena-prod"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono text-neutral-900 focus:bg-white focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">API Key *</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTestResult(null);
                }}
                placeholder="AIzaSy..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono text-neutral-900 focus:bg-white focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">Auth Domain</label>
              <input
                type="text"
                value={authDomain}
                onChange={(e) => setAuthDomain(e.target.value)}
                placeholder="project-id.firebaseapp.com"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono text-neutral-900 focus:bg-white focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">Storage Bucket</label>
              <input
                type="text"
                value={storageBucket}
                onChange={(e) => setStorageBucket(e.target.value)}
                placeholder="project-id.firebasestorage.app"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono text-neutral-900 focus:bg-white focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">App ID</label>
              <input
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="1:123456789:web:abcdef..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono text-neutral-900 focus:bg-white focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">Messaging Sender ID</label>
              <input
                type="text"
                value={messagingSenderId}
                onChange={(e) => setMessagingSenderId(e.target.value)}
                placeholder="1234567890"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono text-neutral-900 focus:bg-white focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Test Results Banner */}
          {testResult && (
            <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
              testResult.success 
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                : 'bg-rose-50/90 border-rose-300 text-rose-950'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h5 className="font-extrabold text-xs">
                  {testResult.success ? 'Connection Verified & Online!' : 'Connection Failed'}
                </h5>
                <p className="mt-0.5 leading-relaxed">{testResult.message}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !projectId || !apiKey}
              className="px-5 py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-neutral-800 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing Firestore Ping...' : 'Test & Ping Database'}</span>
            </button>

            <button
              type="button"
              onClick={handleApplyConfig}
              disabled={!projectId || !apiKey}
              className="px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-extrabold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <span>Apply & Switch Database</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Required Setup Checklist & Domain Guide */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          
          {/* Vercel / Domain Whitelist Helper */}
          <div className="bg-amber-50/60 rounded-3xl border border-amber-200/80 p-5 shadow-2xs flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
              <h5 className="text-xs font-extrabold text-amber-950">Firebase Authorized Domains</h5>
            </div>
            <p className="text-[11px] text-amber-900/80 leading-relaxed">
              When deployed to Vercel, Firebase requires your domain to be whitelisted under:
              <br />
              <strong>Firebase Console &gt; Authentication &gt; Settings &gt; Authorized Domains</strong>.
            </p>
            
            <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-xl border border-amber-300/60 text-xs font-mono text-neutral-800 justify-between">
              <span className="truncate">{currentDomain}</span>
              <button
                type="button"
                onClick={copyAuthorizedDomain}
                className="p-1 hover:bg-neutral-100 rounded text-neutral-600 transition-colors shrink-0"
                title="Copy Domain"
              >
                {copiedDomain ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Architecture Concept: Multi-Tenant vs Dedicated */}
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-5 shadow-2xs flex flex-col gap-3.5">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-neutral-600 shrink-0" />
              <h5 className="text-xs font-black text-neutral-900">Recommended SaaS Architecture</h5>
            </div>
            <div className="space-y-3 text-[11px] text-neutral-600 leading-relaxed">
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
                <p className="font-extrabold text-emerald-950 mb-1">
                  Option A: Multi-Tenant (Recommended — Zero Hassle)
                </p>
                <p className="text-emerald-900/80">
                  You keep <strong>one master Firebase instance</strong>. Each client simply gets a unique Workspace ID (e.g. <code className="bg-white px-1 py-0.5 rounded text-[10px]">club-client-name</code>). All their tables, bills, and orders are isolated by club ID. The client never touches Firebase!
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80">
                <p className="font-extrabold text-neutral-900 mb-1">
                  Option B: Bring-Your-Own-Database (Dedicated)
                </p>
                <p className="text-neutral-500">
                  For enterprise clients who legally require their data in their own Google Cloud project. They provide their config snippet above, and CueDesk runs entirely on their own Firestore.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
