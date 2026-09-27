import React, { useState, useEffect, useRef } from 'react';
import { Zap, Activity, Clock, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { MacroConfig } from '../types';

interface LatencyLabProps {
  config: MacroConfig;
  onUpdateConfig: (newConfig: MacroConfig) => void;
}

export const LatencyLab: React.FC<LatencyLabProps> = ({ config, onUpdateConfig }) => {
  // Key press tester state
  const [testLog, setTestLog] = useState<Array<{ key: string; durationMs: number; intervalMs?: number; timestamp: string }>>([]);
  const [activeTestKey, setActiveTestKey] = useState<string | null>(null);
  const pressStartRef = useRef<number | null>(null);
  const lastReleaseRef = useRef<number | null>(null);
  const curveCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Key event listeners for the test zone
  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault();
    if (activeTestKey === e.key) return; // prevent key repeat
    setActiveTestKey(e.key);
    pressStartRef.current = performance.now();
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    e.preventDefault();
    if (pressStartRef.current !== null) {
      const now = performance.now();
      const duration = now - pressStartRef.current;
      let interval: number | undefined = undefined;

      if (lastReleaseRef.current !== null) {
        interval = pressStartRef.current - lastReleaseRef.current;
      }
      lastReleaseRef.current = now;

      setTestLog((prev) => [
        {
          key: e.key,
          durationMs: Math.round(duration),
          intervalMs: interval ? Math.round(interval) : undefined,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 9),
      ]);

      setActiveTestKey(null);
      pressStartRef.current = null;
    }
  };

  // Render Sensitivity Curve Chart on canvas
  useEffect(() => {
    const canvas = curveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Center axes
    const centerX = width / 2;
    const centerY = height / 2;

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // Deadzone shaded band around center
    const deadzonePixelWidth = (config.internalDeadzone * (width / 2));
    ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
    ctx.fillRect(centerX - deadzonePixelWidth, 0, deadzonePixelWidth * 2, height);

    // Draw deadzone label
    ctx.fillStyle = '#f87171';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText(`INTERNAL DEADZONE (${config.internalDeadzone.toFixed(2)})`, centerX - 75, 20);

    // Plot ApplyProfessionalCurve (Smooth Continuous Re-scaled Model)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    for (let px = 0; px < width; px++) {
      const normalizedInput = (px - centerX) / (width / 2); // -1 to +1
      let output = 0;

      if (Math.abs(normalizedInput) > config.internalDeadzone) {
        const sign = normalizedInput > 0 ? 1 : -1;
        // Continuous range re-scaling:
        const activeRange = (Math.abs(normalizedInput) - config.internalDeadzone) / (1.0 - config.internalDeadzone);
        const curved = Math.pow(activeRange, config.curveExponent);
        output = curved * sign * config.aerialSense;
      }

      // Convert output to canvas Y
      const py = centerY - output * (height / 2.6);
      if (px === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // Plot Linear Reference curve (y = x) for comparison
    ctx.strokeStyle = '#475569';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, 0);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [config.internalDeadzone, config.curveExponent, config.aerialSense]);

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            <h2 className="font-['Chakra_Petch'] font-bold text-lg text-slate-100 uppercase">
              Sensitivity & Latency Diagnostic Lab
            </h2>
            <span className="text-[10px] font-mono bg-amber-950 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded">
              Sub-Millisecond Benchmarking
            </span>
          </div>
          <p className="text-xs text-slate-400 font-['Rajdhani'] mt-1">
            Analyze the mathematical response curve of <code className="text-cyan-400 font-mono">ApplyProfessionalCurve()</code> and benchmark your manual jump cancel speeds against RLCS pro macro standards.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Mathematical Curve Graph (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-['Chakra_Petch'] font-bold text-sm text-slate-200 uppercase flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              Non-Linear Sensitivity Response Curve
            </h3>
            <span className="text-xs font-mono text-cyan-400">
              Formula: y = (x/127)^{config.curveExponent.toFixed(2)} * multiplier
            </span>
          </div>

          <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 relative">
            <canvas ref={curveCanvasRef} width={600} height={260} className="w-full h-56 object-contain" />
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-2 px-1">
              <span>-127 (Max Negative)</span>
              <span>0 (Stick Center)</span>
              <span>+127 (Max Positive)</span>
            </div>
          </div>

          {/* Interactive Curve Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Curve Exponent:</span>
                <span className="text-cyan-400">{config.curveExponent.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={1.0}
                max={2.2}
                step={0.05}
                value={config.curveExponent}
                onChange={(e) => onUpdateConfig({ ...config, curveExponent: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded accent-cyan-400 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500 font-['Rajdhani']">
                Higher exponent grants micro-precision near center, rapidly ramping to max turn rate.
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Aerial Multiplier:</span>
                <span className="text-cyan-400">{config.aerialSense.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={1.0}
                max={2.5}
                step={0.05}
                value={config.aerialSense}
                onChange={(e) => onUpdateConfig({ ...config, aerialSense: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded accent-cyan-400 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500 font-['Rajdhani']">
                Amplifies max deflection output for lightning fast 540° tornado spins.
              </p>
            </div>
          </div>

          {/* Upgraded Deadzone & Dodge Zone Comparison */}
          <div className="border-t border-slate-800 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-cyan-400 font-bold font-mono">
                <span>INTERNAL DEADZONE</span>
                <span className="text-emerald-400">{config.internalDeadzone.toFixed(2)} (5%)</span>
              </div>
              <p className="text-[11px] text-slate-400 font-['Rajdhani'] leading-relaxed">
                Filters hardware sensor jitter & micro-vibrations. Output starts smoothly at 0.00 immediately past the 0.05 threshold without abrupt 5% step discontinuities.
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-amber-400 font-bold font-mono">
                <span>DODGE DEADZONE</span>
                <span className="text-emerald-400">{config.dodgeDeadzone.toFixed(2)} (5%)</span>
              </div>
              <p className="text-[11px] text-slate-400 font-['Rajdhani'] leading-relaxed">
                The minimum stick/input deflection required on Jump 2 to initiate a flip. At 0.05, diagonal speedflips flip instantly with zero delay or failed double jumps.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Real-time Keyboard Reaction Tester (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-['Chakra_Petch'] font-bold text-sm text-slate-200 uppercase flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Manual Timing & Hold Tester
            </h3>
            <button
              onClick={() => setTestLog([])}
              className="text-xs text-slate-400 hover:text-slate-200 p-1 rounded"
              title="Clear test log"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Interactive Keypad Trap */}
          <div
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            className={`h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
              activeTestKey
                ? 'bg-cyan-500/10 border-cyan-400 shadow-inner'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            {activeTestKey ? (
              <div className="text-center animate-pulse">
                <span className="text-2xl font-mono font-bold text-cyan-400 uppercase">
                  {activeTestKey}
                </span>
                <p className="text-[11px] font-mono text-cyan-300 mt-1">HOLDING...</p>
              </div>
            ) : (
              <div className="text-center p-3">
                <p className="text-xs font-['Rajdhani'] font-semibold text-slate-300">
                  Click here and tap/double-tap any key (Space, W, S, A, D)
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-1">
                  Target speedflip hold: <span className="text-emerald-400 font-bold">30ms</span>
                </p>
              </div>
            )}
          </div>

          {/* Recent Keystroke Telemetry Log */}
          <div className="space-y-1.5">
            <span className="text-xs font-mono text-slate-400">Live Reaction Telemetry:</span>
            <div className="space-y-1 max-h-44 overflow-y-auto font-mono text-xs">
              {testLog.length === 0 ? (
                <p className="text-[11px] text-slate-500 text-center py-4">No key events logged yet.</p>
              ) : (
                testLog.map((log, index) => {
                  const isPerfect = log.durationMs <= 40;
                  const isLate = log.durationMs > 70;
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 uppercase font-bold">
                          {log.key === ' ' ? 'SPACE' : log.key}
                        </span>
                        <span className="text-slate-400">
                          Hold: <strong className={isPerfect ? 'text-emerald-400' : isLate ? 'text-rose-400' : 'text-amber-400'}>{log.durationMs}ms</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {log.intervalMs && (
                          <span className="text-slate-500">
                            Gap: {log.intervalMs}ms
                          </span>
                        )}
                        <span className={`text-[10px] px-1 py-0.2 rounded ${
                          isPerfect ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-slate-900 text-slate-400'
                        }`}>
                          {isPerfect ? 'PRO' : isLate ? 'SLOW' : 'GOOD'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
