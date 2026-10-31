import { GAME_CONFIG } from '../config';
import { createPieces, type Rng, type SockPiece } from './sockDesign';

export type GameStatus = 'playing' | 'cleared' | 'failed';

export type SelectResult =
  | { kind: 'ignored' }
  | { kind: 'selected'; uid: number }
  | { kind: 'deselected'; uid: number }
  | { kind: 'match'; a: number; b: number; gained: number; combo: number }
  | { kind: 'mismatch'; a: number; b: number; penaltyMs: number };

export interface GameSummary {
  status: GameStatus;
  score: number;
  matchedPairs: number;
  totalPairs: number;
  maxCombo: number;
  timeLeftMs: number;
  timeBonus: number;
}

/**
 * 매칭 규칙, 점수, 시간만 다루는 순수 로직.
 * Phaser를 모르기 때문에 화면을 바꿔도(이미지 에셋, 드래그 조작 등) 그대로 씁니다.
 */
export class MatchGame {
  readonly pieces: SockPiece[];
  readonly totalPairs: number;

  status: GameStatus = 'playing';
  score = 0;
  combo = 0;
  maxCombo = 0;
  matchedPairs = 0;
  timeLeftMs: number;
  timeBonus = 0;

  private selected: number | null = null;
  private removed = new Set<number>();
  private lastMatchAt = -Infinity;
  private elapsedMs = 0;

  constructor(
    private readonly cfg = GAME_CONFIG,
    rng: Rng = Math.random,
  ) {
    this.totalPairs = cfg.pairCount;
    this.pieces = createPieces(cfg.pairCount, rng);
    this.timeLeftMs = cfg.timeLimitSec * 1000;
  }

  get selectedUid(): number | null {
    return this.selected;
  }

  /** 매 프레임 호출. 시간이 다 되면 실패 처리 */
  tick(deltaMs: number): void {
    if (this.status !== 'playing') return;
    this.elapsedMs += deltaMs;
    this.timeLeftMs = Math.max(0, this.timeLeftMs - deltaMs);
    if (this.timeLeftMs <= 0) this.status = 'failed';
  }

  /** 양말을 탭했을 때 */
  select(uid: number): SelectResult {
    if (this.status !== 'playing' || this.removed.has(uid)) return { kind: 'ignored' };
    const piece = this.find(uid);
    if (!piece) return { kind: 'ignored' };

    if (this.selected === null) {
      this.selected = uid;
      return { kind: 'selected', uid };
    }
    if (this.selected === uid) {
      this.selected = null;
      return { kind: 'deselected', uid };
    }

    const first = this.find(this.selected)!;
    const a = first.uid;
    this.selected = null;

    if (first.design.id === piece.design.id) {
      return this.onMatch(a, uid);
    }
    return this.onMismatch(a, uid);
  }

  isRemoved(uid: number): boolean {
    return this.removed.has(uid);
  }

  summary(): GameSummary {
    return {
      status: this.status,
      score: this.score,
      matchedPairs: this.matchedPairs,
      totalPairs: this.totalPairs,
      maxCombo: this.maxCombo,
      timeLeftMs: this.timeLeftMs,
      timeBonus: this.timeBonus,
    };
  }

  private onMatch(a: number, b: number): SelectResult {
    const { matchScore, comboWindowMs, comboBonusPerStep, timeBonusPerSec } = this.cfg;
    this.removed.add(a);
    this.removed.add(b);
    this.matchedPairs++;

    this.combo = this.elapsedMs - this.lastMatchAt <= comboWindowMs ? this.combo + 1 : 1;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.lastMatchAt = this.elapsedMs;

    const gained = matchScore + comboBonusPerStep * (this.combo - 1);
    this.score += gained;

    if (this.matchedPairs >= this.totalPairs) {
      this.status = 'cleared';
      this.timeBonus = Math.floor(this.timeLeftMs / 1000) * timeBonusPerSec;
      this.score += this.timeBonus;
    }
    return { kind: 'match', a, b, gained, combo: this.combo };
  }

  private onMismatch(a: number, b: number): SelectResult {
    const penaltyMs = this.cfg.wrongPenaltySec * 1000;
    this.timeLeftMs = Math.max(0, this.timeLeftMs - penaltyMs);
    if (this.cfg.wrongResetsCombo) this.combo = 0;
    if (this.timeLeftMs <= 0) this.status = 'failed';
    return { kind: 'mismatch', a, b, penaltyMs };
  }

  private find(uid: number): SockPiece | undefined {
    return this.pieces.find((p) => p.uid === uid);
  }
}
