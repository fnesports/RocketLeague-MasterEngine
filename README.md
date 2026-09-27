# ⚡ FN Rocket League Master-Engine (v4.0.2)

![Rocket League](https://img.shields.io/badge/Game-Rocket%20League%20Esports-005fb8?style=for-the-badge&logo=rocketleague)
![Language](https://img.shields.io/badge/C%23%20%7C%20PowerShell%20%7C%20React%20%7C%20TypeScript-007acc?style=for-the-badge)
![Cloud](https://img.shields.io/badge/Google%20Cloud-Firestore%20Live-orange?style=for-the-badge&logo=googlecloud)
![Win32](https://img.shields.io/badge/Windows%20API-WH__KEYBOARD__LL-blueviolet?style=for-the-badge&logo=windows)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

A high-performance, microsecond-precise input optimization framework, native Windows GUI control center, and low-level Win32 execution engine engineered for competitive **Rocket League** mechanics, 120Hz physics ticks, and sub-millisecond input consistency.

---

## 🌐 Official Authoritative References & Knowledge Bases

This project is built and strictly compliant with official game APIs, operating system kernel interfaces, and cloud database architectures:

* 🎮 **Rocket League Official & Esports Portal**:
  * [Rocket League Official Website](https://www.rocketleague.com) - Official game updates, patch notes & mechanics baseline.
  * [Rocket League Esports (RLCS)](https://esports.rocketleague.com) - Official RLCS LAN tournament standards, championship match rules, and pro player telemetry benchmarks.
* 📡 **Psyonix & Epic Games Built-in Game Data API**:
  * [MatchStatsExporter_TA Documentation](https://www.rocketleague.com) - Official Unreal Engine 3 `TAStatsAPI.ini` 120Hz live JSON match broadcasting engine (Whitelisted by Easy Anti-Cheat).
* 🖱️ **Hardware & Scripting Developer Hubs**:
  * [Logitech G-HUB Official Hub](https://www.logitechg.com/en-us/innovation/g-hub.html) - Official Lua macro execution engine & driver architecture.
* 🪟 **Microsoft Windows Kernel & Systems Programming**:
  * [Microsoft Learn: Win32 SetWindowsHookEx (`WH_KEYBOARD_LL`)](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setwindowshookexw) - Low-level kernel keyboard hook specification for sub-millisecond input capture.
  * [Microsoft Learn: Win32 SendInput API](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-sendinput) - Hardware-level synthetic packet dispatching without OS message queue latency.
  * [Microsoft Learn: PowerShell Systems Documentation](https://learn.microsoft.com/en-us/powershell/) - Official command-line and scripting language reference.
* ☁️ **Google Cloud Infrastructure**:
  * [Google Cloud Firestore Architecture](https://cloud.google.com/firestore) - Enterprise multi-region NoSQL document storage and realtime reactive synchronization.

---

## 🚀 Key Architectural Features

### 1. 🏎️ Zero-Latency Win32 Keyboard Hooks (`WH_KEYBOARD_LL`)
* Direct OS kernel-level event interception via Windows `user32.dll` with **0% System.Windows.Forms dependency**.
* Runs out-of-the-box on Windows 10/11 across all PowerShell versions (Windows PowerShell 5.1 & PowerShell 7+).
* Prevents infinite macro recursion using hardware-level injected packet flags (`LLKHF_INJECTED`).

### 2. 🎮 Universal Keybinding Engine (WASD Support)
| Key Binding | Mechanic | Execution Sequence & Timing |
| :---: | :--- | :--- |
| **`[W]`** | **Forward Speedflip** | Boost + Forward + Jump (30ms) ➔ Jump 2 (20ms) ➔ Flip Cancel `[S]` (550ms) |
| **`[A]`** | **45° Left Speedflip** | Boost + Forward + A + Jump (30ms) ➔ Jump 2 (20ms) ➔ Back `[S]` + Air Roll Left `[Q]` (600ms) |
| **`[D]`** | **45° Right Speedflip** | Boost + Forward + D + Jump (30ms) ➔ Jump 2 (20ms) ➔ Back `[S]` + Air Roll Right `[E]` (600ms) |
| **`[S]`** | **Fast Aerial Launcher** | Boost + Back + Jump (200ms) ➔ Jump 2 (30ms) ➔ Pitch Forward `[W]` (20ms) |

### 3. 🎯 Continuous Radial Deadzone & Sensitivity Tuner
* Mathematical model: `activeRange = (abs(raw) - deadzone) / (1.0 - deadzone)` with exponential steering `curved = pow(activeRange, exponent)`.
* Completely filters hardware stick drift between `0.00` and `0.05`, while beginning ultra-smooth deflection at `0.003` past `0.05` instead of abrupt step jumps.
* Features a live ASCII telemetry simulator and direct injector for Unreal Engine's `TAInput.ini`.

### 4. 📡 Official Psyonix TAStatsAPI.ini 120Hz Live Stream
* Configured via `[TAGame.MatchStatsExporter_TA]` with `PacketSendRate=120`.
* Streams live in-match telemetry (car velocity, supersonic state, boost percentage, and kickoff event triggers) over WebSocket `ws://localhost:9001`.

### 5. ☁️ Google Cloud Infrastructure & Realtime Synchronization
* **Database:** Multi-region **Google Cloud Firestore (NoSQL)** for storing player configurations, speedflip timings, and deadzones.
* **Security:** ABAC Zero-Trust Firestore Security Rules protecting user document spaces.
* **Community Hub:** Realtime cloud presets from top RLCS pros (Zen, Vatira, BeastMode) with one-click in-engine application.

---

## 🛠️ Instant Local Compilation & Run (Windows .EXE)

1. Clone or download the repository:
   ```powershell
   git clone https://github.com/userfn-git/RocketLeague-MasterEngine.git
   cd RocketLeague-MasterEngine
   ```
2. Double-click **`build.bat`**.
3. That's it! It automatically compiles `FN_RocketLeague_MasterEngine.cs` using Windows built-in `csc.exe` and launches the standalone **`FN_RocketLeague_MasterEngine.exe`** GUI window with the custom FN icon and live links.

---

## 📂 Project Structure

```text
├── build.bat                      # One-click Windows native batch compiler
├── FN_RocketLeague_MasterEngine.cs # Standalone C# Win32 Form source code
├── src/
│   ├── components/
│   │   ├── CloudSyncHub.tsx       # Google Cloud Firestore & Auth Hub
│   │   ├── TAStatsAPIManager.tsx  # Official Psyonix 120Hz Match Data API Studio
│   │   ├── DesktopInstaller.tsx   # Windows GUI Form & C# hook generator
│   │   ├── MechanicsTimeline.tsx  # 120Hz physics simulation timeline
│   │   ├── PowerShellManager.tsx  # Native C# Win32 low-level hook center
│   │   ├── LatencyLab.tsx         # Input latency & mathematical curve lab
│   │   └── TAInputManager.tsx     # Unreal Engine config editor
│   ├── lib/
│   │   └── firebase.ts            # Firestore client SDK & cloud sync helpers
│   └── data/
│       └── defaultConfig.ts       # RLCS presets and Win32 hook source templates
├── firestore.rules                # Hardened Zero-Trust Firestore ABAC rules
├── firebase-blueprint.json        # Database schema specification
└── server.ts                      # Express API proxy & development server
```

---

## 👤 Author & Maintainer

* **Developer:** [@userfn-git](https://github.com/userfn-git)
* **Repository:** [RocketLeague-MasterEngine](https://github.com/userfn-git/RocketLeague-MasterEngine)
* **Specialization:** Competitive Rocket League Mechanics, Input Latency Optimization & Cloud Systems.

---

## 📄 License
This project is open-source under the **MIT License**.
