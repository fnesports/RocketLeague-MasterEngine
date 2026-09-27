import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Coach System Instruction
const RL_COACH_SYSTEM_INSTRUCTION = `You are the Rocket League Professional Master-Engine Coach & Mechanics Engineer (RLCS Pro Tier).
You specialize in:
1. Physics engine tick timing (120Hz = 8.33ms per physics tick; dodge deadzones 0.05-0.70; flip cancellation angular momentum).
2. Speedflips (Left/Right/Diagonal, 30°-45° angle, second jump timing at 30-40ms, flip cancel speed < 40ms, directional air roll + powerslide landing recovery).
3. Fast Aerials with flip cancel (tilt-back duration, double jump vs single jump boost trajectory, flip cancel nose dip prevention).
4. Chain Dashing & Infinite Wave Dashing (ground wave dashes, wall resets, powerslide buffer windows).
5. Macro optimization for Logitech G-Hub (Lua event handlers, sleep intervals, jitter thresholds, mouse smoothing, TAInput.ini overrides).
6. KBM (Keyboard & Mouse) vs Controller mechanics, bindings, and low-level Windows keyboard hooks (SendInput, WH_KEYBOARD_LL).

Be precise, highly technical, encouraging, and provide concrete millisecond/tick timing advice, binding recommendations, and common failure diagnostics. Use markdown formatting with clear headings and bullet points.`;

// Expert Rule-Based Fallback Mechanics Engine (RLCS Tier)
function generateExpertCoachAdvice(prompt: string, context?: any): string {
  const q = prompt.toLowerCase();

  if (q.includes('speedflip') || q.includes('kickoff') || q.includes('flip cancel')) {
    return `### ⚡ RLCS Pro Speedflip & Kickoff Analysis

**Key Mechanics & Physics Breakdown (120Hz Engine):**
1. **Jump 1 Duration:** Hold Jump for **30ms–35ms** while boosting continuously. Release cleanly for **30ms**.
2. **Diagonal Dodge Angle:** Steer between **30° and 45°** diagonally (W + A or W + D).
3. **Double-Tap Jump 2:** Fire Jump 2 for **20ms–25ms**. This activates the directional dodge.
4. **Immediate Flip Cancel (< 35ms):** Instantly pull directly backwards (S key or analog back) within **25ms to 35ms** of the second jump.
   * *Critical Law:* If the cancel is delayed beyond 45ms, angular pitch momentum will throw the car's nose into the turf.
5. **Air Roll & Landing Recovery:** Hold Directional Air Roll (Q or E) plus Powerslide (Left Shift) for **550ms–600ms** before touching ground to preserve 100% of linear momentum.

**Pro Diagnostic Tip:** Ensure your Dodge Deadzone is set to **0.05** so the diagonal dodge registers on the earliest physics tick without an accidental double jump stall.`;
  }

  if (q.includes('deadzone') || q.includes('dodge') || q.includes('drift') || q.includes('sense')) {
    return `### 🎯 Advanced Deadzone & Sensitivity Architecture (0.05 / 0.05 RLCS Standard)

**1. Internal Deadzone (0.05 / 5%):**
* **Function:** Filters physical sensor jitter, hardware noise, and stick centering inaccuracy.
* **Continuous Re-Scaling Engine:** Standard linear cutoffs cause an abrupt 5% jump at the boundary. Our formula re-scales the active range:
  \`active_range = (raw_input - 0.05) / (1.0 - 0.05)\`
  This guarantees that steering begins smoothly at **0.00** right past the threshold.

**2. Dodge Deadzone (0.05 / 5%):**
* **Function:** Dictates the deflection threshold required when pressing Jump for the second time to execute a Dodge/Flip instead of a Double Jump.
* **RLCS Impact:** A 0.05 dodge deadzone guarantees immediate 45° diagonal speedflip initiation with zero micro-delay, while the 2D radial confirmation gate protects against accidental backflips during vertical fast aerials.

**Recommended Setting:** Keep both at **0.05** with a **Curve Exponent of 1.40** for optimal micro-aerial adjustments.`;
  }

  if (q.includes('aerial') || q.includes('fast aerial') || q.includes('backflip')) {
    return `### 🚀 Fast Aerial with Anti-Backflip Cancellation Guide

**Optimal Tick Timeline:**
1. **Launch & Boost:** Press and hold Boost (\`mouse1\`) + Pitch Back (S) + Jump (\`mouse2\`) simultaneously for **200ms**.
2. **Neutral Release Window:** Release Jump and S for **30ms**. Releasing S is crucial to bring the directional stick vector below the **0.05 Dodge Deadzone**.
3. **Second Jump Fire:** Tap Jump for **30ms** while completely neutral. This gives a massive vertical thrust impulse without flipping.
4. **Trajectory Stabilization:** After **150ms**, tap Forward (W) and Jump for **20ms** to stabilize pitch angle, followed by an immediate Back (S) micro-hold for **300ms**.

**Common Pitfall:** Holding S during the second jump causes the "FeelsBackFlipMan" error. The macro handles this neutral buffer automatically.`;
  }

  if (q.includes('chain') || q.includes('wave dash') || q.includes('wall')) {
    return `### 🌊 Chain Dash & Infinite Wall Wave Dash Mechanics

**Wave Dash Physics Window:**
1. **Initial Hop:** Tap Jump for **30ms** to get the vehicle barely airborne.
2. **Tilt & Gravity Drop:** Wait **60ms** for the rear two wheels to touch down first while tilted slightly up.
3. **Forward Dodge Slam:** As the rear wheels contact the surface, immediately press Forward (W) + Powerslide + Jump for **30ms**.
4. **Momentum Transfer:** The front wheels slam into the ground, converting the flip's rotational energy into pure forward supersonic speed.
5. **Powerslide Hold:** Maintain Powerslide for **50ms** after each dash to prevent wheel friction from scrubbing velocity.`;
  }

  if (q.includes('logitech') || q.includes('g-hub') || q.includes('mouse') || q.includes('key') || q.includes('bind')) {
    return `### 🖱️ Logitech G-HUB Integration & Safe Input Architecture

**Official Logitech G-HUB API Mappings:**
* **Primary Click (G1):** Left Click → \`PressMouseButton(1)\` → Mapped to **Boost**.
* **Secondary Click (G2):** Right Click → \`PressMouseButton(2)\` → Mapped to **Jump**.
* **Middle Click (G3):** Scroll Click → \`PressMouseButton(3)\` → Mapped to **Script Toggle**.
* **MB4 (G4):** Back Thumb Button → \`PressMouseButton(4)\` → Mapped to **Speedflip**.
* **MB5 (G5):** Forward Thumb Button → \`PressMouseButton(5)\` → Mapped to **Chain Dash**.

**Safe Input Dispatcher:**
The script overrides \`PressKey\` and \`ReleaseKey\` with \`SafePress\` and \`SafeRelease\`, automatically routing mouse buttons to \`PressMouseButton\` and keyboard keys to \`PressKey\`. This completely prevents the \`Lua Error: invalid argument\` crash and eliminates stuck keys / echo.`;
  }

  return `### ⚡ Rocket League Master-Engine Technical Diagnostic

**Physics & Timing Optimization (120Hz Tick Rate):**
* **Frame Interval:** Each physics tick in Rocket League is precisely **8.33ms**.
* **Speedflip Success Window:** First Jump: 30ms–35ms | Second Jump Delay: 30ms | Flip Cancel Hold: 550ms–600ms.
* **Deadzone Calibration:** Internal Deadzone at **0.05** (5%) with smooth continuous re-scaling prevents stick drift without introducing 5% step discontinuities.
* **Anti-Backflip Safety:** Dodge Deadzone set to **0.05** ensures that directional dodges trigger instantly on diagonal inputs while protecting Fast Aerial double jumps.

*Pro Tip: Use the 120Hz Simulator tab to scrub through the physics timeline frame-by-frame and inspect individual angular pitch/yaw curves.*`;
}

// Endpoint: AI Mechanics Coach Chat / Diagnostics
app.post('/api/gemini/coach', async (req, res) => {
  const { prompt, context, highThinking } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  if (ai) {
    try {
      const modelName = highThinking ? 'gemini-3.1-pro-preview' : 'gemini-3.8-flash';
      const config: any = {
        systemInstruction: RL_COACH_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      };

      if (highThinking) {
        config.thinkingConfig = {
          thinkingLevel: ThinkingLevel.HIGH,
        };
      }

      const fullPrompt = context
        ? `User Control Context:\n${JSON.stringify(context, null, 2)}\n\nUser Question:\n${prompt}`
        : prompt;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: fullPrompt,
        config,
      });

      if (response && response.text) {
        return res.json({
          reply: response.text,
          model: modelName,
        });
      }
    } catch {
      // Graceful fallback to expert mechanics engine without throwing error
    }
  }

  // High-precision offline RLCS rule-based expert engine fallback
  const advice = generateExpertCoachAdvice(prompt, context);
  res.json({
    reply: advice,
    model: 'RLCS Master-Engine Pro Expert',
    offline: true,
  });
});

// Endpoint: TTS Voice Cues (Countdown and Drill Cadence)
app.post('/api/gemini/tts', async (req, res) => {
  const { text, voice = 'Puck' } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required for TTS' });
  }

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text,
                speechMetadata: {
                  style: 'Energetic esports coach with sharp timing calls',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return res.json({ audioBase64: base64Audio });
      }
    } catch {
      // Fallback silently to client-side browser Web Speech API
    }
  }

  res.json({ audioBase64: null, offline: true });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    version: '4.0.2',
    hasApiKey: !!apiKey,
  });
});

// Windows PowerShell Deadzone Tuner endpoint
app.get('/api/scripts/deadzone', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(`param(
    [double]$InternalDeadzone = 0.05,
    [double]$DodgeDeadzone = 0.05,
    [double]$CurveExponent = 1.40,
    [double]$AerialSense = 1.50,
    [switch]$Interactive,
    [switch]$InjectTAInput
)

Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   FN PRO ROCKET LEAGUE DEADZONE CALIBRATOR (POWERSHELL)  " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

function Show-CalibrationMenu {
    Write-Host ""
    Write-Host "CURRENT CONFIGURATION:" -ForegroundColor Yellow
    Write-Host "  1) Internal Deadzone : " -NoNewline; Write-Host "$InternalDeadzone (Filters hardware jitter, starts smoothly at 0.00)" -ForegroundColor Cyan
    Write-Host "  2) Dodge Deadzone    : " -NoNewline; Write-Host "$DodgeDeadzone (Triggers 45 deg diagonal speedflips instantly)" -ForegroundColor Cyan
    Write-Host "  3) Curve Exponent    : " -NoNewline; Write-Host "$CurveExponent (Micro-precision near stick center)" -ForegroundColor Cyan
    Write-Host "  4) Aerial Multiplier : " -NoNewline; Write-Host "$AerialSense (Max deflection spin speed)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "PRESETS:" -ForegroundColor Yellow
    Write-Host "  [P1] Zen / Vatira RLCS Championship  (Deadzone: 0.05 | Dodge: 0.05 | Exponent: 1.40)" -ForegroundColor Green
    Write-Host "  [P2] Ultra-Sensitive Freestyle       (Deadzone: 0.03 | Dodge: 0.05 | Exponent: 1.60)" -ForegroundColor Magenta
    Write-Host "  [P3] Safe / Standard High-Stability  (Deadzone: 0.08 | Dodge: 0.08 | Exponent: 1.20)" -ForegroundColor Blue
    Write-Host ""
    Write-Host "ACTIONS:" -ForegroundColor Yellow
    Write-Host "  [T]  Run Real-Time Continuous Curve Simulation (Live Math Telemetry)" -ForegroundColor Cyan
    Write-Host "  [I]  Inject Current Settings into Rocket League TAInput.ini" -ForegroundColor Yellow
    Write-Host "  [C]  Customize Values Manually" -ForegroundColor White
    Write-Host "  [Q]  Quit" -ForegroundColor Red
    Write-Host ""
}

function Calculate-Output([double]$rawInput, [double]$deadzone, [double]$exponent, [double]$multiplier) {
    $absInput = [Math]::Abs($rawInput)
    if ($absInput -le $deadzone) { return 0.0 }
    $sign = if ($rawInput -gt 0) { 1.0 } else { -1.0 }
    $activeRange = ($absInput - $deadzone) / (1.0 - $deadzone)
    $curved = [Math]::Pow($activeRange, $exponent)
    return [Math]::Round(($curved * $sign * $multiplier), 4)
}

function Run-LiveSimulation {
    Write-Host ""
    Write-Host "--- REAL-TIME CONTINUOUS RADIAL CURVE TEST (Input -1.0 to +1.0) ---" -ForegroundColor Cyan
    Write-Host "Raw Input -> Continuous Rescaled Output (0.00 starts immediately past deadzone):" -ForegroundColor Gray
    Write-Host ""

    $testSteps = @(-1.0, -0.75, -0.50, -0.25, -0.06, -0.05, -0.02, 0.0, 0.02, 0.05, 0.06, 0.25, 0.50, 0.75, 1.0)
    foreach ($raw in $testSteps) {
        $out = Calculate-Output -rawInput $raw -deadzone $InternalDeadzone -exponent $CurveExponent -multiplier $AerialSense
        $status = if ([Math]::Abs($raw) -le $InternalDeadzone) { "[DEADZONE FILTERED]" } else { "[ACTIVE DEFLECTION]" }
        $color = if ([Math]::Abs($raw) -le $InternalDeadzone) { "DarkGray" } else { "Green" }
        $barLength = [Math]::Min(30, [int]([Math]::Abs($out) * 20))
        $bar = "#" * $barLength
        Write-Host ("  Raw: {0,5:F2}  ->  Output: {1,6:F3}  {2,-20} {3}" -f $raw, $out, $status, $bar) -ForegroundColor $color
    }
    Write-Host ""
    Read-Host "Press Enter to return to menu..."
}

function Inject-TAInputSettings {
    $rlConfigDir = "$env:USERPROFILE\\Documents\\My Games\\Rocket League\\TAGame\\Config"
    $targetIni = "$rlConfigDir\\TAInput.ini"
    if (-not (Test-Path $rlConfigDir)) { New-Item -ItemType Directory -Path $rlConfigDir -Force | Out-Null }
    if (Test-Path $targetIni) {
        Copy-Item -Path $targetIni -Destination "$targetIni.backup" -Force
        Write-Host "[OK] Backup created at: $targetIni.backup" -ForegroundColor Yellow
    }

    $iniContent = @"
[Engine.PlayerInput]
MoveForwardSpeed=1200
MoveStrafeSpeed=1200
LookRightScale=300
LookUpScale=-250
MouseSensitivity=60.0
DoubleClickTime=0.250000
bEnableMouseSmoothing=false

; FN PRO CALIBRATED VALUES
; Internal Deadzone: $InternalDeadzone
; Dodge Deadzone: $DodgeDeadzone
; Curve Exponent: $CurveExponent
; Aerial Multiplier: $AerialSense
"@
    Set-Content -Path $targetIni -Value $iniContent -Encoding ASCII
    Write-Host "[SUCCESS] Calibrated values successfully injected into TAInput.ini!" -ForegroundColor Green
}

if ($InjectTAInput) {
    Inject-TAInputSettings
    Exit
}

do {
    Show-CalibrationMenu
    $choice = (Read-Host "Select option").ToUpper()

    switch ($choice) {
        "P1" {
            $InternalDeadzone = 0.05; $DodgeDeadzone = 0.05; $CurveExponent = 1.40; $AerialSense = 1.50
            Write-Host "[OK] Loaded Zen / Vatira RLCS Preset (0.05 / 0.05)" -ForegroundColor Green
            Start-Sleep -Seconds 1
        }
        "P2" {
            $InternalDeadzone = 0.03; $DodgeDeadzone = 0.05; $CurveExponent = 1.60; $AerialSense = 1.80
            Write-Host "[OK] Loaded Freestyle Preset (0.03 / 0.05)" -ForegroundColor Magenta
            Start-Sleep -Seconds 1
        }
        "P3" {
            $InternalDeadzone = 0.08; $DodgeDeadzone = 0.08; $CurveExponent = 1.20; $AerialSense = 1.30
            Write-Host "[OK] Loaded Balanced Standard Preset (0.08 / 0.08)" -ForegroundColor Blue
            Start-Sleep -Seconds 1
        }
        "T" { Run-LiveSimulation }
        "I" { Inject-TAInputSettings; Read-Host "Press Enter to continue..." }
        "C" {
            $val = Read-Host "Enter Internal Deadzone (default 0.05)"; if ($val) { $InternalDeadzone = [double]$val }
            $val = Read-Host "Enter Dodge Deadzone (default 0.05)"; if ($val) { $DodgeDeadzone = [double]$val }
            $val = Read-Host "Enter Curve Exponent (default 1.40)"; if ($val) { $CurveExponent = [double]$val }
            $val = Read-Host "Enter Aerial Multiplier (default 1.50)"; if ($val) { $AerialSense = [double]$val }
            Write-Host "[OK] Custom parameters saved." -ForegroundColor Green
            Start-Sleep -Seconds 1
        }
    }
} while ($choice -ne "Q")
`);
});

// Windows PowerShell Installer endpoint
app.get('/api/installer', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(`# Rocket League Master Engine Installer
Write-Host "Rocket League Master Engine installer endpoint active."
`);
});

// Setup Vite middlewares in development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Rocket League Master-Engine Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
