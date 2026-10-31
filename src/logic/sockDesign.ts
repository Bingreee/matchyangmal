import { GAME_CONFIG } from '../config';

/** 양말 한 종류(한 짝)의 무늬. 화면과 무관한 순수 데이터입니다. */
export interface SockDesign {
  id: string;
  color: number;
  stripes: number;
}

/** 화면에 놓인 양말 한 개 */
export interface SockPiece {
  uid: number;
  design: SockDesign;
}

export function designOf(color: number, stripes: number): SockDesign {
  return { id: `${color.toString(16)}-${stripes}`, color, stripes };
}

export type Rng = () => number;

export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 짝 수만큼 서로 다른 무늬를 만듭니다. 색이 겹치지 않게 고르고, 색이 모자라면 줄무늬로 구분합니다. */
export function createDesigns(pairCount: number, rng: Rng = Math.random): SockDesign[] {
  const { colors, stripeCounts } = GAME_CONFIG.sock;
  const combos: SockDesign[] = [];
  for (const color of colors) {
    for (const stripes of stripeCounts) {
      combos.push(designOf(color, stripes));
    }
  }
  if (pairCount > combos.length) {
    throw new Error(`pairCount(${pairCount})가 만들 수 있는 무늬 수(${combos.length})보다 많아요.`);
  }
  const shuffled = shuffle(combos, rng);
  const picked: SockDesign[] = [];
  const usedColors = new Set<number>();
  // 1차: 색이 겹치지 않게
  for (const d of shuffled) {
    if (picked.length >= pairCount) break;
    if (!usedColors.has(d.color)) {
      picked.push(d);
      usedColors.add(d.color);
    }
  }
  // 2차: 색이 모자라면 남은 조합으로 채움
  for (const d of shuffled) {
    if (picked.length >= pairCount) break;
    if (!picked.some((p) => p.id === d.id)) picked.push(d);
  }
  return picked;
}

/** 짝마다 양말 2개씩 만들어 섞은 목록 */
export function createPieces(pairCount: number, rng: Rng = Math.random): SockPiece[] {
  const designs = createDesigns(pairCount, rng);
  const pieces: SockPiece[] = [];
  let uid = 0;
  for (const design of designs) {
    pieces.push({ uid: uid++, design }, { uid: uid++, design });
  }
  return shuffle(pieces, rng);
}
