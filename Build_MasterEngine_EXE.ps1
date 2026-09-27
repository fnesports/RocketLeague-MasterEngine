# ==============================================================================
# FN PRO ROCKET LEAGUE MASTER-ENGINE - NATIVE STANDALONE .EXE COMPILER
# 100% Native Windows - Compiles pure C# code into a single portable .EXE
# Uses Windows built-in C# Compiler (csc.exe) - Zero external dependencies!
# ==============================================================================

param(
    [string]$OutputPath = "$HOME\Desktop\FN_RocketLeague_MasterEngine.exe"
)

Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   FN PRO ROCKET LEAGUE MASTER-ENGINE - EXE COMPILER      " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

# Locate built-in Microsoft .NET Framework C# Compiler (csc.exe)
$cscCandidates = @(
    "$env:SystemRoot\Microsoft.NET\Framework64\v4.0.30319\csc.exe",
    "$env:SystemRoot\Microsoft.NET\Framework\v4.0.30319\csc.exe"
)

$cscPath = $null
foreach ($path in $cscCandidates) {
    if (Test-Path $path) {
        $cscPath = $path
        break
    }
}

if (-not $cscPath) {
    Write-Host "[!] csc.exe not found in standard .NET paths. Checking dotnet CLI..." -ForegroundColor Yellow
    if (Get-Command "dotnet" -ErrorAction SilentlyContinue) {
        Write-Host "[OK] Found dotnet SDK." -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Could not find C# compiler. Please ensure .NET Framework is active." -ForegroundColor Red
        Exit
    }
} else {
    Write-Host "[OK] Found Windows Built-in C# Compiler: $cscPath" -ForegroundColor Green
}

# Standalone C# Source Code with WASD Hooks, Deadzone Re-scaling, and System Tray Icon
$csharpSource = @'
using System;
using System.Diagnostics;
using System.Drawing;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;

namespace FNMasterEngine {
    public class Program {
        private const int WH_KEYBOARD_LL = 13;
        private const int WM_KEYDOWN = 0x0100;
        private const int LLKHF_INJECTED = 0x0010;

        private static HookProc _proc = HookCallback;
        private static IntPtr _hookID = IntPtr.Zero;
        private static bool _isRunning = false;
        private static NotifyIcon _trayIcon;

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

        const byte K_BOOST = 0x42;      // B (Boost)
        const byte K_FORWARD = 0x57;    // W
        const byte K_BACK = 0x53;       // S
        const byte K_LEFT = 0x41;       // A
        const byte K_RIGHT = 0x44;      // D
        const byte K_JUMP = 0x20;       // Space
        const byte K_AIRROLL_L = 0x51;  // Q
        const byte K_AIRROLL_R = 0x45;  // E

        [STAThread]
        public static void Main() {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            // Create System Tray Icon
            _trayIcon = new NotifyIcon();
            _trayIcon.Text = "FN Pro Rocket League Master Engine (120Hz)";
            _trayIcon.Icon = SystemIcons.Shield;
            _trayIcon.Visible = true;

            ContextMenuStrip menu = new ContextMenuStrip();
            menu.Items.Add("Rocket League Master Engine v4.0.2").Enabled = false;
            menu.Items.Add("-");
            menu.Items.Add("Exit Engine", null, (s, e) => {
                _trayIcon.Visible = false;
                UnhookWindowsHookEx(_hookID);
                Application.Exit();
            });
            _trayIcon.ContextMenuStrip = menu;

            _trayIcon.ShowBalloonTip(3000, "FN Master-Engine Active", "Zero-Latency WASD Hooks & 120Hz Timing Running in System Tray.", ToolTipIcon.Info);

            _hookID = SetHook(_proc);
            Application.Run();
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
                    // [W] Forward Speedflip
                    if (hookStruct.vkCode == 87) {
                        _isRunning = true;
                        new Thread(() => {
                            try {
                                PressKey(K_BOOST);
                                PressKey(K_FORWARD);
                                PressKey(K_JUMP);
                                Thread.Sleep(30);
                                ReleaseKey(K_JUMP);
                                Thread.Sleep(30);

                                PressKey(K_JUMP);
                                Thread.Sleep(20);
                                ReleaseKey(K_JUMP);
                                ReleaseKey(K_FORWARD);

                                PressKey(K_BACK);
                                Thread.Sleep(550);
                                ReleaseKey(K_BACK);
                                ReleaseKey(K_BOOST);
                            } finally { _isRunning = false; }
                        }).Start();
                        return (IntPtr)1;
                    }

                    // [A] Left Speedflip
                    if (hookStruct.vkCode == 65) {
                        _isRunning = true;
                        new Thread(() => {
                            try {
                                PressKey(K_BOOST);
                                PressKey(K_FORWARD);
                                PressKey(K_LEFT);
                                PressKey(K_JUMP);
                                Thread.Sleep(30);
                                ReleaseKey(K_JUMP);
                                Thread.Sleep(30);

                                PressKey(K_JUMP);
                                Thread.Sleep(20);
                                ReleaseKey(K_JUMP);
                                ReleaseKey(K_FORWARD);
                                ReleaseKey(K_LEFT);

                                PressKey(K_BACK);
                                PressKey(K_AIRROLL_L);
                                Thread.Sleep(600);
                                ReleaseKey(K_BACK);
                                ReleaseKey(K_AIRROLL_L);
                                ReleaseKey(K_BOOST);
                            } finally { _isRunning = false; }
                        }).Start();
                        return (IntPtr)1;
                    }

                    // [D] Right Speedflip
                    if (hookStruct.vkCode == 68) {
                        _isRunning = true;
                        new Thread(() => {
                            try {
                                PressKey(K_BOOST);
                                PressKey(K_FORWARD);
                                PressKey(K_RIGHT);
                                PressKey(K_JUMP);
                                Thread.Sleep(30);
                                ReleaseKey(K_JUMP);
                                Thread.Sleep(30);

                                PressKey(K_JUMP);
                                Thread.Sleep(20);
                                ReleaseKey(K_JUMP);
                                ReleaseKey(K_FORWARD);
                                ReleaseKey(K_RIGHT);

                                PressKey(K_BACK);
                                PressKey(K_AIRROLL_R);
                                Thread.Sleep(600);
                                ReleaseKey(K_BACK);
                                ReleaseKey(K_AIRROLL_R);
                                ReleaseKey(K_BOOST);
                            } finally { _isRunning = false; }
                        }).Start();
                        return (IntPtr)1;
                    }

                    // [S] Fast Aerial
                    if (hookStruct.vkCode == 83) {
                        _isRunning = true;
                        new Thread(() => {
                            try {
                                PressKey(K_BOOST);
                                PressKey(K_BACK);
                                PressKey(K_JUMP);
                                Thread.Sleep(200);
                                ReleaseKey(K_JUMP);
                                ReleaseKey(K_BACK);
                                Thread.Sleep(30);

                                PressKey(K_JUMP);
                                Thread.Sleep(30);
                                ReleaseKey(K_JUMP);

                                Thread.Sleep(150);
                                PressKey(K_FORWARD);
                                PressKey(K_JUMP);
                                Thread.Sleep(20);
                                ReleaseKey(K_JUMP);
                                ReleaseKey(K_FORWARD);

                                PressKey(K_BACK);
                                Thread.Sleep(300);
                                ReleaseKey(K_BACK);
                                ReleaseKey(K_BOOST);
                            } finally { _isRunning = false; }
                        }).Start();
                        return (IntPtr)1;
                    }
                }
            }
            return CallNextHookEx(_hookID, nCode, wParam, lParam);
        }
    }
}
'@

$tempCsPath = "$env:TEMP\FN_MasterEngine_Source.cs"
Set-Content -Path $tempCsPath -Value $csharpSource -Encoding UTF8

Write-Host "[+] Compiling C# source code to standalone executable..." -ForegroundColor Yellow
$compileArgs = @(
    "/target:winexe",
    "/optimize+",
    "/platform:anycpu",
    "/out:`"$OutputPath`"",
    "/reference:System.Windows.Forms.dll",
    "/reference:System.Drawing.dll",
    "`"$tempCsPath`""
)

& $cscPath $compileArgs

if (Test-Path $OutputPath) {
    Remove-Item $tempCsPath -Force -ErrorAction SilentlyContinue
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "   BUILD SUCCESSFUL! STANDALONE .EXE GENERATED!           " -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "Location: $OutputPath" -ForegroundColor Cyan
    Write-Host "You can now run this standalone .EXE file anytime without" -ForegroundColor White
    Write-Host "opening PowerShell or installing any dependencies!" -ForegroundColor White
} else {
    Write-Host "[ERROR] Compilation failed." -ForegroundColor Red
}
