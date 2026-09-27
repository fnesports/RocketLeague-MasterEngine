import React from 'react';
import { Flame, Zap, Shield, FileCode, Sliders, Terminal, Cpu, Sparkles, Volume2, VolumeX, Download, Cloud, Radio } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  scriptEnabled: boolean;
  setScriptEnabled: (enabled: boolean) => void;
  activePreset: string;
  onSelectPreset: (presetName: string) => void;
  audioDrillActive: boolean;
  setAudioDrillActive: (active: boolean) => void;
  onExportAll: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  scriptEnabled,
  setScriptEnabled,
  activePreset,
  onSelectPreset,
  audioDrillActive,
  setAudioDrillActive,
  onExportAll,
}) => {
  const tabs = [
    { id: 'desktop', label: 'Windows GUI Form', icon: Cpu, badge: 'ويندوز فورم' },
    { id: 'tastats', label: 'Psyonix TAStatsAPI', icon: Radio, badge: 'Official API' },
    { id: 'cloud', label: 'Google Cloud Hub', icon: Cloud, badge: 'Firestore' },
    { id: 'simulator', label: 'Mechanics Simulator', icon: Flame, badge: '120Hz' },
    { id: 'lua', label: 'Logitech Lua Engine', icon: FileCode, badge: 'G-Hub' },
    { id: 'powershell', label: 'PowerShell Win32 Hooks', icon: Terminal, badge: 'C# Raw' },
    { id: 'tainput', label: 'TAInput.ini Studio', icon: Sliders, badge: 'In-Game' },
    { id: 'latency', label: 'Curve & Latency Lab', icon: Zap, badge: 'Math' },
    { id: 'coach', label: 'AI Mechanics Coach', icon: Sparkles, badge: 'Gemini' },
  ];

  return (
    <header className="border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950 shadow-xl shadow-cyan-500/25 border-2 border-cyan-400 select-none group">
            <span className="font-['Chakra_Petch'] font-black text-xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-200 to-amber-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
              FN
            </span>
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-wider font-['Chakra_Petch'] uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-amber-300">
                FN Master-Engine
              </h1>
              <span className="px-1.5 py-0.5 text-[10px] font-mono tracking-widest uppercase bg-cyan-950 text-cyan-300 border border-cyan-500/50 rounded font-bold">
                FN PRO v4.0.2
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase bg-amber-950/70 text-amber-300 border border-amber-500/40 rounded">
                DZ: 0.05 / 0.05
              </span>
            </div>
            <p className="text-xs text-slate-400 font-['Rajdhani'] font-medium">
              FN Pro Rocket League Input Engine • Logitech G-Hub • Standalone EXE • TAInput.ini • 120Hz Speedflips
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Preset Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs">
            <span className="text-slate-400 font-medium">Preset:</span>
            <select
              value={activePreset}
              onChange={(e) => onSelectPreset(e.target.value)}
              className="bg-transparent text-cyan-300 font-mono text-xs focus:outline-none cursor-pointer"
            >
              <option value="v402" className="bg-slate-900 text-slate-200">RL Master-Engine v4.0.2 (Default)</option>
              <option value="kickoff" className="bg-slate-900 text-slate-200">Kickoff Demon (30ms Flip-Cancel)</option>
              <option value="aerial" className="bg-slate-900 text-slate-200">Freestyle & Aerial Ascender</option>
              <option value="chaindash" className="bg-slate-900 text-slate-200">Infinite Wall Chain-Dasher</option>
              <option value="comp240" className="bg-slate-900 text-slate-200">240Hz Low-Latency Ultra</option>
            </select>
          </div>

          {/* Engine Master Toggle */}
          <button
            onClick={() => setScriptEnabled(!scriptEnabled)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border ${
              scriptEnabled
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-sm shadow-emerald-500/20'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-400'
            }`}
            title="Toggle Engine Active State (Same as Middle Mouse Button in Logitech Lua)"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>ENGINE: {scriptEnabled ? 'ONLINE' : 'BYPASS'}</span>
          </button>

          {/* Audio Drill Cue Metronome Button */}
          <button
            onClick={() => setAudioDrillActive(!audioDrillActive)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all border ${
              audioDrillActive
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-850 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Audio Drill Cadence: Plays voice & sound metronome cues for jump cancel timing drills"
          >
            {audioDrillActive ? <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-bounce" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">VOICE DRILLS</span>
          </button>

          {/* Export Bundle */}
          <button
            onClick={onExportAll}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-mono transition-all"
            title="Export all scripts (Lua, PowerShell, TAInput.ini) in one click"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ZIP / EXPORT</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto no-scrollbar py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-['Rajdhani'] font-semibold tracking-wide whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-sm shadow-cyan-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              <span className={`text-[10px] font-mono px-1 py-0.2 rounded border ${
                isActive
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
