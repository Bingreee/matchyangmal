import * as Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { MatchGame, type SelectResult } from '../logic/MatchGame';
import { getStage, newRun, type RunState } from '../logic/stages';
import { sfx } from '../audio/sfx';
import { scatterPlacements } from '../view/layout';
import { ensureSockAtlas, SOCK_ATLAS_KEY, sockFrame } from '../view/sockTexture';
import { createButton, drawBackground, drawCard, drawTray, showStars, textStyle } from '../view/ui';
import { SceneKeys } from './keys';

const T = GAME_CONFIG.theme;

interface SockView {
  image: Phaser.GameObjects.Image;
  baseScale: number;
  baseAngle: number;
}

export interface GameSceneData {
  run?: RunState;
}

/** 화면 담당. 규칙 판정은 전부 MatchGame에 맡기고, 결과에 맞춰 애니메이션만 보여 줍니다. */
export class GameScene extends Phaser.Scene {
  private run!: RunState;
  private match!: MatchGame;
  private views = new Map<number, SockView>();
  private ring!: Phaser.GameObjects.Arc;
  private timeBar!: Phaser.GameObjects.Graphics;
  private timeText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private pairsText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private started = false;
  private ended = false;
  private topDepth = 100;

  constructor() {
    super(SceneKeys.Game);
  }

  init(data: GameSceneData): void {
    this.run = data?.run ?? newRun();
  }

  create(): void {
    this.match = new MatchGame(getStage(this.run.stage));
    this.views.clear();
    this.started = false;
    this.ended = false;
    this.topDepth = 100;
    this.input.enabled = true;

    drawBackground(this);
    drawTray(this);
    this.createHud();
    this.createSocks();
    this.showStageBanner();
  }

  update(_time: number, delta: number): void {
    if (!this.started || this.ended) return;
    this.match.tick(delta);
    this.refreshHud();
    if (this.match.status !== 'playing') this.finish();
  }

  // ---------- 양말 ----------

  private createSocks(): void {
    ensureSockAtlas(this);
    const scale = this.match.stage.scale;
    const placements = scatterPlacements(this.match.pieces.length, scale);

    this.ring = this.add
      .circle(0, 0, 96 * scale, 0xffffff, 0.6)
      .setStrokeStyle(6, 0xff9fbd, 1)
      .setVisible(false)
      .setDepth(99);

    this.match.pieces.forEach((piece, i) => {
      const p = placements[i];
      const image = this.add
        .image(p.x, p.y - 260, SOCK_ATLAS_KEY, sockFrame(piece.design))
        .setAngle(p.angle * 3)
        .setFlipX(p.flip)
        .setScale(scale)
        .setAlpha(0)
        .setDepth(10 + i);
      // 투명한 부분은 터치가 통과하도록 픽셀 단위로 판정 (겹친 더미에서 아래 양말도 집을 수 있게)
      image.setInteractive({ pixelPerfect: true, alphaTolerance: 60, useHandCursor: true });
      image.on('pointerdown', () => this.onTap(piece.uid));
      this.views.set(piece.uid, { image, baseScale: scale, baseAngle: p.angle });

      // 건조기에서 쏟아지듯 위에서 툭툭 떨어짐
      this.tweens.add({
        targets: image,
        y: p.y,
        angle: p.angle,
        alpha: 1,
        duration: 420,
        delay: 150 + i * 35,
        ease: 'Bounce.easeOut',
      });
    });
  }

  private showStageBanner(): void {
    const { width } = GAME_CONFIG;
    const cy = (GAME_CONFIG.tray.top + GAME_CONFIG.tray.bottom) / 2;
    const s = this.match.stage;
    const title = this.add
      .text(width / 2, cy - 30, `스테이지 ${s.number}`, textStyle(84, T.accent))
      .setOrigin(0.5)
      .setStroke('#ffffff', 16)
      .setDepth(300)
      .setScale(0.4);
    const sub = this.add
      .text(width / 2, cy + 50, `양말 ${s.pairs}켤레 · ${s.timeSec}초`, textStyle(36, T.text))
      .setOrigin(0.5)
      .setStroke('#ffffff', 10)
      .setDepth(300)
      .setAlpha(0);
    this.tweens.add({ targets: title, scale: 1, duration: 350, ease: 'Back.easeOut' });
    this.tweens.add({ targets: sub, alpha: 1, duration: 300, delay: 150 });
    this.tweens.add({
      targets: [title, sub],
      alpha: 0,
      y: '-=40',
      delay: 1100,
      duration: 300,
      onComplete: () => {
        title.destroy();
        sub.destroy();
        this.started = true;
      },
    });
  }

  private onTap(uid: number): void {
    if (!this.started || this.ended) return;
    this.applyResult(this.match.select(uid));
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
    this.refreshHud();
  }

  /** 선택된 양말을 더미 맨 위로 꺼내 살짝 들어 올리고 링 표시 */
  private lift(uid: number, on: boolean): void {
    const v = this.views.get(uid);
    if (!v) return;
    this.tweens.killTweensOf(v.image);
    this.tweens.add({ targets: v.image, scale: v.baseScale * (on ? 1.15 : 1), angle: on ? 0 : v.baseAngle, duration: 140, ease: 'Back.easeOut' });
    if (on) v.image.setDepth(++this.topDepth + 200);
    else v.image.setDepth(++this.topDepth);
    this.ring.setVisible(on).setPosition(v.image.x, v.image.y).setScale(on ? 0.6 : 1).setDepth(v.image.depth - 0.5);
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
    va.image.setDepth(1000);
    vb.image.setDepth(1001);

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

  /** 오답: 둘 다 흔들고 붉게 반짝, 시간 감점 표시 */
  private playMismatch(a: number, b: number, penaltyMs: number): void {
    this.ring.setVisible(false);
    for (const uid of [a, b]) {
      const v = this.views.get(uid);
      if (!v) continue;
      this.tweens.killTweensOf(v.image);
      v.image.setScale(v.baseScale).setAngle(v.baseAngle).setDepth(++this.topDepth);
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
    if (penaltyMs > 0) this.floatText(600, 150, `-${penaltyMs / 1000}초`, T.bad, 40);
    this.tweens.killTweensOf(this.comboText);
    this.comboText.setAlpha(0);
  }

  private burstBubbles(x: number, y: number): void {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.4;
      const dist = Phaser.Math.Between(70, 140);
      const b = this.add
        .circle(x, y, Phaser.Math.Between(8, 18), 0xffffff, 0.85)
        .setStrokeStyle(3, i % 2 ? 0xa8d8ff : 0xffb3c7, 1)
        .setDepth(1100);
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
    const t = this.add.text(x, y, msg, textStyle(size, color)).setOrigin(0.5).setStroke('#ffffff', 8).setDepth(1200);
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
    drawCard(this, 24, 28, width - 48, 196, 40);

    // 스테이지 알약 배지
    const pill = this.add.graphics();
    pill.fillStyle(0xffe3ec, 1);
    pill.fillRoundedRect(52, 48, 190, 50, 25);
    this.add.text(147, 73, `STAGE ${this.match.stage.number}`, textStyle(28, T.accent)).setOrigin(0.5);

    this.add.text(60, 128, '점수', textStyle(24, T.text, false)).setOrigin(0, 0.5).setAlpha(0.75);
    this.scoreText = this.add.text(60, 166, '', textStyle(44, T.accent)).setOrigin(0, 0.5);

    this.add.text(width / 2, 128, '남은 짝', textStyle(24, T.text, false)).setOrigin(0.5).setAlpha(0.75);
    this.pairsText = this.add.text(width / 2, 166, '', textStyle(44)).setOrigin(0.5);

    this.add.text(width - 60, 73, '남은 시간', textStyle(24, T.text, false)).setOrigin(1, 0.5).setAlpha(0.75);
    this.timeText = this.add.text(width - 60, 138, '', textStyle(72)).setOrigin(1, 0.5);

    this.timeBar = this.add.graphics();
    this.comboText = this.add
      .text(width / 2, GAME_CONFIG.tray.top + 70, '', textStyle(60, T.good))
      .setOrigin(0.5)
      .setStroke('#ffffff', 12)
      .setAlpha(0)
      .setDepth(1200);
    this.refreshHud();
  }

  private refreshHud(): void {
    const { width } = GAME_CONFIG;
    const left = this.match.timeLeftMs;
    const ratio = Phaser.Math.Clamp(left / this.match.timeLimitMs, 0, 1);
    const urgent = left <= 10_000;

    this.scoreText.setText((this.run.totalScore + this.match.score).toLocaleString());
    this.pairsText.setText(`${this.match.totalPairs - this.match.matchedPairs}`);
    this.timeText.setText(`${Math.ceil(left / 1000)}`).setColor(urgent ? T.bad : T.text);

    const x = 52;
    const y = 200;
    const w = width - 104;
    const h = 12;
    this.timeBar.clear();
    this.timeBar.fillStyle(0xf0eaf8, 1);
    this.timeBar.fillRoundedRect(x, y, w, h, h / 2);
    if (ratio > 0) {
      this.timeBar.fillStyle(urgent ? 0xff8fa3 : 0x9fd8c0, 1);
      this.timeBar.fillRoundedRect(x, y, Math.max(h, w * ratio), h, h / 2);
    }
  }

  // ---------- 종료 ----------

  private finish(): void {
    this.ended = true;
    this.ring.setVisible(false);
    const summary = this.match.summary();
    const run: RunState = {
      ...this.run,
      totalScore: this.run.totalScore + summary.score,
      maxCombo: Math.max(this.run.maxCombo, summary.maxCombo),
      totalStars: this.run.totalStars + summary.stars,
    };

    if (summary.status === 'cleared') {
      sfx.clear();
      this.time.delayedCall(650, () => this.showStageClear(run, summary.stars, summary.score, summary.timeBonus));
    } else {
      sfx.fail();
      this.input.enabled = false;
      this.time.delayedCall(600, () => this.scene.start(SceneKeys.Result, { run, failedStage: this.run.stage }));
    }
  }

  /** 스테이지 클리어 창: 별점, 이번 스테이지 점수, 다음 스테이지 버튼 */
  private showStageClear(run: RunState, stars: number, stageScore: number, timeBonus: number): void {
    const { width, height } = GAME_CONFIG;
    const D = 2000;
    const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x5b5470, 0).setDepth(D).setInteractive();
    this.tweens.add({ targets: dim, fillAlpha: 0.35, duration: 250 });

    const panel = this.add.container(0, 0).setDepth(D + 1);
    const card = drawCard(this, 70, 330, width - 140, 620, 48);
    panel.add(card);
    panel.add(this.add.text(width / 2, 420, `스테이지 ${this.match.stage.number} 클리어!`, textStyle(54, T.accent)).setOrigin(0.5));
    panel.add(this.add.text(width / 2, 650, `+${stageScore.toLocaleString()}`, textStyle(72, T.accent)).setOrigin(0.5));
    panel.add(this.add.text(width / 2, 730, `남은 시간 보너스 +${timeBonus}`, textStyle(30, T.text, false)).setOrigin(0.5));
    panel.add(this.add.text(width / 2, 780, `누적 점수 ${run.totalScore.toLocaleString()}`, textStyle(30, T.text, false)).setOrigin(0.5));
    panel.setAlpha(0).setY(40);
    this.tweens.add({ targets: panel, alpha: 1, y: 0, duration: 300, ease: 'Back.easeOut' });

    showStars(this, width / 2, 530, stars, 44, D + 2);

    const next = createButton(this, width / 2, 870, '다음 스테이지', () => {
      this.scene.restart({ run: { ...run, stage: run.stage + 1 } } satisfies GameSceneData);
    });
    next.setDepth(D + 3);
  }
}
