export interface MacroConfig {
  internalDeadzone: number;
  dodgeDeadzone: number;
  hardwareJitter: number;
  groundSense: number;
  aerialSense: number;
  curveExponent: number;
  // Keybindings
  mouseToggle: number;
  mouseSpeedflip: number;
  mouseChaindash: number;
  gkeyFastAerial: number;
  gkeyFwdSpeedflip: number;
  gkeyLeftSpeedflip: number;
  gkeyRightSpeedflip: number;
  // In-game keys
  keyForward: string;
  keyBack: string;
  keyLeft: string;
  keyRight: string;
  keyJump: string;
  keyBoost: string;
  keyPowerslide: string;
  keyAirrollL: string;
  keyAirrollR: string;
  // Timing delays in ms
  fastAerialBoostHold: number;
  fastAerialJump1: number;
  fastAerialJump2Delay: number;
  fastAerialJump2: number;
  fastAerialCancelDelay: number;
  fastAerialCancelHold: number;
  speedflipJump1: number;
  speedflipJump2Delay: number;
  speedflipJump2: number;
  speedflipCancelHold: number;
  chaindashJump1: number;
  chaindashPause: number;
  chaindashJump2: number;
}

export interface MechanicStep {
  name: string;
  startMs: number;
  durationMs: number;
  keys: string[];
  actionDescription: string;
  color: string;
}

export interface MechanicDefinition {
  id: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'RLCS Pro';
  totalDurationMs: number;
  description: string;
  proTip: string;
  hotkey: string;
  steps: MechanicStep[];
}

export interface TAInputBinding {
  action: string;
  key: string;
  axisSign?: 'AxisSign_Positive' | 'AxisSign_Negative';
  pressType?: 'BPT_Tap' | 'BPT_Hold';
  bRequired?: boolean;
}

export interface CoachMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
  model?: string;
  isAudioPlaying?: boolean;
}

export interface InferredSpatialEvent {
  id: string;
  type: 'AERIAL' | 'WALL_HIT' | 'POWER_SHOT';
  title: string;
  timestamp: string;
  location: { x: number; y: number; z: number };
  postHitSpeed: number;
  description: string;
}

export interface OpponentStarvationState {
  isStarved: boolean;
  starvationDurationSec: number;
  opponentBoost: number;
  lastUpdated: number;
}
