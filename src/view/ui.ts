import * as Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { darken } from './color';

const T = GAME_CONFIG.theme;

export function textStyle(size: number, color: string = T.text, bold = true): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: T.font,
    fontSize: `${size}px`,
    color,
    fontStyle: bold ? 'bold' : 'normal',
    align: 'center',
    resolution: 2,
  };
}

/** 파스텔 배경 + 둥둥 떠다니는 비눗방울 */
export function drawBackground(scene: Phaser.Scene): void {
  const { width, height } = GAME_CONFIG;
  scene.cameras.main.setBackgroundColor(T.background);
  const g = scene.add.graphics().setDepth(-10);
  g.fillStyle(0xe9f4ff, 1);
  g.fillCircle(width * 0.9, height * 0.08, 220);
  g.fillStyle(0xffeef4, 1);
  g.fillCircle(width * 0.05, height * 0.95, 260);

  for (let i = 0; i < 9; i++) {
    const r = Phaser.Math.Between(10, 34);
    const b = scene.add
      .circle(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), r, T.bubble, 0.45)
      .setStrokeStyle(2, 0xd9ccff, 0.6)
      .setDepth(-9);
    scene.tweens.add({
      targets: b,
      y: b.y - Phaser.Math.Between(40, 120),
      x: b.x + Phaser.Math.Between(-30, 30),
      duration: Phaser.Math.Between(3000, 6000),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}

/** 손가락으로 누르기 넉넉한 둥근 버튼 */
export function createButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  opts: { width?: number; height?: number; color?: number; fontSize?: number } = {},
): Phaser.GameObjects.Container {
  const w = opts.width ?? 360;
  const h = opts.height ?? 110;
  const color = opts.color ?? T.button;
  const key = `btn-${w}x${h}-${color.toString(16)}`;

  if (!scene.textures.exists(key)) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(darken(color, 0.18), 1);
    g.fillRoundedRect(0, 8, w, h - 8, (h - 8) / 2);
    g.fillStyle(color, 1);
    g.fillRoundedRect(0, 0, w, h - 8, (h - 8) / 2);
    g.fillStyle(0xffffff, 0.25);
    g.fillRoundedRect(24, 10, w - 48, 16, 8);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  const bg = scene.add.image(0, 0, key);
  const text = scene.add.text(0, -4, label, textStyle(opts.fontSize ?? 44, T.buttonText)).setOrigin(0.5);
  const container = scene.add.container(x, y, [bg, text]);

  bg.setInteractive({ useHandCursor: true });
  bg.on('pointerdown', () => {
    scene.tweens.add({ targets: container, scale: 0.94, duration: 70, yoyo: true, ease: 'Quad.easeOut' });
  });
  bg.on('pointerup', () => onClick());
  return container;
}

/** 둥근 흰 카드 (정보창, 결과 카드 등) */
export function drawCard(scene: Phaser.Scene, x: number, y: number, w: number, h: number, radius = 36): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(0xb9a8e0, 0.18);
  g.fillRoundedRect(x, y + 8, w, h, radius);
  g.fillStyle(0xffffff, 0.94);
  g.fillRoundedRect(x, y, w, h, radius);
  return g;
}

/** 양말 더미가 쌓이는 폭신한 빨래 매트 (박음질 테두리 + 도트 무늬) */
export function drawTray(scene: Phaser.Scene): void {
  const { left, right, top, bottom } = GAME_CONFIG.tray;
  const w = right - left;
  const h = bottom - top;
  const g = scene.add.graphics().setDepth(-5);

  g.fillStyle(0xb9a8e0, 0.2);
  g.fillRoundedRect(left, top + 10, w, h, 48);
  g.fillStyle(0xfffaf3, 1);
  g.fillRoundedRect(left, top, w, h, 48);

  // 도트 무늬
  g.fillStyle(0xf3e6ff, 1);
  for (let y = top + 40; y < bottom - 20; y += 56) {
    const offset = ((y - top) / 56) % 2 ? 28 : 0;
    for (let x = left + 40 + offset; x < right - 20; x += 56) g.fillCircle(x, y, 5);
  }

  // 박음질 테두리 (점선)
  g.fillStyle(0xe2cdf5, 1);
  const inset = 16;
  const r = 34;
  const iw = w - inset * 2;
  const ih = h - inset * 2;
  const perimeter = 2 * (iw + ih);
  for (let d = 0; d < perimeter; d += 22) {
    let px: number, py: number;
    if (d < iw) { px = left + inset + d; py = top + inset; }
    else if (d < iw + ih) { px = right - inset; py = top + inset + (d - iw); }
    else if (d < iw * 2 + ih) { px = right - inset - (d - iw - ih); py = bottom - inset; }
    else { px = left + inset; py = bottom - inset - (d - iw * 2 - ih); }
    // 모서리 근처는 건너뛰어 둥근 느낌 유지
    const nearX = px - (left + inset) < r || right - inset - px < r;
    const nearY = py - (top + inset) < r || bottom - inset - py < r;
    if (nearX && nearY) continue;
    g.fillRoundedRect(px - 5, py - 2.5, 10, 5, 2.5);
  }
}

/** 별 모양 하나 */
function drawStar(g: Phaser.GameObjects.Graphics, cx: number, cy: number, outer: number, color: number): void {
  const pts: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? outer * 0.48 : outer;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(new Phaser.Math.Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
  }
  g.fillStyle(color, 1);
  g.fillPoints(pts, true);
}

/** 별점 (1~3개). 하나씩 톡톡 튀어나옵니다. */
export function showStars(scene: Phaser.Scene, x: number, y: number, count: number, size = 46, depth = 0): void {
  const key = `star-${size}`;
  const keyOff = `star-off-${size}`;
  if (!scene.textures.exists(key)) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    const s = size * 2 + 12;
    drawStar(g, s / 2, s / 2 + 3, size + 4, 0xe8b23a);
    drawStar(g, s / 2, s / 2, size, 0xffd45c);
    g.generateTexture(key, s, s);
    g.clear();
    drawStar(g, s / 2, s / 2, size, 0xe9e1f5);
    g.generateTexture(keyOff, s, s);
    g.destroy();
  }
  const gap = size * 2.3;
  for (let i = 0; i < 3; i++) {
    const sx = x + (i - 1) * gap;
    const sy = y + (i === 1 ? -14 : 0);
    scene.add.image(sx, sy, keyOff).setDepth(depth);
    if (i < count) {
      const star = scene.add.image(sx, sy, key).setScale(0).setDepth(depth + 0.1);
      scene.tweens.add({ targets: star, scale: 1, angle: 360, duration: 380, delay: 250 + i * 220, ease: 'Back.easeOut' });
    }
  }
}
