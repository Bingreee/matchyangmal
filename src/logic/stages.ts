import { GAME_CONFIG } from '../config';

export interface StageSettings {
  /** 1부터 시작하는 스테이지 번호 */
  number: number;
  pairs: number;
  timeSec: number;
  colors: number;
  scale: number;
}

/** 스테이지 번호(1부터)에 맞는 설정. 표를 넘어가면 마지막 줄에서 시간만 줄입니다. */
export function getStage(number: number, cfg = GAME_CONFIG): StageSettings {
  const table = cfg.stages;
  const idx = Math.min(number, table.length) - 1;
  const base = table[idx];
  const over = number - table.length;
  const timeSec = over > 0 ? Math.max(cfg.endless.minTimeSec, base.timeSec - over * cfg.endless.timeDropSec) : base.timeSec;
  return { number, ...base, timeSec };
}

/** 여러 스테이지에 걸친 한 판(런)의 누적 기록 */
export interface RunState {
  stage: number;
  totalScore: number;
  maxCombo: number;
  totalStars: number;
}

export function newRun(): RunState {
  return { stage: 1, totalScore: 0, maxCombo: 0, totalStars: 0 };
}
