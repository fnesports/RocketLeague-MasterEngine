import React, { useState } from 'react';
import { Terminal, Copy, Download, Check, ShieldCheck, Zap, AlertTriangle, Layers, Info } from 'lucide-react';
import { RAW_POWERSHELL_TEMPLATES } from '../data/defaultConfig';

export const PowerShellManager: React.FC = () => {
  const [activeHook, setActiveHook] = useState<'all' | 'deadzoneTuner' | 'fastAerial' | 'leftSpeedflip' | 'rightSpeedflip' | 'forwardSpeedflip'>('all');
  const [copied, setCopied] = useState<boolean>(false);

  // Generate unified master script
  const unifiedMasterScript = `# ==============================================================================
# ROCKET LEAGUE MASTER-ENGINE: UNIFIED WIN32 LOW-LEVEL HOOK ENGINE
# Binds: [W] Forward Speedflip | [A] Left Speedflip | [D] Right Speedflip | [S] Fast Aerial
# Uses: user32.dll SetWindowsHookEx (WH_KEYBOARD_LL = 13), SendInput, and LLKHF_INJECTED
# 100% Pure Win32 - Zero System.Windows.Forms dependency (Works on all PowerShell versions)
# ==============================================================================

$source = @"
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading;

public class RLMasterHookEngine {
    private const int WH_KEYBOARD_LL = 13;
    private const int WM_KEYDOWN = 0x0100;
    private const int LLKHF_INJECTED = 0x0010;

    private static HookProc _proc = HookCallback;
    private static IntPtr _hookID = IntPtr.Zero;
    private static bool _isRunning = false;

    [StructLayout(LayoutKind.Sequential)]
    private struct KBDLLHOOKSTRUCT {
        public uint vkCode;
        public uint scanCode;
        public uint flags;
        public uint time;
        public IntPtr dwExtraInfo;
    }

    [StructLayout(LayoutKind.Sequential)]
    struct INPUT {
        public uint type;
        public KEYBDINPUT ki;
    }

    [StructLayout(LayoutKind.Sequential)]
    struct KEYBDINPUT {
        public ushort wVk;
        public ushort wScan;
        public uint dwFlags;
        public uint time;
        public IntPtr dwExtraInfo;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct MSG {
        public IntPtr hwnd;
        public uint message;
        public IntPtr wParam;
        public IntPtr lParam;
        public uint time;
        public int pt_x;
        public int pt_y;
    }

    private const uint INPUT_KEYBOARD = 1;
    private const uint KEYEVENTF_KEYUP = 0x0002;

    [DllImport("user32.dll", SetLastError = true)]
    private static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr SetWindowsHookEx(int idHook, HookProc lpfn, IntPtr hMod, uint dwThreadId);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool UnhookWindowsHookEx(IntPtr hhk);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    private static extern sbyte GetMessage(out MSG lpMsg, IntPtr hWnd, uint wMsgFilterMin, uint wMsgFilterMax);

    [DllImport("user32.dll")]
    private static extern bool TranslateMessage([In] ref MSG lpMsg);

    [DllImport("user32.dll")]
    private static extern IntPtr DispatchMessage([In] ref MSG lpMsg);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern IntPtr GetModuleHandle(string lpModuleName);

    private delegate IntPtr HookProc(int nCode, IntPtr wParam, IntPtr lParam);

    public static void PressKey(byte vkCode) {
        INPUT[] inputs = new INPUT[1];
        inputs[0].type = INPUT_KEYBOARD;
        inputs[0].ki.wVk = vkCode;
        inputs[0].ki.dwFlags = 0;
        SendInput(1, inputs, Marshal.SizeOf(typeof(INPUT)));
    }

    public static void ReleaseKey(byte vkCode) {
        INPUT[] inputs = new INPUT[1];
        inputs[0].type = INPUT_KEYBOARD;
        inputs[0].ki.wVk = vkCode;
        inputs[0].ki.dwFlags = KEYEVENTF_KEYUP;
        SendInput(1, inputs, Marshal.SizeOf(typeof(INPUT)));
    }

    public static Action ActionW;
    public static Action ActionA;
    public static Action ActionS;
    public static Action ActionD;

    public static void Start() {
        _hookID = SetHook(_proc);
        MSG msg;
        while (GetMessage(out msg, IntPtr.Zero, 0, 0) > 0) {
            TranslateMessage(ref msg);
            DispatchMessage(ref msg);
        }
        UnhookWindowsHookEx(_hookID);
    }

    private static IntPtr SetHook(HookProc proc) {
        using (Process curProcess = Process.GetCurrentProcess())
        using (ProcessModule curModule = curProcess.MainModule) {
            return SetWindowsHookEx(WH_KEYBOARD_LL, proc, GetModuleHandle(curModule.ModuleName), 0);
        }
    }

    private static IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam) {
        if (nCode >= 0 && wParam == (IntPtr)WM_KEYDOWN) {
            KBDLLHOOKSTRUCT hookStruct = (KBDLLHOOKSTRUCT)Marshal.PtrToStructure(lParam, typeof(KBDLLHOOKSTRUCT));
            bool isInjected = (hookStruct.flags & LLKHF_INJECTED) != 0;

            if (!isInjected && !_isRunning) {
                // W key = 87 (0x57) -> Forward Speedflip
                if (hookStruct.vkCode == 87 && ActionW != null) {
                    _isRunning = true;
                    new Thread(() => { try { ActionW(); } finally { _isRunning = false; } }).Start();
                    return (IntPtr)1;
                }
                // A key = 65 (0x41) -> Left Speedflip
                if (hookStruct.vkCode == 65 && ActionA != null) {
                    _isRunning = true;
                    new Thread(() => { try { ActionA(); } finally { _isRunning = false; } }).Start();
                    return (IntPtr)1;
                }
                // S key = 83 (0x53) -> Fast Aerial
                if (hookStruct.vkCode == 83 && ActionS != null) {
                    _isRunning = true;
                    new Thread(() => { try { ActionS(); } finally { _isRunning = false; } }).Start();
                    return (IntPtr)1;
                }
                // D key = 68 (0x44) -> Right Speedflip
                if (hookStruct.vkCode == 68 && ActionD != null) {
                    _isRunning = true;
                    new Thread(() => { try { ActionD(); } finally { _isRunning = false; } }).Start();
                    return (IntPtr)1;
                }
            }
        }
        return CallNextHookEx(_hookID, nCode, wParam, lParam);
    }
}
"@

Add-Type -TypeDefinition $source

# Virtual Key Mappings
$K_BOOST      = 0x42  # B key (Boost)
$K_FORWARD    = 0x57  # W key
$K_BACK       = 0x53  # S key
$K_LEFT       = 0x41  # A key
$K_RIGHT      = 0x44  # D key
$K_JUMP       = 0x20  # Spacebar
$K_AIRROLL_L  = 0x51  # Q key (Air Roll Left)
$K_AIRROLL_R  = 0x45  # E key (Air Roll Right)

# [W] Forward Speedflip Action
[RLMasterHookEngine]::ActionW = {
    [RLMasterHookEngine]::PressKey($K_BOOST)
    [RLMasterHookEngine]::PressKey($K_FORWARD)
    [RLMasterHookEngine]::PressKey($K_JUMP)
    Start-Sleep -Milliseconds 30
    [RLMasterHookEngine]::ReleaseKey($K_JUMP)
    Start-Sleep -Milliseconds 30

    [RLMasterHookEngine]::PressKey($K_JUMP)
    Start-Sleep -Milliseconds 20
    [RLMasterHookEngine]::ReleaseKey($K_JUMP)
    [RLMasterHookEngine]::ReleaseKey($K_FORWARD)

    [RLMasterHookEngine]::PressKey($K_BACK)
    Start-Sleep -Milliseconds 550
    [RLMasterHookEngine]::ReleaseKey($K_BACK)
    [RLMasterHookEngine]::ReleaseKey($K_BOOST)
}

# [A] Left Speedflip Action
[RLMasterHookEngine]::ActionA = {
    [RLMasterHookEngine]::PressKey($K_BOOST)
    [RLMasterHookEngine]::PressKey($K_FORWARD)
    [RLMasterHookEngine]::PressKey($K_LEFT)
    [RLMasterHookEngine]::PressKey($K_JUMP)
    Start-Sleep -Milliseconds 30
    [RLMasterHookEngine]::ReleaseKey($K_JUMP)
    Start-Sleep -Milliseconds 30

    [RLMasterHookEngine]::PressKey($K_JUMP)
    Start-Sleep -Milliseconds 20
    [RLMasterHookEngine]::ReleaseKey($K_JUMP)
    [RLMasterHookEngine]::ReleaseKey($K_FORWARD)
    [RLMasterHookEngine]::ReleaseKey($K_LEFT)

    [RLMasterHookEngine]::PressKey($K_BACK)
    [RLMasterHookEngine]::PressKey($K_AIRROLL_L)
    Start-Sleep -Milliseconds 600
    [RLMasterHookEngine]::ReleaseKey($K_BACK)
    [RLMasterHookEngine]::ReleaseKey($K_AIRROLL_L)
    [RLMasterHookEngine]::ReleaseKey($K_BOOST)
}

# [S] Fast Aerial Action
[RLMasterHookEngine]::ActionS = {
    [RLMasterHookEngine]::PressKey($K_BOOST)
    [RLMasterHookEngine]::PressKey($K_BACK)
    [RLMasterHookEngine]::PressKey($K_JUMP)
    Start-Sleep -Milliseconds 200
    [RLMasterHookEngine]::ReleaseKey($K_JUMP)
    [RLMasterHookEngine]::ReleaseKey($K_BACK)
    Start-Sleep -Milliseconds 30

    [RLMasterHookEngine]::PressKey($K_JUMP)
    Start-Sleep -Milliseconds 30
    [RLMasterHookEngine]::ReleaseKey($K_JUMP)

    Start-Sleep -Milliseconds 150
    [RLMasterHookEngine]::PressKey($K_FORWARD)
    [RLMasterHookEngine]::PressKey($K_JUMP)
    Start-Sleep -Milliseconds 20
    [RLMasterHookEngine]::ReleaseKey($K_JUMP)
    [RLMasterHookEngine]::ReleaseKey($K_FORWARD)

    [RLMasterHookEngine]::PressKey($K_BACK)
    Start-Sleep -Milliseconds 300
    [RLMasterHookEngine]::ReleaseKey($K_BACK)
    [RLMasterHookEngine]::ReleaseKey($K_BOOST)
}

# [D] Right Speedflip Action
[RLMasterHookEngine]::ActionD = {
    [RLMasterHookEngine]::PressKey($K_BOOST)
    [RLMasterHookEngine]::PressKey($K_FORWARD)
    [RLMasterHookEngine]::PressKey($K_RIGHT)
    [RLMasterHookEngine]::PressKey($K_JUMP)
    Start-Sleep -Milliseconds 30
    [RLMasterHookEngine]::ReleaseKey($K_JUMP)
    Start-Sleep -Milliseconds 30

    [RLMasterHookEngine]::PressKey($K_JUMP)
    Start-Sleep -Milliseconds 20
    [RLMasterHookEngine]::ReleaseKey($K_JUMP)
    [RLMasterHookEngine]::ReleaseKey($K_FORWARD)
    [RLMasterHookEngine]::ReleaseKey($K_RIGHT)

    [RLMasterHookEngine]::PressKey($K_BACK)
    [RLMasterHookEngine]::PressKey($K_AIRROLL_R)
    Start-Sleep -Milliseconds 600
    [RLMasterHookEngine]::ReleaseKey($K_BACK)
    [RLMasterHookEngine]::ReleaseKey($K_AIRROLL_R)
    [RLMasterHookEngine]::ReleaseKey($K_BOOST)
}

Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  ROCKET LEAGUE UNIFIED WIN32 HOOK ENGINE - ACTIVE" -ForegroundColor Green
Write-Host "  [W] Forward Speedflip | [A] Left Speedflip" -ForegroundColor White
Write-Host "  [D] Right Speedflip   | [S] Fast Aerial" -ForegroundColor White
Write-Host "  Press Ctrl + C in this terminal anytime to exit." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

[RLMasterHookEngine]::Start()
`;

  const getActiveCode = () => {
    switch (activeHook) {
      case 'all':
        return unifiedMasterScript;
      case 'deadzoneTuner':
        return RAW_POWERSHELL_TEMPLATES.deadzoneTuner;
      case 'fastAerial':
        return RAW_POWERSHELL_TEMPLATES.fastAerial;
      case 'leftSpeedflip':
        return RAW_POWERSHELL_TEMPLATES.leftSpeedflip;
      case 'rightSpeedflip':
        return RAW_POWERSHELL_TEMPLATES.rightSpeedflip;
      case 'forwardSpeedflip':
        return RAW_POWERSHELL_TEMPLATES.forwardSpeedflip;
      default:
        return unifiedMasterScript;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const code = getActiveCode();
    const filename =
      activeHook === 'all'
        ? 'RocketLeague_MasterHooks_Unified.ps1'
        : activeHook === 'deadzoneTuner'
        ? 'RocketLeague_DeadzoneTuner.ps1'
        : `RocketLeague_${activeHook}.ps1`;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <h2 className="font-['Chakra_Petch'] font-bold text-lg text-slate-100 uppercase">
              Windows C# Low-Level Keyboard Hooks (PowerShell)
            </h2>
            <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded">
              user32.dll WH_KEYBOARD_LL
            </span>
          </div>
          <p className="text-xs text-slate-400 font-['Rajdhani'] mt-1">
            Zero third-party driver dependencies required. Intercepts physical key down events at the OS kernel hook level and injects microsecond-precise Rocket League input sequences.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-bold transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
            <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY .PS1 SCRIPT'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-mono font-bold transition-all shadow-md shadow-emerald-500/20"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD .PS1</span>
          </button>
        </div>
      </div>

      {/* Script Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800 text-xs font-mono">
        {[
          { id: 'all', label: '⭐ Unified Master Engine (W, A, S, D in 1 Script)' },
          { id: 'deadzoneTuner', label: '🎯 Deadzone & Sensitivity Tuner (CLI & Injector)' },
          { id: 'leftSpeedflip', label: 'Left Speedflip Manager [Key A]' },
          { id: 'rightSpeedflip', label: 'Right Speedflip Manager [Key D]' },
          { id: 'forwardSpeedflip', label: 'Forward Speedflip Manager [Key W]' },
          { id: 'fastAerial', label: 'Fast Aerial Hook [Key S]' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveHook(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeHook === tab.id
                ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Technical Hook Architecture Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-['Chakra_Petch'] font-bold text-slate-200 uppercase">
              LLKHF_INJECTED Flag Filter
            </h4>
            <p className="text-slate-400 font-['Rajdhani'] mt-0.5">
              Filters out simulated keystrokes to prevent self-triggering infinite recursion loops when calling <code className="text-emerald-400">SendInput()</code>.
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5">
          <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-['Chakra_Petch'] font-bold text-slate-200 uppercase">
              Physical Key Blocking (IntPtr 1)
            </h4>
            <p className="text-slate-400 font-['Rajdhani'] mt-0.5">
              Returns <code className="text-amber-400 font-mono">(IntPtr)1</code> to swallow the physical key event so Rocket League only receives the synchronized macro inputs.
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5">
          <Layers className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-['Chakra_Petch'] font-bold text-slate-200 uppercase">
              Dedicated Thread Dispatch
            </h4>
            <p className="text-slate-400 font-['Rajdhani'] mt-0.5">
              Executes the timing sequence on an isolated background thread so the Windows low-level hook queue never times out or hitches frame rates.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Run Instructions Banner */}
      <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
              <span>Quick Execution Instructions</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">No Web Downloads Needed</span>
            </div>
            <p className="text-slate-400 text-[11px] font-['Rajdhani'] mt-0.5">
              Click <strong>DOWNLOAD .PS1</strong> above (or <strong>COPY</strong>) and run locally in PowerShell. Do not fetch dev URLs with <code className="text-amber-300">irm | iex</code> because Google AI Studio blocks non-browser terminal requests with an authentication login page.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0">
          <button
            onClick={handleDownload}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>SAVE TO DESKTOP</span>
          </button>
        </div>
      </div>

      {/* Code Display Area */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono text-slate-200">
              {activeHook === 'all' ? 'RLMasterHookEngine_Unified.ps1' : `RL_${activeHook}.ps1`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>To run:</span>
            <code className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-emerald-400">
              powershell -ExecutionPolicy Bypass -File .\RocketLeague_MasterHooks.ps1
            </code>
          </div>
        </div>

        <div className="p-4 overflow-y-auto max-h-[500px] font-mono text-xs text-slate-300 leading-relaxed">
          <pre className="font-['JetBrains_Mono'] whitespace-pre-wrap selection:bg-emerald-500/30">
            {getActiveCode()}
          </pre>
        </div>
      </div>
    </div>
  );
};
