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

/**
 * 짝 수만큼 서로 다른 무늬를 만듭니다.
 * colorCount개의 색만 골라 쓰므로, 짝 수보다 색이 적으면 같은 색에 줄 개수만 다른 양말이 생깁니다.
 */
export function createDesigns(pairCount: number, colorCount: number = pairCount, rng: Rng = Math.random): SockDesign[] {
  const { colors, stripeCounts } = GAME_CONFIG.sock;
  const useColors = shuffle(colors, rng).slice(0, Math.max(1, Math.min(colorCount, colors.length)));
  const maxDesigns = useColors.length * stripeCounts.length;
  if (pairCount > maxDesigns) {
    throw new Error(`짝 수(${pairCount})가 만들 수 있는 무늬 수(${maxDesigns})보다 많아요. colors를 늘려 주세요.`);
  }
  // 색마다 줄 개수를 섞어 두고, 색을 돌아가며 하나씩 꺼내 고르게 분배
  const perColor = useColors.map((color) => shuffle(stripeCounts, rng).map((stripes) => designOf(color, stripes)));
  const picked: SockDesign[] = [];
  for (let round = 0; picked.length < pairCount; round++) {
    for (const list of perColor) {
      if (picked.length >= pairCount) break;
      if (list[round]) picked.push(list[round]);
    }
  }
  return picked;
}

/** 짝마다 양말 2개씩 만들어 섞은 목록 */
export function createPieces(pairCount: number, colorCount: number = pairCount, rng: Rng = Math.random): SockPiece[] {
  const designs = createDesigns(pairCount, colorCount, rng);
  const pieces: SockPiece[] = [];
  let uid = 0;
  for (const design of designs) {
    pieces.push({ uid: uid++, design }, { uid: uid++, design });
  }
  return shuffle(pieces, rng);
}
