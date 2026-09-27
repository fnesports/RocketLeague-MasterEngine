# ⚡ FN Rocket League Master-Engine (v4.0.2)

![Rocket League](https://img.shields.io/badge/Game-Rocket%20League-blue?style=for-the-badge&logo=rocketleague)
![Language](https://img.shields.io/badge/C%23%20%7C%20PowerShell%20%7C%20React%20%7C%20TypeScript-007acc?style=for-the-badge)
![Cloud](https://img.shields.io/badge/Google%20Cloud-Firestore%20Live-orange?style=for-the-badge&logo=googlecloud)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

A high-performance, microsecond-precise input optimization framework and low-level Win32 execution engine engineered for competitive **Rocket League** mechanics, 120Hz physics ticks, and sub-millisecond input consistency.

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

### 4. ☁️ Google Cloud Infrastructure & Realtime Synchronization
* **Database:** Multi-region **Google Cloud Firestore (NoSQL)** for storing player configurations, speedflip timings, and deadzones.
* **Security:** ABAC Zero-Trust Firestore Security Rules protecting user document spaces.
* **Community Hub:** Realtime cloud presets from top RLCS pros (Zen, Vatira, BeastMode) with one-click in-engine application.

---

## 🛠️ Quick Local Launch (PowerShell)

To run the unified **WASD Hook Engine** directly on your Windows desktop:

```powershell
& "$HOME\Desktop\RocketLeague_MasterHooks_WASD.ps1"
```

To run the interactive **Deadzone & Sensitivity Tuner**:
```powershell
& "$HOME\Desktop\RL_DeadzoneTuner.ps1" -Interactive
```

---

## 📂 Project Structure

```text
├── src/
│   ├── components/
│   │   ├── CloudSyncHub.tsx       # Google Cloud Firestore & Auth Hub
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
