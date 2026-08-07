import React, { useState } from 'react';
import { 
  Gamepad2, 
  Tv, 
  Volume2, 
  VolumeX, 
  Clock, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  Play, 
  Square, 
  User, 
  DollarSign,
  Smartphone,
  Wifi,
  ShieldCheck,
  Download
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { soundEffects } from '../../utils/soundEffects';

export const ArenaHubView: React.FC = () => {
  const [soundMuted, setSoundMuted] = useState(false);
  const [selectedStation, setSelectedStation] = useState<'all' | 'ps5' | 'pickleball' | 'snooker'>('all');

  // PS5 & Multi-Gaming Arena Stations State
  const [gamingStations, setGamingStations] = useState([
    {
      id: 'ps5-1',
      name: 'PS5 Station 01 (VIP Console)',
      type: 'ps5',
      controllers: 2,
      gameTitle: 'EA Sports FC 24',
      hourlyRate: 200,
      status: 'occupied',
      player: 'Rahul Verma',
      startTime: Date.now() - 42 * 60 * 1000,
      elapsedMin: 42,
    },
    {
      id: 'ps5-2',
      name: 'PS5 Station 02 (4-Player Couch)',
      type: 'ps5',
      controllers: 4,
      gameTitle: 'Tekken 8 / WWE 2K24',
      hourlyRate: 300,
      status: 'occupied',
      player: 'Vikram & Friends',
      startTime: Date.now() - 18 * 60 * 1000,
      elapsedMin: 18,
    },
    {
      id: 'ps5-3',
      name: 'PS5 Station 03 (Standard)',
      type: 'ps5',
      controllers: 2,
      gameTitle: 'GTA V / Gran Turismo',
      hourlyRate: 180,
      status: 'available',
      player: null,
      startTime: null,
      elapsedMin: 0,
    },
    {
      id: 'pb-1',
      name: 'Pickleball Court 01 (Outdoor LED)',
      type: 'pickleball',
      controllers: 4,
      gameTitle: 'Doubles Match',
      hourlyRate: 800,
      status: 'occupied',
      player: 'Team Synergy',
      startTime: Date.now() - 55 * 60 * 1000,
      elapsedMin: 55,
    },
    {
      id: 'pb-2',
      name: 'Pickleball Court 02 (Pro Turf)',
      type: 'pickleball',
      controllers: 4,
      gameTitle: 'Singles League',
      hourlyRate: 750,
      status: 'available',
      player: null,
      startTime: null,
      elapsedMin: 0,
    },
  ]);

  const toggleMute = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    soundEffects.setMuted(next);
    if (!next) {
      soundEffects.playStartChime();
    }
  };

  const handleStartGamingSession = (id: string) => {
    soundEffects.playStartChime();
    soundEffects.announceText("Gaming station session started");
    setGamingStations((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: 'occupied',
              player: 'Walk-in Player',
              startTime: Date.now(),
              elapsedMin: 0,
            }
          : s
      )
    );
  };

  const handleStopGamingSession = (id: string) => {
    soundEffects.playPaymentSuccessChime();
    soundEffects.announceText("Session checkout completed. Thank you!");
    setGamingStations((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: 'available',
              player: null,
              startTime: null,
              elapsedMin: 0,
            }
          : s
      )
    );
  };

  const filteredStations = gamingStations.filter(
    (s) => selectedStation === 'all' || s.type === selectedStation
  );

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">
              Multi-Gaming Arena & Sound Hub
            </h2>
            <Badge variant="amber" size="sm">PS5 + PICKLEBALL + VOICE</Badge>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Manage PlayStation 5 consoles, Pickleball courts, PWA Offline settings, and Audio Announcer
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={soundMuted ? 'outline' : 'primary'}
            onClick={toggleMute}
            leftIcon={soundMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            size="sm"
          >
            {soundMuted ? 'Audio Muted' : 'Audio Enabled'}
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              soundEffects.playTimerExpiryAlert();
              soundEffects.announceText("Test audio alert chime");
            }}
            size="sm"
          >
            Test Chime
          </Button>
        </div>
      </div>

      {/* Feature Showcase Grid: PWA Offline Status & Voice Announcer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PWA App Banner */}
        <Card className="p-4 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white flex flex-col justify-between border-none shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-neutral-950 flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                PWA READY
              </span>
            </div>
            <h3 className="text-base font-black">Install Mobile App (PWA)</h3>
            <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
              CueDesk can be added to your iPhone, iPad, or Android home screen with offline caching enabled.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-neutral-400 flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" /> Offline Cache Active
            </span>
            <button
              onClick={() => soundEffects.announceText("CueDesk App is installed and offline ready")}
              className="text-amber-400 font-bold hover:underline cursor-pointer"
            >
              Verify PWA
            </button>
          </div>
        </Card>

        {/* Audio Synthesizer & Voice Announcer */}
        <Card className="p-4 bg-white border-neutral-200/80 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                <Volume2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                SYNTHESIZER ACTIVE
              </span>
            </div>
            <h3 className="text-base font-black text-neutral-900">Voice Announcer & Audio</h3>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              Web Audio API plays cash chimes on checkout, timer expiry alerts, and clear voice announcements.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
            <button
              onClick={() => {
                soundEffects.playPaymentSuccessChime();
                soundEffects.announceText("Table 1 session closed. Payment received!");
              }}
              className="px-3 py-1.5 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Announce Payment
            </button>
            <button
              onClick={() => {
                soundEffects.playTimerExpiryAlert();
                soundEffects.announceText("Warning! Snooker Table 2 timer has expired!");
              }}
              className="px-3 py-1.5 bg-amber-50 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer"
            >
              Announce Expiry
            </button>
          </div>
        </Card>

        {/* Multi-Gaming Stats */}
        <Card className="p-4 bg-white border-neutral-200/80 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold bg-blue-100 text-blue-900 border border-blue-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                PS5 + COURTS
              </span>
            </div>
            <h3 className="text-base font-black text-neutral-900">Console & Court Capacity</h3>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              3 PlayStation 5 setups and 2 Pickleball Courts integrated into main billing & real-time dashboard.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs font-mono font-bold">
            <span className="text-emerald-600">3 Stations Occupied</span>
            <span className="text-neutral-500">2 Available</span>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {[
          { id: 'all', label: '🎮 All Gaming Stations' },
          { id: 'ps5', label: '🕹️ PlayStation 5 Consoles' },
          { id: 'pickleball', label: '🏓 Pickleball Courts' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedStation(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
              selectedStation === tab.id
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Gaming Stations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStations.map((station) => {
          const isOccupied = station.status === 'occupied';
          const estimatedCost = (station.elapsedMin / 60) * station.hourlyRate;

          return (
            <Card
              key={station.id}
              className={`p-5 flex flex-col justify-between border-2 transition-all ${
                isOccupied ? 'border-amber-400 bg-amber-50/20' : 'border-neutral-200 bg-white'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                      {station.type === 'ps5' ? '🕹️ PS5 CONSOLE' : '🏓 PICKLEBALL COURT'}
                    </span>
                    <h4 className="text-base font-black text-neutral-900">{station.name}</h4>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      isOccupied
                        ? 'bg-amber-400 text-neutral-950 animate-pulse'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}
                  >
                    {isOccupied ? 'LIVE GAMING' : 'AVAILABLE'}
                  </span>
                </div>

                <div className="space-y-2 my-4 bg-neutral-50 rounded-2xl p-3 border border-neutral-100 text-xs">
                  <div className="flex justify-between items-center text-neutral-600">
                    <span>Hourly Rate:</span>
                    <span className="font-mono font-bold text-neutral-900">₹{station.hourlyRate}/hr</span>
                  </div>
                  <div className="flex justify-between items-center text-neutral-600">
                    <span>Active Game / Event:</span>
                    <span className="font-bold text-amber-700">{station.gameTitle}</span>
                  </div>
                  {isOccupied && (
                    <>
                      <div className="flex justify-between items-center text-neutral-600">
                        <span>Current Player:</span>
                        <span className="font-extrabold text-neutral-900">{station.player}</span>
                      </div>
                      <div className="flex justify-between items-center text-neutral-600">
                        <span>Elapsed Time:</span>
                        <span className="font-mono font-bold text-neutral-900">{station.elapsedMin} mins</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-neutral-200 pt-2 text-neutral-900 font-extrabold">
                        <span>Current Bill:</span>
                        <span className="font-mono text-emerald-600 text-sm">₹{estimatedCost.toFixed(0)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                {isOccupied ? (
                  <button
                    onClick={() => handleStopGamingSession(station.id)}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Square className="w-4 h-4 fill-white" /> End & Checkout (₹{estimatedCost.toFixed(0)})
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartGamingSession(station.id)}
                    className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Play className="w-4 h-4 fill-white" /> Start Station Session
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
