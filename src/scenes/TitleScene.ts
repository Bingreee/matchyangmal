import * as Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { createDesigns } from '../logic/sockDesign';
import { newRun } from '../logic/stages';
import { saveStore } from '../storage/SaveStore';
import { unlockAudio } from '../audio/sfx';
import { ensureSockAtlas, SOCK_ATLAS_KEY, sockFrame } from '../view/sockTexture';
import { createButton, drawBackground, textStyle } from '../view/ui';
import { SceneKeys } from './keys';
import type { GameSceneData } from './GameScene';

const T = GAME_CONFIG.theme;

export class TitleScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Title);
  }

  create(): void {
    const { width, height } = GAME_CONFIG;
    drawBackground(this);
    ensureSockAtlas(this);

    this.add.text(width / 2, 170, '짝양말', textStyle(124, T.accent)).setOrigin(0.5).setStroke('#ffffff', 16);
    this.add.text(width / 2, 275, '건조기에서 쏟아진 양말, 짝을 찾아 주세요!', textStyle(32, T.text, false)).setOrigin(0.5);

    this.drawDryer(width / 2, 620);

    const save = saveStore.load();
    const record = save.bestScore > 0 ? `최고 점수 ${save.bestScore.toLocaleString()} · 최고 ${save.bestStage}스테이지` : '첫 빨래를 개어 볼까요?';
    this.add.text(width / 2, 935, record, textStyle(32)).setOrigin(0.5);

    createButton(this, width / 2, 1060, '시작하기', () => {
      unlockAudio();
      this.scene.start(SceneKeys.Game, { run: newRun() } satisfies GameSceneData);
    });

    this.add
      .text(width / 2, height - 80, '같은 양말 두 짝을 차례로 탭!  틀리면 시간이 줄어요', textStyle(26, T.text, false))
      .setOrigin(0.5)
      .setAlpha(0.7);
  }

  /** 양말이 빙글빙글 도는 건조기 */
  private drawDryer(cx: number, cy: number): void {
    const w = 420;
    const h = 470;
    const x = cx - w / 2;
    const y = cy - h / 2;
    const g = this.add.graphics();

    // 그림자, 다리
    g.fillStyle(0x3a2f4d, 0.08);
    g.fillEllipse(cx, y + h + 22, w * 0.9, 30);
    g.fillStyle(0xcfc3ea, 1);
    g.fillRoundedRect(x + 40, y + h - 10, 50, 30, 10);
    g.fillRoundedRect(x + w - 90, y + h - 10, 50, 30, 10);

    // 몸통
    g.fillStyle(0xd9cdf3, 1);
    g.fillRoundedRect(x, y + 8, w, h, 48);
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(x, y, w, h, 48);

    // 조작부
    g.fillStyle(0xf3eefc, 1);
    g.fillRoundedRect(x + 24, y + 22, w - 48, 72, 26);
    g.fillStyle(0xffb3c7, 1);
    g.fillCircle(x + 70, y + 58, 20);
    g.fillStyle(0xa8d8ff, 1);
    g.fillCircle(x + 125, y + 58, 14);
    g.fillStyle(0xb9f0c9, 1);
    g.fillRoundedRect(x + w - 170, y + 42, 120, 32, 12);

    // 문
    const dy = cy + 50;
    g.fillStyle(0xe4dbf6, 1);
    g.fillCircle(cx, dy, 158);
    g.fillStyle(0xc9bce8, 1);
    g.fillCircle(cx, dy, 138);
    g.fillStyle(0xdff1ff, 1);
    g.fillCircle(cx, dy, 124);

    // 안에서 도는 양말
    const drum = this.add.container(cx, dy);
    createDesigns(4, 4).forEach((d, i) => {
      const a = (i / 4) * Math.PI * 2;
      drum.add(
        this.add
          .image(Math.cos(a) * 52, Math.sin(a) * 52, SOCK_ATLAS_KEY, sockFrame(d))
          .setScale(0.46)
          .setAngle((a * 180) / Math.PI + 90),
      );
    });
    this.tweens.add({ targets: drum, angle: 360, duration: 4200, repeat: -1 });

    // 유리 반사광
    const glass = this.add.graphics();
    glass.lineStyle(10, 0xffffff, 0.7);
    glass.beginPath();
    glass.arc(cx, dy, 100, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(250));
    glass.strokePath();
    glass.fillStyle(0xffffff, 0.18);
    glass.fillCircle(cx, dy, 124);

    // 손잡이
    g.fillStyle(0xc9bce8, 1);
    g.fillRoundedRect(cx + 150, dy - 34, 18, 68, 9);

    // 통통 튀는 건조기
    const parts = [g, drum, glass];
    this.tweens.add({ targets: parts, y: '-=6', duration: 260, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', repeatDelay: 900 });
  }
}
