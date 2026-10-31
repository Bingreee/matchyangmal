import { GAME_CONFIG } from '../config';

export interface Placement {
  x: number;
  y: number;
  angle: number;
  flip: boolean;
}

/**
 * 빨래 매트 위에 양말을 '쏟아진 더미'처럼 흩뿌립니다.
 * 서로 겹치되, 중심끼리는 minDistance 이상 떨어뜨려 한 짝이 완전히 가려지지 않게 합니다.
 */
export function scatterPlacements(count: number, scale = 1, rng: () => number = Math.random): Placement[] {
  const { tray, layout } = GAME_CONFIG;
  const left = tray.left + tray.padding * scale;
  const right = tray.right - tray.padding * scale;
  const top = tray.top + tray.padding * scale + 10;
  const bottom = tray.bottom - tray.padding * scale - 10;
  const minDist = layout.minDistance * scale;

  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    // 후보 여러 개 중 기존 양말과 가장 멀리 떨어진 곳을 고르되, 충분히 멀면 바로 채택
    let best = { x: 0, y: 0 };
    let bestDist = -1;
    for (let t = 0; t < 40; t++) {
      const c = { x: left + rng() * (right - left), y: top + rng() * (bottom - top) };
      const d = points.reduce((m, p) => Math.min(m, Math.hypot(p.x - c.x, p.y - c.y)), Infinity);
      if (d > bestDist) {
        best = c;
        bestDist = d;
      }
      if (d >= minDist && rng() < 0.5) break;
    }
    points.push(best);
  }

  return points.map((p) => ({
    ...p,
    angle: (rng() * 2 - 1) * layout.maxRotationDeg,
    flip: rng() < 0.5,
  }));
}
