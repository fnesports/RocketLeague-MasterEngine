import React, { useState } from 'react';
import { Sliders, Download, Copy, Check, Search, FileText, Folder, AlertCircle, RefreshCw } from 'lucide-react';
import { RAW_TAINPUT_INI } from '../data/defaultConfig';

interface BindingRow {
  action: string;
  category: 'Movement' | 'Aerial & Ball' | 'Mechanics' | 'Camera & Interface';
  key: string;
  defaultKey: string;
  description: string;
}

export const TAInputManager: React.FC = () => {
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedPath, setCopiedPath] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [rawView, setRawView] = useState<boolean>(false);

  // Keybindings matching user's custom TAInput.ini
  const [bindings, setBindings] = useState<BindingRow[]>([
    { action: 'Boost', category: 'Mechanics', key: 'LeftMouseButton', defaultKey: 'LeftShift', description: 'Rocket boost burn (Signature KBM mouse bind)' },
    { action: 'Jump', category: 'Mechanics', key: 'RightMouseButton', defaultKey: 'Spacebar', description: 'Jump and dodge execution' },
    { action: 'Handbrake / Powerslide', category: 'Mechanics', key: 'LeftShift', defaultKey: 'RightMouseButton', description: 'Surface drift and landing velocity alignment' },
    { action: 'SecondaryCamera (Ball Cam)', category: 'Camera & Interface', key: 'Spacebar', defaultKey: 'MiddleMouseButton', description: 'Toggle Ball Cam lock' },
    { action: 'ThrottleForward', category: 'Movement', key: 'W', defaultKey: 'W', description: 'Drive forward / Pitch down in air' },
    { action: 'ThrottleReverse', category: 'Movement', key: 'S', defaultKey: 'S', description: 'Brake, reverse / Pitch up in air' },
    { action: 'SteerLeft / YawLeft', category: 'Movement', key: 'A', defaultKey: 'A', description: 'Ground steer left / Aerial yaw left' },
    { action: 'SteerRight / YawRight', category: 'Movement', key: 'D', defaultKey: 'D', description: 'Ground steer right / Aerial yaw right' },
    { action: 'RollLeft (Directional)', category: 'Aerial & Ball', key: 'Q', defaultKey: 'Q', description: 'Directional air roll left for speedflips' },
    { action: 'RollRight (Directional)', category: 'Aerial & Ball', key: 'E', defaultKey: 'E', description: 'Directional air roll right for speedflips' },
    { action: 'ToggleRoll (Free Roll)', category: 'Aerial & Ball', key: 'LeftShift', defaultKey: 'RightMouseButton', description: 'Free air roll modifier with steering axis' },
    { action: 'RearCamera', category: 'Camera & Interface', key: 'MiddleMouseButton', defaultKey: 'LeftControl', description: 'Look behind the vehicle' },
    { action: 'FastFreeplay', category: 'Camera & Interface', key: 'LeftShift', defaultKey: 'LeftControl', description: 'Instant freeplay training reset' },
    { action: 'ToggleScoreboard', category: 'Camera & Interface', key: 'Tab', defaultKey: 'Tab', description: 'Match statistics scoreboard' },
  ]);

  // Core settings from [Engine.PlayerInput] and [TAGame.PlayerInput_TA]
  const [settings, setSettings] = useState({
    mouseSensitivity: 60.0,
    doubleClickTime: 0.25,
    enableMouseSmoothing: false,
    moveForwardSpeed: 1200,
    moveStrafeSpeed: 1200,
    keyboardAxisBlendTime: 0,
    gamepadDeadzone: 0.3,
    gamepadLookScale: 20,
  });

  const configPath = `%USERPROFILE%\\Documents\\My Games\\Rocket League\\TAGame\\Config\\TAInput.ini`;

  // Generate complete INI string
  const generateFullIni = () => {
    return `[Engine.PlayerInput]
MoveForwardSpeed=${settings.moveForwardSpeed}
MoveStrafeSpeed=${settings.moveStrafeSpeed}
LookRightScale=300
LookUpScale=-250
MouseSensitivity=${settings.mouseSensitivity.toFixed(1)}
DoubleClickTime=${settings.doubleClickTime.toFixed(6)}
bEnableMouseSmoothing=${settings.enableMouseSmoothing}

[ProjectX.ControlPreset_X]
${bindings
  .map((b) => `PCBindings=( Action="${b.action.split(' ')[0]}", Key="${b.key}" )`)
  .join('\n')}

[TAGame.PlayerInput_TA]
MouseSensitivity=10
TapTime=0.5
DoubleTapTime=${settings.doubleClickTime.toFixed(2)}
GamepadDeadzone=${settings.gamepadDeadzone}
GamepadFreeLookDeadzone=0.1
GamepadLookScale=${settings.gamepadLookScale}
KeyboardAxisBlendTime=${settings.keyboardAxisBlendTime}
`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateFullIni());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPath = () => {
    navigator.clipboard.writeText(configPath);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generateFullIni()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'TAInput.ini';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredBindings = bindings.filter((b) => {
    const matchesCat = activeCategory === 'All' || b.category === activeCategory;
    const matchesQuery =
      b.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-400" />
            <h2 className="font-['Chakra_Petch'] font-bold text-lg text-slate-100 uppercase">
              Rocket League TAInput.ini Manager
            </h2>
            <span className="text-[10px] font-mono bg-sky-950 text-sky-400 border border-sky-500/40 px-2 py-0.5 rounded">
              Raw Input Sync
            </span>
          </div>
          <p className="text-xs text-slate-400 font-['Rajdhani'] mt-1">
            Directly configure your internal Rocket League Unreal Engine input file. Disables mouse smoothing, locks keyboard blend time to 0, and binds Left Click Boost + Right Click Jump.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setRawView(!rawView)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
          >
            <FileText className="w-4 h-4 text-sky-400" />
            <span>{rawView ? 'VISUAL EDITOR' : 'RAW INI CODE'}</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-bold transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-sky-400" />}
            <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY INI'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-mono font-bold transition-all shadow-md shadow-sky-500/20"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD TAINPUT.INI</span>
          </button>
        </div>
      </div>

      {/* Directory Location Banner with Quick Copy */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300">
          <Folder className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-slate-400">Install Path:</span>
          <span className="text-cyan-300 font-semibold break-all">{configPath}</span>
        </div>
        <button
          onClick={handleCopyPath}
          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
        >
          {copiedPath ? 'Path Copied!' : 'Copy Path'}
        </button>
      </div>

      {/* Raw INI View */}
      {rawView ? (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>TAInput.ini (Preview)</span>
            <span className="text-sky-400">Ready to replace in Config directory</span>
          </div>
          <div className="p-4 max-h-[500px] overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre leading-relaxed">
            {generateFullIni()}
          </div>
        </div>
      ) : (
        /* Visual Interactive Binding Manager */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Core Engine Settings (4 cols) */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
            <h3 className="font-['Chakra_Petch'] font-bold text-sm text-slate-200 uppercase flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-400" />
              Engine Input Settings
            </h3>

            <div className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Mouse Sensitivity:</span>
                  <span className="text-sky-400">{settings.mouseSensitivity.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={120}
                  step={5}
                  value={settings.mouseSensitivity}
                  onChange={(e) => setSettings({ ...settings, mouseSensitivity: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded accent-sky-400 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Keyboard Axis Blend Time:</span>
                  <span className="text-sky-400">{settings.keyboardAxisBlendTime}s (Instant)</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={0.2}
                  step={0.02}
                  value={settings.keyboardAxisBlendTime}
                  onChange={(e) => setSettings({ ...settings, keyboardAxisBlendTime: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded accent-sky-400 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 font-['Rajdhani']">
                  Set to 0.00 for pro KBM players to eliminate digital key transition delay.
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Double Tap Time:</span>
                  <span className="text-sky-400">{settings.doubleClickTime.toFixed(2)}s</span>
                </div>
                <input
                  type="range"
                  min={0.15}
                  max={0.4}
                  step={0.01}
                  value={settings.doubleClickTime}
                  onChange={(e) => setSettings({ ...settings, doubleClickTime: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded accent-sky-400 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-300">Disable Mouse Smoothing:</span>
                <span className="text-emerald-400 font-bold">TRUE (Active)</span>
              </div>
            </div>
          </div>

          {/* Right Column: Binding Matrix (8 cols) */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search key or action (e.g. Boost, Jump, Camera)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Category Pills */}
              <div className="flex gap-1 text-[11px] font-mono">
                {['All', 'Mechanics', 'Movement', 'Aerial & Ball', 'Camera & Interface'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      activeCategory === cat
                        ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Bindings Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Active Key Binding</th>
                    <th className="py-2.5 px-3 hidden sm:table-cell">Default Key</th>
                    <th className="py-2.5 px-3 hidden md:table-cell">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {filteredBindings.map((b, i) => (
                    <tr key={i} className="hover:bg-slate-850/80 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-100">
                        {b.action}
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={b.key}
                          onChange={(e) => {
                            const newKey = e.target.value;
                            setBindings(bindings.map((item) => (item.action === b.action ? { ...item, key: newKey } : item)));
                          }}
                          className="bg-slate-950 border border-slate-700/80 rounded px-2 py-1 text-cyan-300 font-bold text-xs focus:outline-none focus:border-cyan-400 w-36"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 hidden sm:table-cell">
                        {b.defaultKey}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px] font-['Rajdhani'] hidden md:table-cell">
                        {b.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
