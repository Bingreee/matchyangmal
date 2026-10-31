import * as Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { MatchGame, type SelectResult } from '../logic/MatchGame';
import { sfx } from '../audio/sfx';
import { scatterPlacements } from '../view/layout';
import { ensureSockAtlas, SOCK_ATLAS_KEY, sockFrame } from '../view/sockTexture';
import { drawBackground, textStyle } from '../view/ui';
import { SceneKeys } from './keys';

const T = GAME_CONFIG.theme;

interface SockView {
  image: Phaser.GameObjects.Image;
  baseScale: number;
  baseAngle: number;
}

/** 화면 담당. 규칙 판정은 전부 MatchGame에 맡기고, 결과에 맞춰 애니메이션만 보여 줍니다. */
export class GameScene extends Phaser.Scene {
  private match!: MatchGame;
  private views = new Map<number, SockView>();
  private ring!: Phaser.GameObjects.Arc;
  private timeBar!: Phaser.GameObjects.Graphics;
  private timeText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private ended = false;

  constructor() {
    super(SceneKeys.Game);
  }

  create(): void {
    this.match = new MatchGame();
    this.views.clear();
    this.ended = false;

    drawBackground(this);
    this.createHud();
    this.createSocks();
  }

  update(_time: number, delta: number): void {
    if (this.ended) return;
    this.match.tick(delta);
    this.refreshHud();
    if (this.match.status !== 'playing') this.finish();
  }

  // ---------- 양말 ----------

  private createSocks(): void {
    const placements = scatterPlacements(this.match.pieces.length);
    const scale = GAME_CONFIG.layout.sockScale;
    ensureSockAtlas(this);

    this.ring = this.add.circle(0, 0, 92, 0xffffff, 0.55).setStrokeStyle(6, 0xff9fbd, 1).setVisible(false).setDepth(5);

    this.match.pieces.forEach((piece, i) => {
      const p = placements[i];
      const image = this.add
        .image(p.x, p.y, SOCK_ATLAS_KEY, sockFrame(piece.design))
        .setAngle(p.angle)
        .setFlipX(p.flip)
        .setScale(0)
        .setDepth(10);
      image.setInteractive({ useHandCursor: true });
      image.on('pointerdown', () => this.onTap(piece.uid));
      this.views.set(piece.uid, { image, baseScale: scale, baseAngle: p.angle });

      // 건조기에서 쏟아지듯 톡톡 등장
      this.tweens.add({ targets: image, scale, duration: 320, delay: i * 45, ease: 'Back.easeOut' });
    });
  }

  private onTap(uid: number): void {
    const result = this.match.select(uid);
    this.applyResult(result);
  }

  private applyResult(r: SelectResult): void {
    switch (r.kind) {
      case 'selected':
        sfx.select();
        this.lift(r.uid, true);
        break;
      case 'deselected':
        this.lift(r.uid, false);
        break;
      case 'match':
        sfx.pop(r.combo);
        this.playMatch(r.a, r.b, r.gained, r.combo);
        break;
      case 'mismatch':
        sfx.wrong();
        this.playMismatch(r.a, r.b, r.penaltyMs);
        break;
    }
  }

  /** 선택된 양말을 살짝 들어 올리고 링 표시 */
  private lift(uid: number, on: boolean): void {
    const v = this.views.get(uid);
    if (!v) return;
    this.tweens.killTweensOf(v.image);
    this.tweens.add({ targets: v.image, scale: v.baseScale * (on ? 1.15 : 1), angle: on ? 0 : v.baseAngle, duration: 140, ease: 'Back.easeOut' });
    v.image.setDepth(on ? 20 : 10);
    this.ring.setVisible(on).setPosition(v.image.x, v.image.y).setScale(on ? 0.6 : 1);
    if (on) this.tweens.add({ targets: this.ring, scale: 1, duration: 160, ease: 'Back.easeOut' });
  }

  /** 짝 맞춤: 두 번째 양말이 첫 번째로 날아가 붙은 뒤 '뽁' */
  private playMatch(a: number, b: number, gained: number, combo: number): void {
    const va = this.views.get(a)!;
    const vb = this.views.get(b)!;
    this.ring.setVisible(false);
    va.image.disableInteractive();
    vb.image.disableInteractive();
    this.tweens.killTweensOf([va.image, vb.image]);
    vb.image.setDepth(21);

    const cx = va.image.x;
    const cy = va.image.y;

    this.tweens.add({
      targets: vb.image,
      x: cx + 18,
      y: cy - 6,
      angle: 0,
      scale: va.baseScale * 1.15,
      duration: 150,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.tweens.add({
          targets: [va.image, vb.image],
          scale: va.baseScale * 1.45,
          duration: 90,
          yoyo: false,
          ease: 'Quad.easeOut',
          onComplete: () => {
            this.burstBubbles(cx, cy);
            this.tweens.add({
              targets: [va.image, vb.image],
              scale: 0,
              alpha: 0,
              duration: 140,
              ease: 'Back.easeIn',
              onComplete: () => {
                va.image.destroy();
                vb.image.destroy();
              },
            });
          },
        });
      },
    });

    this.floatText(cx, cy - 80, `+${gained}`, T.accent, 46);
    if (combo >= 2) this.showCombo(combo);
  }

  /** 오답: 둘 다 흔들고 빨갛게 반짝, 시간 감점 표시 */
  private playMismatch(a: number, b: number, penaltyMs: number): void {
    this.ring.setVisible(false);
    for (const uid of [a, b]) {
      const v = this.views.get(uid);
      if (!v) continue;
      this.tweens.killTweensOf(v.image);
      v.image.setDepth(10).setScale(v.baseScale).setAngle(v.baseAngle);
      v.image.setTint(0xffc8c8);
      this.tweens.add({
        targets: v.image,
        angle: v.baseAngle + 10,
        duration: 50,
        yoyo: true,
        repeat: 3,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          v.image.clearTint();
          v.image.setAngle(v.baseAngle);
        },
      });
    }
    this.cameras.main.shake(120, 0.004);
    if (penaltyMs > 0) {
      this.floatText(GAME_CONFIG.width / 2, 180, `-${penaltyMs / 1000}초`, T.bad, 40);
    }
    this.comboText.setAlpha(0);
  }

  private burstBubbles(x: number, y: number): void {
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.4;
      const dist = Phaser.Math.Between(70, 130);
      const b = this.add
        .circle(x, y, Phaser.Math.Between(8, 18), 0xffffff, 0.8)
        .setStrokeStyle(3, i % 2 ? 0xa8d8ff : 0xffb3c7, 1)
        .setDepth(30);
      this.tweens.add({
        targets: b,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        scale: 0.2,
        alpha: 0,
        duration: Phaser.Math.Between(350, 550),
        ease: 'Cubic.easeOut',
        onComplete: () => b.destroy(),
      });
    }
  }

  private floatText(x: number, y: number, msg: string, color: string, size: number): void {
    const t = this.add.text(x, y, msg, textStyle(size, color)).setOrigin(0.5).setStroke('#ffffff', 8).setDepth(40);
    this.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 700, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
  }

  private showCombo(combo: number): void {
    this.tweens.killTweensOf(this.comboText);
    this.comboText.setText(`${combo} 콤보!`).setAlpha(1).setScale(0.5);
    this.tweens.add({ targets: this.comboText, scale: 1, duration: 220, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.comboText, alpha: 0, delay: 900, duration: 400 });
  }

  // ---------- HUD ----------

  private createHud(): void {
    const { width } = GAME_CONFIG;
    this.add.text(50, 50, '점수', textStyle(26, T.text, false)).setOrigin(0, 0.5);
    this.scoreText = this.add.text(50, 92, '0', textStyle(48, T.accent)).setOrigin(0, 0.5);
    this.timeText = this.add.text(width - 50, 80, '', textStyle(56)).setOrigin(1, 0.5);
    this.timeBar = this.add.graphics();
    this.comboText = this.add.text(width / 2, 80, '', textStyle(52, T.good)).setOrigin(0.5).setStroke('#ffffff', 10).setAlpha(0).setDepth(40);
    this.refreshHud();
  }

  private refreshHud(): void {
    const { width, timeLimitSec } = GAME_CONFIG;
    const left = this.match.timeLeftMs;
    const ratio = Phaser.Math.Clamp(left / (timeLimitSec * 1000), 0, 1);
    const urgent = left <= 10_000;

    this.scoreText.setText(this.match.score.toLocaleString());
    this.timeText.setText(`${Math.ceil(left / 1000)}`).setColor(urgent ? T.bad : T.text);

    const x = 50;
    const y = 140;
    const w = width - 100;
    const h = 22;
    this.timeBar.clear();
    this.timeBar.fillStyle(0xffffff, 0.9);
    this.timeBar.fillRoundedRect(x, y, w, h, h / 2);
    if (ratio > 0) {
      this.timeBar.fillStyle(urgent ? 0xff8fa3 : 0x9fd8c0, 1);
      this.timeBar.fillRoundedRect(x, y, Math.max(h, w * ratio), h, h / 2);
    }
  }

  // ---------- 종료 ----------

  private finish(): void {
    this.ended = true;
    this.input.enabled = false;
    const summary = this.match.summary();
    const cleared = summary.status === 'cleared';
    if (cleared) sfx.clear();
    else sfx.fail();

    this.time.delayedCall(cleared ? 700 : 500, () => {
      this.input.enabled = true;
      this.scene.start(SceneKeys.Result, summary);
    });
  }
}
