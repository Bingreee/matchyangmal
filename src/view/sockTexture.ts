import * as Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { designOf, type SockDesign } from '../logic/sockDesign';
import { darken, lighten } from './color';

/** 양말 텍스처 크기 (px). 이미지 에셋으로 바꿀 때도 이 크기에 맞추면 배치가 그대로 맞습니다. */
export const SOCK_TEX_W = 150;
export const SOCK_TEX_H = 190;

/** 모든 양말 무늬를 한 장의 텍스처(아틀라스)에 모아 둡니다. */
export const SOCK_ATLAS_KEY = 'sock-atlas';

/** 아틀라스 안에서 이 무늬의 프레임 이름 */
export function sockFrame(design: SockDesign): string {
  return design.id;
}

/**
 * 가능한 모든 양말 무늬를 코드로 그려 한 장의 아틀라스로 구워 둡니다.
 * 한 장으로 모으면 기울어진 양말이 일부 기기(GPU)에서 잘려 보이는 문제를 피할 수 있습니다.
 * 나중에 이미지 에셋을 쓰려면 preload에서 같은 키·같은 프레임 이름으로 아틀라스를 불러오면 됩니다.
 */
export function ensureSockAtlas(scene: Phaser.Scene): void {
  if (scene.textures.exists(SOCK_ATLAS_KEY)) return;
  const designs = allDesigns();
  const cols = 8;
  const rows = Math.ceil(designs.length / cols);
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  designs.forEach((d, i) => drawSock(g, d, (i % cols) * SOCK_TEX_W, Math.floor(i / cols) * SOCK_TEX_H));
  g.generateTexture(SOCK_ATLAS_KEY, cols * SOCK_TEX_W, rows * SOCK_TEX_H);
  g.destroy();

  const tex = scene.textures.get(SOCK_ATLAS_KEY);
  designs.forEach((d, i) => {
    tex.add(sockFrame(d), 0, (i % cols) * SOCK_TEX_W, Math.floor(i / cols) * SOCK_TEX_H, SOCK_TEX_W, SOCK_TEX_H);
  });
}

function allDesigns(): SockDesign[] {
  const { colors, stripeCounts } = GAME_CONFIG.sock;
  return colors.flatMap((color) => stripeCounts.map((stripes) => designOf(color, stripes)));
}

/** 양말 한 짝을 (ox, oy) 위치의 칸에 그립니다. */
function drawSock(g: Phaser.GameObjects.Graphics, design: SockDesign, ox: number, oy: number): void {
  const base = design.color;
  const outline = darken(base, 0.35);
  const shade = darken(base, 0.12);

  // 양말 모양: 세로 다리 + 가로 발
  const leg = { x: ox + 34, y: oy + 14, w: 66, h: 130 };
  const foot = { x: ox + 34, y: oy + 112, w: 106, h: 66 };
  const border = 5;

  const drawShape = (pad: number, color: number) => {
    g.fillStyle(color, 1);
    g.fillRoundedRect(leg.x - pad, leg.y - pad, leg.w + pad * 2, leg.h + pad * 2, 16 + pad);
    g.fillRoundedRect(foot.x - pad, foot.y - pad, foot.w + pad * 2, foot.h + pad * 2, 30 + pad);
    // 다리와 발이 만나는 모서리를 메워 매끈하게
    g.fillRect(leg.x - pad, foot.y - pad, leg.w + pad * 2, 40);
  };

  // 바닥 그림자
  g.fillStyle(0x3a2f4d, 0.08);
  g.fillEllipse(ox + 84, oy + 182, 120, 14);

  drawShape(border, outline);
  drawShape(0, base);

  // 발끝, 뒤꿈치 덧댐
  g.fillStyle(shade, 1);
  g.fillRoundedRect(foot.x + foot.w - 34, foot.y, 34, foot.h, { tl: 0, bl: 0, tr: 30, br: 30 });
  g.fillCircle(leg.x + 16, foot.y + foot.h - 18, 16);

  // 목 밴드 (시보리)
  g.fillStyle(lighten(base, 0.45), 1);
  g.fillRoundedRect(leg.x, leg.y, leg.w, 26, { tl: 16, tr: 16, bl: 0, br: 0 });
  g.lineStyle(2, shade, 1);
  for (let x = leg.x + 10; x < leg.x + leg.w; x += 10) {
    g.lineBetween(x, leg.y + 5, x, leg.y + 22);
  }

  // 줄무늬
  if (design.stripes > 0) {
    const top = leg.y + 40;
    const bottom = leg.y + leg.h - 14;
    const stripeH = 10;
    const gap = (bottom - top - stripeH * design.stripes) / (design.stripes + 1);
    g.fillStyle(0xffffff, 0.92);
    for (let i = 0; i < design.stripes; i++) {
      const y = top + gap * (i + 1) + stripeH * i;
      g.fillRect(leg.x, y, leg.w, stripeH);
    }
  }

  // 반짝임
  g.fillStyle(0xffffff, 0.35);
  g.fillRoundedRect(leg.x + 8, leg.y + 34, 8, 60, 4);
}
