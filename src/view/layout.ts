import { GAME_CONFIG } from '../config';
import { shuffle } from '../logic/sockDesign';

export interface Placement {
  x: number;
  y: number;
  angle: number;
  flip: boolean;
}

/** 칸을 나눈 뒤 칸 안에서 살짝 흔들어 '쏟아진 더미' 느낌으로 흩뿌립니다. 서로 크게 겹치지 않습니다. */
export function scatterPlacements(count: number, rng: () => number = Math.random): Placement[] {
  const { width } = GAME_CONFIG;
  const L = GAME_CONFIG.layout;
  const cols = L.columns;
  const rows = Math.ceil(count / cols);
  const cellW = (width - L.areaSide * 2) / cols;
  const cellH = (L.areaBottom - L.areaTop) / rows;

  const cells: { cx: number; cy: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({
        cx: L.areaSide + cellW * (c + 0.5),
        cy: L.areaTop + cellH * (r + 0.5),
      });
    }
  }

  return shuffle(cells, rng)
    .slice(0, count)
    .map(({ cx, cy }) => ({
      x: cx + (rng() * 2 - 1) * cellW * L.jitter * 0.5,
      y: cy + (rng() * 2 - 1) * cellH * L.jitter * 0.5,
      angle: (rng() * 2 - 1) * L.maxRotationDeg,
      flip: rng() < 0.5,
    }));
}
