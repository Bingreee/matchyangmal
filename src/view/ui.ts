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
