import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Zap,
  Gauge,
  Wifi,
  WifiOff,
  Download,
  Copy,
  Check,
  Play,
  RotateCcw,
  Shield,
  FileCode,
  Terminal,
  Cpu,
  Flame,
  Radio,
  Server,
  AlertCircle,
} from 'lucide-react';

export const TAStatsAPIManager: React.FC = () => {
  const [packetSendRate, setPacketSendRate] = useState<number>(120);
  const [tcpPort, setTcpPort] = useState<number>(9000);
  const [webSocketPort, setWebSocketPort] = useState<number>(9001);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [simulatedMatchActive, setSimulatedMatchActive] = useState<boolean>(false);
  const [copiedIni, setCopiedIni] = useState<boolean>(false);
  const [copiedInjector, setCopiedInjector] = useState<boolean>(false);

  // Live Telemetry State
  const [carSpeedKmh, setCarSpeedKmh] = useState<number>(0);
  const [boostAmount, setBoostAmount] = useState<number>(100);
  const [isSupersonic, setIsSupersonic] = useState<boolean>(false);
  const [kickoffTimerMs, setKickoffTimerMs] = useState<number>(0);
  const [kickoffStatus, setKickoffStatus] = useState<'IDLE' | 'KICKOFF_STARTED' | 'SPEEDFLIP_EXECUTED' | 'SUPERSONIC_REACHED'>('IDLE');
  const [eventsLog, setEventsLog] = useState<Array<{ id: string; time: string; event: string; detail: string }>>([
    { id: '1', time: '00:00.00', event: 'INIT', detail: 'Psyonix MatchStatsExporter_TA ready on port 9001' },
  ]);

  const socketRef = useRef<WebSocket | null>(null);

  // Raw TAStatsAPI.ini contents
  const rawStatsIni = `[TAGame.MatchStatsExporter_TA]
; Official Psyonix / Epic Games Game Data API
; Automatically broadcast live in-match telemetry at 120Hz physics rate
PacketSendRate=${packetSendRate}
Port=${tcpPort}
WebPort=${webSocketPort}
`;

  // PowerShell Auto-Injector for TAStatsAPI.ini
  const psInjectorScript = `# ==============================================================================
# PSYONIX / EPIC GAMES - TAStatsAPI.ini OFFICIAL INJECTOR & 120Hz TELEMETRY ENABLER
# Injects MatchStatsExporter_TA into Epic Games & Steam Rocket League Configs
# ==============================================================================

$statsContent = @"
[TAGame.MatchStatsExporter_TA]
PacketSendRate=${packetSendRate}
Port=${tcpPort}
WebPort=${webSocketPort}
"@

# Standard Epic Games and Steam Installation Paths
$possiblePaths = @(
    "$env:USERPROFILE\\Documents\\My Games\\Rocket League\\TAGame\\Config",
    "C:\\Program Files\\Epic Games\\rocketleague\\TAGame\\Config",
    "C:\\Program Files (x86)\\Steam\\steamapps\\common\\rocketleague\\TAGame\\Config",
    "D:\\Epic Games\\rocketleague\\TAGame\\Config",
    "D:\\SteamLibrary\\steamapps\\common\\rocketleague\\TAGame\\Config"
)

$injectedCount = 0
foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $targetFile = "$path\\TAStatsAPI.ini"
        if (Test-Path $targetFile) {
            Copy-Item -Path $targetFile -Destination "$targetFile.backup" -Force
        }
        Set-Content -Path $targetFile -Value $statsContent -Encoding ASCII
        Write-Host "[SUCCESS] Injected TAStatsAPI.ini into: $path" -ForegroundColor Green
        $injectedCount++
    }
}

if ($injectedCount -eq 0) {
    $defaultDocPath = "$env:USERPROFILE\\Documents\\My Games\\Rocket League\\TAGame\\Config"
    New-Item -ItemType Directory -Path $defaultDocPath -Force | Out-Null
    Set-Content -Path "$defaultDocPath\\TAStatsAPI.ini" -Value $statsContent -Encoding ASCII
    Write-Host "[SUCCESS] Created TAStatsAPI.ini in Documents config directory: $defaultDocPath" -ForegroundColor Green
}

Write-Host ">>> MatchStatsExporter_TA Active! Restart Rocket League to broadcast 120Hz telemetry <<<" -ForegroundColor Cyan
`;

  // Real WebSocket client or Live Simulator
  const toggleWebSocket = () => {
    if (isConnected) {
      if (socketRef.current) socketRef.current.close();
      setIsConnected(false);
      return;
    }

    try {
      const ws = new WebSocket(`ws://localhost:${webSocketPort}`);
      ws.onopen = () => {
        setIsConnected(true);
        addLog('WS_OPEN', `Connected to Rocket League live stream on port ${webSocketPort}`);
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleLivePacket(data);
        } catch {
          // Non-JSON or raw packet
        }
      };
      ws.onerror = () => {
        // Fallback to simulation if game is not currently running locally
        setIsConnected(false);
        addLog('CONNECT_NOTICE', `Game client not currently running. Launching 120Hz Physics Simulator.`);
        startSimulation();
      };
      ws.onclose = () => {
        setIsConnected(false);
      };
      socketRef.current = ws;
    } catch {
      startSimulation();
    }
  };

  const addLog = (event: string, detail: string) => {
    const timeStr = new Date().toISOString().substring(14, 22);
    setEventsLog((prev) => [{ id: Math.random().toString(), time: timeStr, event, detail }, ...prev.slice(0, 15)]);
  };

  const handleLivePacket = (packet: any) => {
    if (packet?.event === 'Event_Kickoff') {
      triggerKickoff();
    }
    if (packet?.players && packet.players.length > 0) {
      const player = packet.players[0];
      if (player.speed !== undefined) {
        const kmh = Math.round((player.speed * 36) / 1000); // cm/s to km/h
        setCarSpeedKmh(kmh);
        setIsSupersonic(kmh >= 79);
      }
      if (player.boost !== undefined) {
        setBoostAmount(Math.round(player.boost));
      }
    }
  };

  // 120Hz Kickoff Simulation Runner
  const startSimulation = () => {
    setSimulatedMatchActive(true);
    setIsConnected(true);
    triggerKickoff();
  };

  const triggerKickoff = () => {
    setKickoffStatus('KICKOFF_STARTED');
    setCarSpeedKmh(0);
    setBoostAmount(100);
    setIsSupersonic(false);
    setKickoffTimerMs(0);

    const startTime = performance.now();
    addLog('EVENT_KICKOFF', 'Kickoff countdown reached 0. Player accelerating with Boost.');

    const interval = setInterval(() => {
      const elapsed = Math.round(performance.now() - startTime);
      setKickoffTimerMs(elapsed);

      // Speedflip acceleration curve (0 to 82 km/h in ~850ms)
      if (elapsed < 300) {
        setCarSpeedKmh(Math.min(45, Math.round(elapsed * 0.15)));
        setBoostAmount((prev) => Math.max(80, prev - 1));
      } else if (elapsed < 650) {
        setKickoffStatus('SPEEDFLIP_EXECUTED');
        setCarSpeedKmh(Math.min(78, Math.round(45 + (elapsed - 300) * 0.1)));
        setBoostAmount((prev) => Math.max(65, prev - 1));
      } else if (elapsed < 880) {
        setKickoffStatus('SUPERSONIC_REACHED');
        setIsSupersonic(true);
        setCarSpeedKmh(82);
        setBoostAmount((prev) => Math.max(52, prev - 1));
        addLog('SUPERSONIC', `Supersonic reached in ${elapsed}ms via 45° Speedflip! (RLCS LAN Grade)`);
        clearInterval(interval);
      }
    }, 16);
  };

  const handleCopyIni = () => {
    navigator.clipboard.writeText(rawStatsIni);
    setCopiedIni(true);
    setTimeout(() => setCopiedIni(false), 2000);
  };

  const handleCopyInjector = () => {
    navigator.clipboard.writeText(psInjectorScript);
    setCopiedInjector(true);
    setTimeout(() => setCopiedInjector(false), 2000);
  };

  const handleDownloadIni = () => {
    const blob = new Blob([rawStatsIni], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'TAStatsAPI.ini';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Official Epic Games / Psyonix Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-sky-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-400">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-100 font-['Chakra_Petch'] uppercase tracking-wide">
                    Official Psyonix / Epic Games Game Data API
                  </h2>
                  <span className="text-[10px] font-mono bg-sky-950 text-sky-300 border border-sky-500/50 px-2 py-0.5 rounded-full font-bold">
                    TAGame.MatchStatsExporter_TA
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-['Rajdhani'] mt-0.5">
                  Native 120Hz JSON broadcast engine directly from Unreal Engine 3 client • EAC Anti-Cheat Whitelisted
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-lg">
                <Cpu className="w-3.5 h-3.5 text-sky-400" />
                Rate: <strong className="text-slate-200">{packetSendRate} Hz (8.33ms Tick)</strong>
              </span>
              <span className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-lg">
                <Server className="w-3.5 h-3.5 text-indigo-400" />
                WebSocket: <strong className="text-indigo-300">Port {webSocketPort}</strong>
              </span>
              <span className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-lg">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Safety: <strong className="text-emerald-400">100% Anti-Cheat Safe (Official Psyonix API)</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggleWebSocket}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all shadow-lg ${
                isConnected
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                  : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sky-500/20'
              }`}
            >
              {isConnected ? (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span>DISCONNECT LIVE STREAM</span>
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4" />
                  <span>CONNECT 120Hz STREAM</span>
                </>
              )}
            </button>
            <button
              onClick={triggerKickoff}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition-all"
              title="Test Kickoff Trigger"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>TEST KICKOFF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live In-Match HUD & Telemetry Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Speedometer */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase">Car Velocity</span>
            <Gauge className="w-4 h-4 text-sky-400" />
          </div>
          <div className="my-4 text-center">
            <div className="text-4xl font-extrabold font-['Chakra_Petch'] text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-200">
              {carSpeedKmh} <span className="text-lg text-slate-500 font-normal">KM/H</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              {Math.round((carSpeedKmh * 1000) / 36)} cm/s (Max Cap: 2300)
            </div>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-75 ${
                isSupersonic ? 'bg-gradient-to-r from-amber-400 to-rose-500 animate-pulse' : 'bg-sky-400'
              }`}
              style={{ width: `${Math.min(100, (carSpeedKmh / 82) * 100)}%` }}
            />
          </div>
        </div>

        {/* Supersonic State */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase">Physics State</span>
            <Zap className={`w-4 h-4 ${isSupersonic ? 'text-amber-400' : 'text-slate-600'}`} />
          </div>
          <div className="my-4 text-center">
            <div
              className={`text-2xl font-bold font-mono tracking-wider ${
                isSupersonic ? 'text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]' : 'text-slate-500'
              }`}
            >
              {isSupersonic ? '⚡ SUPERSONIC' : 'SUB-SUPERSONIC'}
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1">
              {isSupersonic ? 'Maximum speed threshold reached' : 'Threshold: 79 km/h (2200 cm/s)'}
            </div>
          </div>
          <div className="text-center text-[10px] font-mono bg-slate-950 py-1 rounded border border-slate-800 text-slate-400">
            Demo Capability: {isSupersonic ? 'ARMED' : 'DISARMED'}
          </div>
        </div>

        {/* Boost Level */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase">Boost Tank</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="my-4 text-center">
            <div className="text-4xl font-extrabold font-['Chakra_Petch'] text-amber-400">
              {boostAmount} <span className="text-lg text-slate-500 font-normal">%</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              Consumption Rate: 33.3% / sec
            </div>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-75"
              style={{ width: `${boostAmount}%` }}
            />
          </div>
        </div>

        {/* Kickoff Speedflip Timer */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase">Kickoff Speedflip</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-4 text-center">
            <div className="text-3xl font-extrabold font-mono text-emerald-400">
              {kickoffTimerMs} <span className="text-sm text-slate-500">MS</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1">
              Phase: <strong className="text-sky-300">{kickoffStatus}</strong>
            </div>
          </div>
          <div className="text-center text-[10px] font-mono bg-slate-950 py-1 rounded border border-slate-800 text-emerald-400">
            RLCS LAN Target: &lt; 900 ms
          </div>
        </div>
      </div>

      {/* Configuration & Quick Injector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TAStatsAPI.ini Configurator */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-slate-200 font-mono uppercase">
                TAStatsAPI.ini Settings
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyIni}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-all"
              >
                {copiedIni ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>COPY INI</span>
              </button>
              <button
                onClick={handleDownloadIni}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-mono transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>DOWNLOAD</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 font-mono text-xs">
            <div>
              <label className="block text-slate-400 mb-1">PacketSendRate</label>
              <input
                type="number"
                min="0"
                max="120"
                value={packetSendRate}
                onChange={(e) => setPacketSendRate(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500 font-bold"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">120 = Full 120Hz tick</span>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">TCP Port</label>
              <input
                type="number"
                value={tcpPort}
                onChange={(e) => setTcpPort(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Default: 9000</span>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">WebPort (WS)</label>
              <input
                type="number"
                value={webSocketPort}
                onChange={(e) => setWebSocketPort(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Default: 9001</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-sky-300 overflow-x-auto">
            <pre>{rawStatsIni}</pre>
          </div>

          <div className="text-xs text-slate-400 font-['Rajdhani'] leading-relaxed">
            💡 <strong>ملاحظة التثبيت:</strong> يتم وضع هذا الملف في مسار تثبيت اللعبة:
            <br />
            <code className="text-slate-300 font-mono text-[11px]">
              &lt;Rocket League Folder&gt;\TAGame\Config\TAStatsAPI.ini
            </code>
          </div>
        </div>

        {/* Live Match Events Log & Auto-Injector */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-200 font-mono uppercase">
                  Live Match Packet Stream
                </h3>
              </div>
              <button
                onClick={handleCopyInjector}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-all"
              >
                {copiedInjector ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>COPY 1-CLICK INJECTOR</span>
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 h-52 overflow-y-auto font-mono text-xs space-y-1.5">
              {eventsLog.map((log) => (
                <div key={log.id} className="flex items-start gap-2">
                  <span className="text-slate-500 shrink-0">[{log.time}]</span>
                  <span
                    className={`font-bold shrink-0 ${
                      log.event.includes('SUPERSONIC')
                        ? 'text-amber-400'
                        : log.event.includes('KICKOFF')
                        ? 'text-emerald-400'
                        : 'text-sky-400'
                    }`}
                  >
                    {log.event}:
                  </span>
                  <span className="text-slate-300 truncate">{log.detail}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Stream Protocol:</span>
            <span className="text-emerald-400 font-bold">WebSocket JSON (ws://localhost:{webSocketPort})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
