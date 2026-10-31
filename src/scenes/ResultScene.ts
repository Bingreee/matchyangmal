import * as Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { newRun, type RunState } from '../logic/stages';
import { recordResult } from '../storage/SaveStore';
import { createButton, drawBackground, drawCard, textStyle } from '../view/ui';
import { SceneKeys } from './keys';
import type { GameSceneData } from './GameScene';

const T = GAME_CONFIG.theme;

export interface ResultSceneData {
  run: RunState;
  /** 시간이 다 된 스테이지 */
  failedStage: number;
}

export class ResultScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Result);
  }

  create({ run, failedStage }: ResultSceneData): void {
    const { width } = GAME_CONFIG;
    drawBackground(this);

    const clearedStages = failedStage - 1;
    const { best, isNewBest, bestStage } = recordResult(run.totalScore, clearedStages);

    const title = this.add.text(width / 2, 210, '시간 초과!', textStyle(100, T.text)).setOrigin(0.5).setStroke('#ffffff', 14).setScale(0.3);
    this.tweens.add({ targets: title, scale: 1, duration: 450, ease: 'Back.easeOut' });

    this.add
      .text(width / 2, 310, clearedStages > 0 ? `스테이지 ${failedStage}에서 멈췄어요` : '아직 짝을 못 찾은 양말이 있어요', textStyle(34, T.text, false))
      .setOrigin(0.5);

    drawCard(this, 70, 380, width - 140, 500, 44);

    this.add.text(width / 2, 445, '총 점수', textStyle(30, T.text, false)).setOrigin(0.5).setAlpha(0.8);
    const scoreText = this.add.text(width / 2, 525, '0', textStyle(100, T.accent)).setOrigin(0.5);
    this.tweens.addCounter({
      from: 0,
      to: run.totalScore,
      duration: 800,
      ease: 'Cubic.easeOut',
      onUpdate: (tw) => scoreText.setText(Math.round(tw.getValue() ?? 0).toLocaleString()),
    });

    // 통계 3칸
    const stats: [string, string][] = [
      ['클리어', `${clearedStages}`],
      ['모은 별', `★ ${run.totalStars}`],
      ['최대 콤보', `${run.maxCombo}`],
    ];
    const colW = (width - 200) / 3;
    stats.forEach(([label, value], i) => {
      const x = 100 + colW * (i + 0.5);
      this.add.text(x, 650, value, textStyle(48, i === 1 ? '#e8a92c' : T.text)).setOrigin(0.5);
      this.add.text(x, 705, label, textStyle(26, T.text, false)).setOrigin(0.5).setAlpha(0.75);
    });

    const bestText = this.add
      .text(width / 2, 810, isNewBest ? `최고 기록 갱신!  ${best.toLocaleString()}` : `최고 점수 ${best.toLocaleString()} · 최고 ${bestStage}스테이지`, textStyle(32, isNewBest ? T.good : T.text))
      .setOrigin(0.5);
    if (isNewBest) this.tweens.add({ targets: bestText, scale: 1.08, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    createButton(this, width / 2, 1010, '다시 하기', () => this.scene.start(SceneKeys.Game, { run: newRun() } satisfies GameSceneData));
    createButton(this, width / 2, 1140, '처음으로', () => this.scene.start(SceneKeys.Title), {
      width: 280,
      height: 90,
      fontSize: 34,
      color: 0xb8a9e6,
    });
  }
}
