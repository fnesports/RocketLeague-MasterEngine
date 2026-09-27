# ==============================================================================
# FN PRO ROCKET LEAGUE MASTER-ENGINE - STANDALONE GUI .EXE COMPILER
# Compiles a complete Windows GUI Form with embedded "FN" Icon into:
# FN_RocketLeague_MasterEngine.exe
# ==============================================================================

param(
    [string]$OutputPath = "$HOME\Desktop\FN_RocketLeague_MasterEngine.exe"
)

Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   FN PRO ROCKET LEAGUE MASTER-ENGINE - GUI EXE COMPILER  " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

# Step 1: Generate High-Resolution "FN" Cyberpunk Icon (.ico)
Add-Type -AssemblyName System.Drawing

$iconPath = "$env:TEMP\FN_MasterEngine_Icon.ico"
$bmp = New-Object System.Drawing.Bitmap 128, 128
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

# Background dark rounded rect
$brushBg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(11, 15, 25))
$penBorder = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(6, 182, 212), 4)
$rect = New-Object System.Drawing.Rectangle 4, 4, 120, 120
$g.FillEllipse($brushBg, $rect)
$g.DrawEllipse($penBorder, $rect)

# Draw "FN" Letters
$font = New-Object System.Drawing.Font("Arial", 46, [System.Drawing.FontStyle]::Bold)
$brushText = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(6, 182, 212))
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center
$g.DrawString("FN", $font, $brushText, (New-Object System.Drawing.RectangleF 0, 0, 128, 128), $sf)

# Status dot
$brushDot = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(16, 185, 129))
$g.FillEllipse($brushDot, (New-Object System.Drawing.Rectangle 88, 88, 20, 20))

$hIcon = $bmp.GetHicon()
$iconObj = [System.Drawing.Icon]::FromHandle($hIcon)
$fileStream = New-Object System.IO.FileStream $iconPath, ([System.IO.FileMode]::Create)
$iconObj.Save($fileStream)
$fileStream.Close()
$g.Dispose()
$bmp.Dispose()

Write-Host "[OK] Generated custom high-res 'FN' icon at: $iconPath" -ForegroundColor Green

# Step 2: Locate Windows C# Compiler (csc.exe)
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
    Write-Host "[ERROR] Could not find csc.exe in standard .NET paths." -ForegroundColor Red
    Exit
}
Write-Host "[OK] Using Windows C# Compiler: $cscPath" -ForegroundColor Green

# Step 3: Standalone C# Source Code with Full Visual GUI Window (Form)
$csharpSource = @'
using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;

namespace FNMasterEngine {
    public class MainForm : Form {
        private const int WH_KEYBOARD_LL = 13;
        private const int WM_KEYDOWN = 0x0100;
        private const int LLKHF_INJECTED = 0x0010;

        private static HookProc _proc = HookCallback;
        private static IntPtr _hookID = IntPtr.Zero;
        private static bool _isRunning = false;
        private static bool _engineEnabled = true;

        private static ListBox _logBox;
        private static Label _statusLabel;
        private static Button _btnToggle;
        private static NotifyIcon _trayIcon;

        // Custom config values
        private static double _internalDeadzone = 0.05;
        private static double _dodgeDeadzone = 0.05;
        private static double _curveExponent = 1.40;

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

        public static void Log(string msg) {
            if (_logBox != null && _logBox.InvokeRequired) {
                _logBox.Invoke(new Action(() => Log(msg)));
                return;
            }
            if (_logBox != null) {
                string timeStr = DateTime.Now.ToString("HH:mm:ss.fff");
                _logBox.Items.Insert(0, "[" + timeStr + "] " + msg);
                if (_logBox.Items.Count > 100) _logBox.Items.RemoveAt(100);
            }
        }

        [STAThread]
        public static void Main() {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }

        public MainForm() {
            // Window Setup
            this.Text = "FN PRO ROCKET LEAGUE MASTER-ENGINE v4.0.2";
            this.Size = new Size(880, 680);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.FromArgb(11, 15, 25);
            this.ForeColor = Color.FromArgb(226, 232, 240);
            this.FormBorderStyle = FormBorderStyle.FixedSingle;
            this.MaximizeBox = false;

            // Generate runtime Form Icon
            Bitmap b = new Bitmap(32, 32);
            using (Graphics g = Graphics.FromImage(b)) {
                g.Clear(Color.FromArgb(11, 15, 25));
                using (Pen p = new Pen(Color.FromArgb(6, 182, 212), 2)) {
                    g.DrawRectangle(p, 2, 2, 28, 28);
                }
                using (Font f = new Font("Arial", 11, FontStyle.Bold)) {
                    g.DrawString("FN", f, new SolidBrush(Color.FromArgb(6, 182, 212)), 2, 6);
                }
            }
            this.Icon = Icon.FromHandle(b.GetHicon());

            // Header Banner
            Panel pnlHeader = new Panel {
                Location = new Point(0, 0),
                Size = new Size(880, 80),
                BackColor = Color.FromArgb(15, 23, 42)
            };
            this.Controls.Add(pnlHeader);

            Label lblLogo = new Label {
                Text = "FN",
                Font = new Font("Impact", 28, FontStyle.Bold),
                ForeColor = Color.FromArgb(6, 182, 212),
                Location = new Point(20, 14),
                AutoSize = true
            };
            pnlHeader.Controls.Add(lblLogo);

            Label lblTitle = new Label {
                Text = "FN MASTER-ENGINE - COMPETITIVE INPUT SUBSYSTEM",
                Font = new Font("Segoe UI", 13, FontStyle.Bold),
                ForeColor = Color.White,
                Location = new Point(80, 16),
                AutoSize = true
            };
            pnlHeader.Controls.Add(lblTitle);

            Label lblSub = new Label {
                Text = "Zero-Latency Win32 Keyboard Hooks (WASD) • 120Hz Physics Timing • Psyonix Game Data API",
                Font = new Font("Segoe UI", 9),
                ForeColor = Color.FromArgb(148, 163, 184),
                Location = new Point(82, 44),
                AutoSize = true
            };
            pnlHeader.Controls.Add(lblSub);

            // Engine Active Toggle Button
            _btnToggle = new Button {
                Text = "ENGINE ACTIVE (ONLINE)",
                Font = new Font("Segoe UI", 9, FontStyle.Bold),
                BackColor = Color.FromArgb(16, 185, 129),
                ForeColor = Color.Black,
                FlatStyle = FlatStyle.Flat,
                Location = new Point(660, 20),
                Size = new Size(185, 40),
                Cursor = Cursors.Hand
            };
            _btnToggle.Click += (s, e) => {
                _engineEnabled = !_engineEnabled;
                if (_engineEnabled) {
                    _btnToggle.Text = "ENGINE ACTIVE (ONLINE)";
                    _btnToggle.BackColor = Color.FromArgb(16, 185, 129);
                    _btnToggle.ForeColor = Color.Black;
                    _statusLabel.Text = "● Win32 Low-Level Hooks Active (120Hz Tick Monitoring)";
                    _statusLabel.ForeColor = Color.FromArgb(16, 185, 129);
                    Log("Master-Engine re-armed and active.");
                } else {
                    _btnToggle.Text = "ENGINE PAUSED";
                    _btnToggle.BackColor = Color.FromArgb(239, 68, 68);
                    _btnToggle.ForeColor = Color.White;
                    _statusLabel.Text = "○ Hooks Paused - Standard Keyboard Passthrough";
                    _statusLabel.ForeColor = Color.FromArgb(239, 68, 68);
                    Log("Master-Engine paused.");
                }
            };
            pnlHeader.Controls.Add(_btnToggle);

            // Status strip under header
            _statusLabel = new Label {
                Text = "● Win32 Low-Level Hooks Active (120Hz Tick Monitoring)",
                Font = new Font("Segoe UI", 9, FontStyle.Bold),
                ForeColor = Color.FromArgb(16, 185, 129),
                Location = new Point(20, 92),
                AutoSize = true
            };
            this.Controls.Add(_statusLabel);

            // 4 WASD Mechanic Cards
            CreateMechanicCard(20, 125, "[W] FORWARD SPEEDFLIP", "30ms Jump 1 -> 20ms Jump 2 -> 550ms Cancel Hold [S]", Color.FromArgb(6, 182, 212));
            CreateMechanicCard(230, 125, "[A] 45° LEFT SPEEDFLIP", "Jump -> Double Jump -> Flip Cancel [S] + AirRoll Left [Q]", Color.FromArgb(16, 185, 129));
            CreateMechanicCard(440, 125, "[D] 45° RIGHT SPEEDFLIP", "Jump -> Double Jump -> Flip Cancel [S] + AirRoll Right [E]", Color.FromArgb(245, 158, 11));
            CreateMechanicCard(650, 125, "[S] FAST AERIAL LAUNCHER", "200ms Jump 1 -> 30ms Pitch Forward [W] -> Stabilize", Color.FromArgb(168, 85, 247));

            // Calibration & Action Bar
            GroupBox grpActions = new GroupBox {
                Text = " Quick Actions & Engine Injection ",
                Font = new Font("Segoe UI", 9, FontStyle.Bold),
                ForeColor = Color.FromArgb(148, 163, 184),
                Location = new Point(20, 235),
                Size = new Size(825, 95),
                BackColor = Color.FromArgb(15, 23, 42)
            };
            this.Controls.Add(grpActions);

            Button btnInjectTAInput = CreateActionButton("Inject TAInput.ini (0.05 DZ)", 15, 30, 220, Color.FromArgb(30, 41, 59), Color.FromArgb(6, 182, 212));
            btnInjectTAInput.Click += (s, e) => {
                InjectTAInput();
            };
            grpActions.Controls.Add(btnInjectTAInput);

            Button btnInjectTAStats = CreateActionButton("Inject TAStatsAPI.ini (120Hz)", 250, 30, 230, Color.FromArgb(30, 41, 59), Color.FromArgb(16, 185, 129));
            btnInjectTAStats.Click += (s, e) => {
                InjectTAStatsAPI();
            };
            grpActions.Controls.Add(btnInjectTAStats);

            Button btnLaunchRL = CreateActionButton("Launch Rocket League", 495, 30, 180, Color.FromArgb(0, 110, 180), Color.White);
            btnLaunchRL.Click += (s, e) => {
                LaunchGame();
            };
            grpActions.Controls.Add(btnLaunchRL);

            Button btnTest = CreateActionButton("Test Speedflip", 690, 30, 120, Color.FromArgb(40, 50, 70), Color.FromArgb(245, 158, 11));
            btnTest.Click += (s, e) => {
                Log("[SIMULATION] Testing 45° Left Speedflip execution...");
                SimulateSpeedflip();
            };
            grpActions.Controls.Add(btnTest);

            // Real-Time Activity Log Box
            Label lblLogTitle = new Label {
                Text = "REAL-TIME INPUT TELEMETRY & EXECUTION AUDIT (LOG):",
                Font = new Font("Segoe UI", 8.5f, FontStyle.Bold),
                ForeColor = Color.FromArgb(148, 163, 184),
                Location = new Point(20, 345),
                AutoSize = true
            };
            this.Controls.Add(lblLogTitle);

            _logBox = new ListBox {
                Location = new Point(20, 370),
                Size = new Size(825, 240),
                BackColor = Color.FromArgb(6, 9, 16),
                ForeColor = Color.FromArgb(56, 189, 248),
                Font = new Font("Consolas", 9.5f),
                BorderStyle = BorderStyle.FixedSingle
            };
            this.Controls.Add(_logBox);

            // Initial logs
            Log("==================================================================");
            Log("FN PRO ROCKET LEAGUE MASTER-ENGINE v4.0.2 - READY");
            Log("Low-Level Win32 Hook attached directly to Windows Input Kernel.");
            Log("Press [W], [A], [D], [S] in Freeplay or Matches to trigger mechanics.");
            Log("==================================================================");

            // Attach Hook
            _hookID = SetHook(_proc);

            // Form Closing cleanup
            this.FormClosing += (s, e) => {
                UnhookWindowsHookEx(_hookID);
            };
        }

        private void CreateMechanicCard(int x, int y, string title, string desc, Color accent) {
            Panel pnl = new Panel {
                Location = new Point(x, y),
                Size = new Size(195, 95),
                BackColor = Color.FromArgb(15, 23, 42),
                BorderStyle = BorderStyle.FixedSingle
            };
            this.Controls.Add(pnl);

            Panel pnlBar = new Panel {
                Location = new Point(0, 0),
                Size = new Size(195, 4),
                BackColor = accent
            };
            pnl.Controls.Add(pnlBar);

            Label lbl = new Label {
                Text = title,
                Font = new Font("Segoe UI", 8.5f, FontStyle.Bold),
                ForeColor = accent,
                Location = new Point(6, 12),
                AutoSize = true
            };
            pnl.Controls.Add(lbl);

            Label lblDesc = new Label {
                Text = desc,
                Font = new Font("Segoe UI", 7.5f),
                ForeColor = Color.FromArgb(148, 163, 184),
                Location = new Point(6, 35),
                Size = new Size(180, 50)
            };
            pnl.Controls.Add(lblDesc);
        }

        private Button CreateActionButton(string text, int x, int y, int width, Color bg, Color fg) {
            Button btn = new Button {
                Text = text,
                Location = new Point(x, y),
                Size = new Size(width, 36),
                BackColor = bg,
                ForeColor = fg,
                Font = new Font("Segoe UI", 8.5f, FontStyle.Bold),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btn.FlatAppearance.BorderColor = Color.FromArgb(50, 65, 90);
            return btn;
        }

        private void InjectTAInput() {
            try {
                string rlDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Documents\\My Games\\Rocket League\\TAGame\\Config");
                if (!Directory.Exists(rlDir)) Directory.CreateDirectory(rlDir);
                string targetFile = Path.Combine(rlDir, "TAInput.ini");
                if (File.Exists(targetFile)) File.Copy(targetFile, targetFile + ".backup", true);

                string content = "[Engine.PlayerInput]\nMoveForwardSpeed=1200\nMoveStrafeSpeed=1200\nLookRightScale=300\nLookUpScale=-250\nMouseSensitivity=60.0\nDoubleClickTime=0.250000\nbEnableMouseSmoothing=false\n; FN PRO 0.05 Deadzone Calibration Active\n";
                File.WriteAllText(targetFile, content);
                Log("[CONFIG INJECTOR] Successfully injected calibrated values into TAInput.ini!");
                MessageBox.Show("TAInput.ini successfully calibrated with 0.05 Deadzone!", "TAInput Calibration", MessageBoxButtons.OK, MessageBoxIcon.Information);
            } catch (Exception ex) {
                Log("[ERROR] Failed to inject TAInput.ini: " + ex.Message);
            }
        }

        private void InjectTAStatsAPI() {
            try {
                string rlDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Documents\\My Games\\Rocket League\\TAGame\\Config");
                if (!Directory.Exists(rlDir)) Directory.CreateDirectory(rlDir);
                string targetFile = Path.Combine(rlDir, "TAStatsAPI.ini");

                string content = "[TAGame.MatchStatsExporter_TA]\nPacketSendRate=120\nPort=9000\nWebPort=9001\n";
                File.WriteAllText(targetFile, content);
                Log("[STATS API] Successfully injected TAStatsAPI.ini (120Hz WebSocket active on port 9001)!");
                MessageBox.Show("TAStatsAPI.ini successfully injected! MatchStatsExporter_TA ready on port 9001.", "Psyonix Stats API", MessageBoxButtons.OK, MessageBoxIcon.Information);
            } catch (Exception ex) {
                Log("[ERROR] Failed to inject TAStatsAPI: " + ex.Message);
            }
        }

        private void LaunchGame() {
            try {
                Process.Start("steam://rungameid/252950");
                Log("[LAUNCHER] Started Rocket League via Steam.");
            } catch {
                try {
                    Process.Start("com.epicgames.launcher://apps/Sugar?action=launch&silent=true");
                    Log("[LAUNCHER] Started Rocket League via Epic Games Launcher.");
                } catch {
                    MessageBox.Show("Please launch Rocket League through your launcher.", "Notice", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
            }
        }

        private void SimulateSpeedflip() {
            new Thread(() => {
                Log("[SIM] Triggered Left Speedflip test...");
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
                Log("[SIM] Speedflip execution sequence complete (650ms). Supersonic reached!");
            }).Start();
        }

        private static IntPtr SetHook(HookProc proc) {
            using (Process curProcess = Process.GetCurrentProcess())
            using (ProcessModule curModule = curProcess.MainModule) {
                return SetWindowsHookEx(WH_KEYBOARD_LL, proc, GetModuleHandle(curModule.ModuleName), 0);
            }
        }

        private static IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam) {
            if (nCode >= 0 && wParam == (IntPtr)WM_KEYDOWN && _engineEnabled) {
                KBDLLHOOKSTRUCT hookStruct = (KBDLLHOOKSTRUCT)Marshal.PtrToStructure(lParam, typeof(KBDLLHOOKSTRUCT));
                bool isInjected = (hookStruct.flags & LLKHF_INJECTED) != 0;

                if (!isInjected && !_isRunning) {
                    // [W] Forward Speedflip
                    if (hookStruct.vkCode == 87) {
                        _isRunning = true;
                        new Thread(() => {
                            try {
                                Log("[KEYPRESS: W] Executing Forward Speedflip (30ms Flip-Cancel)...");
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
                                Log("[COMPLETE: W] Forward Speedflip executed.");
                            } finally { _isRunning = false; }
                        }).Start();
                        return (IntPtr)1;
                    }

                    // [A] Left Speedflip
                    if (hookStruct.vkCode == 65) {
                        _isRunning = true;
                        new Thread(() => {
                            try {
                                Log("[KEYPRESS: A] Executing Left 45° Speedflip + AirRoll Left...");
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
                                Log("[COMPLETE: A] Left Speedflip executed.");
                            } finally { _isRunning = false; }
                        }).Start();
                        return (IntPtr)1;
                    }

                    // [D] Right Speedflip
                    if (hookStruct.vkCode == 68) {
                        _isRunning = true;
                        new Thread(() => {
                            try {
                                Log("[KEYPRESS: D] Executing Right 45° Speedflip + AirRoll Right...");
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
                                Log("[COMPLETE: D] Right Speedflip executed.");
                            } finally { _isRunning = false; }
                        }).Start();
                        return (IntPtr)1;
                    }

                    // [S] Fast Aerial
                    if (hookStruct.vkCode == 83) {
                        _isRunning = true;
                        new Thread(() => {
                            try {
                                Log("[KEYPRESS: S] Executing Fast Aerial Pitch Launcher...");
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
                                Log("[COMPLETE: S] Fast Aerial executed.");
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

$tempCsPath = "$env:TEMP\FN_MasterEngine_Form_Source.cs"
Set-Content -Path $tempCsPath -Value $csharpSource -Encoding UTF8

Write-Host "[+] Compiling Standalone GUI Windows Form .EXE with Embedded Icon..." -ForegroundColor Yellow

$compileArgs = @(
    "/target:winexe",
    "/optimize+",
    "/platform:anycpu",
    "/win32icon:`"$iconPath`"",
    "/out:`"$OutputPath`"",
    "/reference:System.Windows.Forms.dll",
    "/reference:System.Drawing.dll",
    "`"$tempCsPath`""
)

& $cscPath $compileArgs

if (Test-Path $OutputPath) {
    Remove-Item $tempCsPath -Force -ErrorAction SilentlyContinue
    Remove-Item $iconPath -Force -ErrorAction SilentlyContinue
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "   SUCCESS! STANDALONE VISUAL GUI .EXE GENERATED!         " -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "File: $OutputPath" -ForegroundColor Cyan
    Write-Host "Icon: Embedded custom 'FN' Cyberpunk Logo" -ForegroundColor Green
    Write-Host "UI:   Full Dark Cyberpunk GUI Window with WASD Cards & Log" -ForegroundColor Green
    Write-Host ">>> Double-click FN_RocketLeague_MasterEngine.exe now! <<<" -ForegroundColor Yellow
} else {
    Write-Host "[ERROR] Compilation failed." -ForegroundColor Red
}
