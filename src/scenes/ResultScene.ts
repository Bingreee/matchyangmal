import * as Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import type { GameSummary } from '../logic/MatchGame';
import { recordResult } from '../storage/SaveStore';
import { createButton, drawBackground, textStyle } from '../view/ui';
import { SceneKeys } from './keys';

const T = GAME_CONFIG.theme;

export class ResultScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Result);
  }

  create(summary: GameSummary): void {
    const { width } = GAME_CONFIG;
    drawBackground(this);

    const cleared = summary.status === 'cleared';
    const { best, isNewBest } = recordResult(summary.score);

    const title = this.add
      .text(width / 2, 250, cleared ? '클리어!' : '시간 초과', textStyle(110, cleared ? T.accent : T.text))
      .setOrigin(0.5)
      .setStroke('#ffffff', 14)
      .setScale(0.3);
    this.tweens.add({ targets: title, scale: 1, duration: 450, ease: 'Back.easeOut' });

    this.add
      .text(width / 2, 360, cleared ? '양말이 전부 제짝을 찾았어요' : '아직 짝을 못 찾은 양말이 있어요', textStyle(34, T.text, false))
      .setOrigin(0.5);

    // 점수 카드
    const card = this.add.graphics();
    card.fillStyle(0xffffff, 0.85);
    card.fillRoundedRect(80, 430, width - 160, 420, 40);

    this.add.text(width / 2, 490, '점수', textStyle(32, T.text, false)).setOrigin(0.5);
    const scoreText = this.add.text(width / 2, 570, '0', textStyle(96, T.accent)).setOrigin(0.5);
    this.tweens.addCounter({
      from: 0,
      to: summary.score,
      duration: 700,
      ease: 'Cubic.easeOut',
      onUpdate: (tw) => scoreText.setText(Math.round(tw.getValue() ?? 0).toLocaleString()),
    });

    const lines = [
      `맞춘 짝  ${summary.matchedPairs} / ${summary.totalPairs}`,
      `최대 콤보  ${summary.maxCombo}`,
      cleared ? `남은 시간 보너스  +${summary.timeBonus}` : '',
    ].filter(Boolean);
    this.add.text(width / 2, 700, lines.join('\n'), textStyle(32, T.text, false)).setOrigin(0.5).setLineSpacing(12);

    const bestText = this.add
      .text(width / 2, 900, isNewBest ? `최고 기록 갱신!  ${best.toLocaleString()}` : `최고 점수  ${best.toLocaleString()}`, textStyle(36, isNewBest ? T.good : T.text))
      .setOrigin(0.5);
    if (isNewBest) {
      this.tweens.add({ targets: bestText, scale: 1.08, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    createButton(this, width / 2, 1040, '다시 하기', () => this.scene.start(SceneKeys.Game));
    createButton(this, width / 2, 1170, '처음으로', () => this.scene.start(SceneKeys.Title), {
      width: 280,
      height: 90,
      fontSize: 34,
      color: 0xb8a9e6,
    });
  }
}
