/**
 * 효과음을 Web Audio로 직접 합성합니다 (에셋 없이 동작).
 * 나중에 녹음한 효과음 파일로 바꿀 때는 이 파일의 함수 안쪽만 바꾸면 됩니다.
 */
let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** 첫 터치 때 호출해 두면 iOS에서도 소리가 납니다. */
export function unlockAudio(): void {
  audio();
}

function blip(freqFrom: number, freqTo: number, duration: number, type: OscillatorType, volume: number, delay = 0): void {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqFrom, t0);
  osc.frequency.exponentialRampToValueAtTime(freqTo, t0 + duration);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export const sfx = {
  select: () => blip(1100, 1400, 0.06, 'sine', 0.12),
  /** 짝 맞춤 '뽁'. 콤보가 오를수록 음이 살짝 높아집니다. */
  pop: (combo = 1) => {
    const up = Math.min(combo - 1, 6) * 60;
    blip(950 + up, 260, 0.11, 'sine', 0.35);
    blip(1800 + up, 900, 0.05, 'triangle', 0.08, 0.01);
  },
  wrong: () => {
    blip(260, 150, 0.16, 'square', 0.06);
    blip(200, 120, 0.16, 'square', 0.05, 0.09);
  },
  clear: () => {
    [660, 830, 990, 1320].forEach((f, i) => blip(f, f * 1.01, 0.18, 'triangle', 0.15, i * 0.09));
  },
  fail: () => {
    [520, 440, 350].forEach((f, i) => blip(f, f * 0.97, 0.22, 'triangle', 0.12, i * 0.14));
  },
};
